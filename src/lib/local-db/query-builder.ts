// Supabase-js compatible query builder backed by pglite.
// Supports the subset of the API the app actually uses:
//   .from(table)
//   .select(cols, { count, head })
//   .insert(payload).select(cols).single()
//   .update(payload).eq(...)
//   .delete()
//   filters: eq, neq, lt, gt, lte, gte, like, ilike, in, is, not('col','is',null), or('a.eq.X,b.eq.Y')
//   .order(col, { ascending })
//   .limit(n) / .range(a,b)
//   .single() / .maybeSingle()
import "server-only";
import { getDb } from "./index";
import { getFkMap, resolveJoin, type FkEntry } from "./fk-map";

type Filter =
  | { t: "eq" | "neq" | "lt" | "gt" | "lte" | "gte" | "like" | "ilike"; col: string; val: unknown }
  | { t: "in"; col: string; vals: unknown[] }
  | { t: "is_null"; col: string; neg: boolean }
  | { t: "or"; clause: string };

interface SelectPart {
  kind: "col" | "join";
  expr?: string;
  alias?: string;
  ref?: string;
  inner?: SelectPart[];
}

function parseSelectCols(s: string): SelectPart[] {
  const parts: SelectPart[] = [];
  if (!s.trim()) return parts;

  const tokens: string[] = [];
  let depth = 0;
  let buf = "";
  for (const c of s) {
    if (c === "(") depth++;
    else if (c === ")") depth--;
    if (c === "," && depth === 0) {
      tokens.push(buf.trim());
      buf = "";
    } else {
      buf += c;
    }
  }
  if (buf.trim()) tokens.push(buf.trim());

  for (const t of tokens) {
    const lastParen = t.lastIndexOf(")");
    const firstParen = t.indexOf("(");
    const colon = t.indexOf(":");

    if (colon !== -1 && firstParen !== -1 && colon < firstParen) {
      const alias = t.slice(0, colon).trim();
      const ref = t.slice(colon + 1, firstParen).trim();
      const inner = t.slice(firstParen + 1, lastParen);
      parts.push({
        kind: "join",
        alias,
        ref,
        inner: parseSelectCols(inner),
      });
    } else if (firstParen !== -1) {
      // Form: tableName(cols) — same as alias=tableName, ref=tableName
      const alias = t.slice(0, firstParen).trim();
      const inner = t.slice(firstParen + 1, lastParen);
      parts.push({ kind: "join", alias, ref: alias, inner: parseSelectCols(inner) });
    } else {
      parts.push({ kind: "col", expr: t });
    }
  }
  return parts;
}

function quoteIdent(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

// `or` clause is supabase syntax like "qr_code.eq.X,asset_id.eq.X".
// Convert to SQL: `(qr_code = $1 OR asset_id = $2)`.
function parseOrClause(clause: string, addParam: (v: unknown) => string): string {
  const parts: string[] = [];
  let depth = 0;
  let buf = "";
  for (const c of clause) {
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === "," && depth === 0) {
      if (buf.trim()) parts.push(buf.trim());
      buf = "";
    } else {
      buf += c;
    }
  }
  if (buf.trim()) parts.push(buf.trim());

  const exprs: string[] = [];
  for (const p of parts) {
    // Format: column.op.value
    const m = p.match(/^([a-zA-Z0-9_]+)\.([a-z]+)\.(.+)$/);
    if (!m) continue;
    const [, col, op, valRaw] = m;
    const val = valRaw === "null" ? null : valRaw;
    switch (op) {
      case "eq":
        if (val === null) exprs.push(`${quoteIdent(col)} IS NULL`);
        else exprs.push(`${quoteIdent(col)} = ${addParam(val)}`);
        break;
      case "neq":
        if (val === null) exprs.push(`${quoteIdent(col)} IS NOT NULL`);
        else exprs.push(`${quoteIdent(col)} <> ${addParam(val)}`);
        break;
      case "like":
        exprs.push(`${quoteIdent(col)} LIKE ${addParam(val)}`);
        break;
      case "ilike":
        exprs.push(`${quoteIdent(col)} ILIKE ${addParam(val)}`);
        break;
      case "lt": exprs.push(`${quoteIdent(col)} < ${addParam(val)}`); break;
      case "gt": exprs.push(`${quoteIdent(col)} > ${addParam(val)}`); break;
      case "lte": exprs.push(`${quoteIdent(col)} <= ${addParam(val)}`); break;
      case "gte": exprs.push(`${quoteIdent(col)} >= ${addParam(val)}`); break;
      case "is":
        exprs.push(`${quoteIdent(col)} IS ${val === null ? "NULL" : addParam(val)}`);
        break;
    }
  }
  return exprs.length ? `(${exprs.join(" OR ")})` : "TRUE";
}

function buildJoinSubselect(
  sourceTable: string,
  alias: string,
  ref: string,
  innerParts: SelectPart[],
  fkMap: FkEntry[],
): string | null {
  const join = resolveJoin(sourceTable, ref, fkMap);
  if (!join) return null;

  const innerCols: string[] = [];
  for (const p of innerParts) {
    if (p.kind === "col") {
      innerCols.push(
        p.expr === "*"
          ? `${quoteIdent(join.target)}.*`
          : `${quoteIdent(join.target)}.${quoteIdent(p.expr!)}`,
      );
    } else {
      const sub = buildJoinSubselect(join.target, p.alias!, p.ref!, p.inner ?? [], fkMap);
      if (sub) innerCols.push(`(${sub}) AS ${quoteIdent(p.alias!)}`);
    }
  }

  return (
    `SELECT to_jsonb(__sub) FROM (` +
    `SELECT ${innerCols.join(", ")} FROM ${quoteIdent(join.target)} ` +
    `WHERE ${quoteIdent(join.target)}.${quoteIdent(join.targetPk)} = ${quoteIdent(sourceTable)}.${quoteIdent(join.fkCol)} ` +
    `LIMIT 1` +
    `) __sub`
  );
}

export type QResult = {
  // Intentionally loose to match the supabase-js runtime contract used
  // throughout the app (callers destructure & iterate data directly).
  data: any;
  error: { message: string } | null;
  count: number | null;
};

class QueryBuilder<Row = Record<string, unknown>>
  implements PromiseLike<QResult>
{
  private op: "select" | "insert" | "update" | "delete" = "select";
  private selectCols = "*";
  private filters: Filter[] = [];
  private orderBy?: { col: string; ascending: boolean };
  private limitN?: number;
  private offsetN?: number;
  private singleMode?: "single" | "maybeSingle";
  private countMode?: "exact";
  private headOnly = false;
  private payload?: unknown;
  // For insert/update with .select() chain
  private returning?: string;

  constructor(private table: string) {}

  // ----- mode setters
  select(cols = "*", opts?: { count?: "exact"; head?: boolean }): this {
    if (this.op === "insert" || this.op === "update") {
      this.returning = cols;
    } else {
      this.selectCols = cols;
      if (opts?.count) this.countMode = opts.count;
      if (opts?.head) this.headOnly = true;
    }
    return this;
  }
  insert(payload: unknown): this {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: unknown): this {
    this.op = "update";
    this.payload = payload;
    return this;
  }
  delete(): this {
    this.op = "delete";
    return this;
  }

  // ----- filters
  eq(col: string, val: unknown): this { this.filters.push({ t: "eq", col, val }); return this; }
  neq(col: string, val: unknown): this { this.filters.push({ t: "neq", col, val }); return this; }
  lt(col: string, val: unknown): this { this.filters.push({ t: "lt", col, val }); return this; }
  gt(col: string, val: unknown): this { this.filters.push({ t: "gt", col, val }); return this; }
  lte(col: string, val: unknown): this { this.filters.push({ t: "lte", col, val }); return this; }
  gte(col: string, val: unknown): this { this.filters.push({ t: "gte", col, val }); return this; }
  like(col: string, pattern: string): this { this.filters.push({ t: "like", col, val: pattern }); return this; }
  ilike(col: string, pattern: string): this { this.filters.push({ t: "ilike", col, val: pattern }); return this; }
  in(col: string, vals: unknown[]): this { this.filters.push({ t: "in", col, vals }); return this; }
  is(col: string, val: unknown): this {
    if (val === null) this.filters.push({ t: "is_null", col, neg: false });
    return this;
  }
  not(col: string, op: string, val: unknown): this {
    if (op === "is" && val === null) {
      this.filters.push({ t: "is_null", col, neg: true });
    } else if (op === "eq") {
      this.filters.push({ t: "neq", col, val });
    }
    return this;
  }
  or(clause: string): this { this.filters.push({ t: "or", clause }); return this; }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy = { col, ascending: opts?.ascending !== false };
    return this;
  }
  limit(n: number): this { this.limitN = n; return this; }
  range(from: number, to: number): this { this.offsetN = from; this.limitN = to - from + 1; return this; }

  single(): this { this.singleMode = "single"; return this; }
  maybeSingle(): this { this.singleMode = "maybeSingle"; return this; }

  // ----- execution
  async exec(): Promise<{ data: unknown; error: { message: string } | null; count: number | null }> {
    try {
      const db = await getDb();
      const fkMap = await getFkMap(db);
      const params: unknown[] = [];
      const addParam = (v: unknown) => {
        params.push(v);
        return `$${params.length}`;
      };

      // Build WHERE clause
      const whereExprs: string[] = [];
      for (const f of this.filters) {
        if (f.t === "or") {
          whereExprs.push(parseOrClause(f.clause, addParam));
        } else if (f.t === "is_null") {
          whereExprs.push(`${quoteIdent(f.col)} IS ${f.neg ? "NOT " : ""}NULL`);
        } else if (f.t === "in") {
          if (f.vals.length === 0) {
            whereExprs.push("FALSE");
          } else {
            const ps = f.vals.map((v) => addParam(v)).join(", ");
            whereExprs.push(`${quoteIdent(f.col)} IN (${ps})`);
          }
        } else {
          const opSql = {
            eq: "=", neq: "<>", lt: "<", gt: ">", lte: "<=", gte: ">=",
            like: "LIKE", ilike: "ILIKE",
          }[f.t];
          if (f.val === null && (f.t === "eq" || f.t === "neq")) {
            whereExprs.push(`${quoteIdent(f.col)} IS ${f.t === "neq" ? "NOT " : ""}NULL`);
          } else {
            whereExprs.push(`${quoteIdent(f.col)} ${opSql} ${addParam(f.val)}`);
          }
        }
      }
      const where = whereExprs.length ? ` WHERE ${whereExprs.join(" AND ")}` : "";

      if (this.op === "select") {
        return await this.execSelect(params, where, fkMap);
      }
      if (this.op === "insert") return await this.execInsert(params);
      if (this.op === "update") return await this.execUpdate(params, where);
      if (this.op === "delete") return await this.execDelete(params, where);

      return { data: null, error: { message: "Unknown op" }, count: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : String(err) },
        count: null,
      };
    }
  }

  private async execSelect(
    params: unknown[],
    where: string,
    fkMap: FkEntry[],
  ): Promise<{ data: unknown; error: null; count: number | null }> {
    const db = await getDb();
    const t = this.table;
    // Build select list
    const parts = parseSelectCols(this.selectCols);
    const colSqls: string[] = [];
    for (const p of parts) {
      if (p.kind === "col") {
        if (p.expr === "*") {
          colSqls.push(`${quoteIdent(t)}.*`);
        } else {
          colSqls.push(`${quoteIdent(t)}.${quoteIdent(p.expr!)}`);
        }
      } else {
        const sub = buildJoinSubselect(t, p.alias!, p.ref!, p.inner ?? [], fkMap);
        if (sub) {
          colSqls.push(`(${sub}) AS ${quoteIdent(p.alias!)}`);
        }
      }
    }
    if (colSqls.length === 0) colSqls.push(`${quoteIdent(t)}.*`);

    let count: number | null = null;
    if (this.countMode === "exact") {
      const cSql = `SELECT COUNT(*)::int AS c FROM ${quoteIdent(t)}${where}`;
      const r = await db.query<{ c: number }>(cSql, params);
      count = r.rows[0]?.c ?? 0;
    }

    if (this.headOnly) {
      return { data: null, error: null, count };
    }

    let sql = `SELECT ${colSqls.join(", ")} FROM ${quoteIdent(t)}${where}`;
    if (this.orderBy) {
      sql += ` ORDER BY ${quoteIdent(this.orderBy.col)} ${this.orderBy.ascending ? "ASC" : "DESC"} NULLS LAST`;
    }
    if (this.limitN != null) sql += ` LIMIT ${this.limitN}`;
    if (this.offsetN != null) sql += ` OFFSET ${this.offsetN}`;

    const { rows } = await db.query<Row>(sql, params);

    if (this.singleMode === "single") {
      if (rows.length === 0)
        return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" } as never, count };
      return { data: rows[0], error: null, count };
    }
    if (this.singleMode === "maybeSingle") {
      return { data: rows[0] ?? null, error: null, count };
    }

    return { data: rows, error: null, count };
  }

  private async execInsert(params: unknown[]): Promise<{ data: unknown; error: null; count: number | null }> {
    const db = await getDb();
    const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
    if (rows.length === 0) return { data: [], error: null, count: 0 };

    // Collect all column names (union)
    const allCols = new Set<string>();
    for (const r of rows) {
      for (const k of Object.keys(r as Record<string, unknown>)) allCols.add(k);
    }
    const cols = Array.from(allCols);

    const valuesSql: string[] = [];
    for (const r of rows as Record<string, unknown>[]) {
      const vals: string[] = [];
      for (const c of cols) {
        const v = r[c];
        if (v === undefined) vals.push("DEFAULT");
        else {
          params.push(v);
          vals.push(`$${params.length}`);
        }
      }
      valuesSql.push(`(${vals.join(", ")})`);
    }

    let sql = `INSERT INTO ${quoteIdent(this.table)} (${cols.map(quoteIdent).join(", ")}) VALUES ${valuesSql.join(", ")}`;
    if (this.returning) {
      sql += ` RETURNING ${this.returning === "*" ? "*" : this.returning.split(",").map((c) => quoteIdent(c.trim())).join(", ")}`;
    }
    const { rows: out } = await db.query<Row>(sql, params);

    if (this.singleMode === "single") return { data: out[0] ?? null, error: null, count: out.length };
    if (this.singleMode === "maybeSingle") return { data: out[0] ?? null, error: null, count: out.length };
    return { data: this.returning ? out : null, error: null, count: out.length };
  }

  private async execUpdate(params: unknown[], where: string): Promise<{ data: unknown; error: null; count: number | null }> {
    const db = await getDb();
    const payload = this.payload as Record<string, unknown>;
    const setParts: string[] = [];
    for (const [k, v] of Object.entries(payload)) {
      params.push(v);
      setParts.push(`${quoteIdent(k)} = $${params.length}`);
    }
    if (setParts.length === 0) return { data: null, error: null, count: 0 };

    let sql = `UPDATE ${quoteIdent(this.table)} SET ${setParts.join(", ")}${where}`;
    if (this.returning) {
      sql += ` RETURNING ${this.returning === "*" ? "*" : this.returning.split(",").map((c) => quoteIdent(c.trim())).join(", ")}`;
    }
    const { rows: out } = await db.query<Row>(sql, params);
    if (this.singleMode === "single") return { data: out[0] ?? null, error: null, count: out.length };
    if (this.singleMode === "maybeSingle") return { data: out[0] ?? null, error: null, count: out.length };
    return { data: this.returning ? out : null, error: null, count: out.length };
  }

  private async execDelete(params: unknown[], where: string): Promise<{ data: null; error: null; count: number | null }> {
    const db = await getDb();
    await db.query(`DELETE FROM ${quoteIdent(this.table)}${where}`, params);
    return { data: null, error: null, count: null };
  }

  // PromiseLike — declared so `await qb` yields QResult by default
  then<TResult1 = QResult, TResult2 = never>(
    onfulfilled?: ((value: QResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected) as Promise<TResult1 | TResult2>;
  }
}

export function from(table: string): QueryBuilder {
  return new QueryBuilder(table);
}
