// Browser-side query builder for local mode. Sends a Spec object over HTTP
// to /api/local/db, which runs it through the same server-side builder.
// Same chain methods as the server one so callers don't need to change.

type Filter =
  | { t: "eq" | "neq" | "lt" | "gt" | "lte" | "gte" | "like" | "ilike"; col: string; val: unknown }
  | { t: "in"; col: string; vals: unknown[] }
  | { t: "is_null"; col: string; neg: boolean }
  | { t: "or"; clause: string };

interface Spec {
  table: string;
  op: "select" | "insert" | "update" | "delete";
  selectCols?: string;
  count?: "exact";
  head?: boolean;
  filters: Filter[];
  order?: { col: string; ascending: boolean };
  limit?: number;
  range?: [number, number];
  singleMode?: "single" | "maybeSingle";
  payload?: unknown;
  returning?: string;
}

export type QResult = {
  // See query-builder.ts for the rationale on `any` here.
  data: any;
  error: { message: string } | null;
  count: number | null;
};

class BrowserQB implements PromiseLike<QResult> {
  private spec: Spec;
  constructor(table: string) {
    this.spec = { table, op: "select", filters: [] };
  }

  select(cols = "*", opts?: { count?: "exact"; head?: boolean }): this {
    if (this.spec.op === "insert" || this.spec.op === "update") {
      this.spec.returning = cols;
    } else {
      this.spec.selectCols = cols;
      if (opts?.count) this.spec.count = opts.count;
      if (opts?.head) this.spec.head = opts.head;
    }
    return this;
  }
  insert(payload: unknown): this { this.spec.op = "insert"; this.spec.payload = payload; return this; }
  update(payload: unknown): this { this.spec.op = "update"; this.spec.payload = payload; return this; }
  delete(): this { this.spec.op = "delete"; return this; }

  eq(col: string, val: unknown): this { this.spec.filters.push({ t: "eq", col, val }); return this; }
  neq(col: string, val: unknown): this { this.spec.filters.push({ t: "neq", col, val }); return this; }
  lt(col: string, val: unknown): this { this.spec.filters.push({ t: "lt", col, val }); return this; }
  gt(col: string, val: unknown): this { this.spec.filters.push({ t: "gt", col, val }); return this; }
  lte(col: string, val: unknown): this { this.spec.filters.push({ t: "lte", col, val }); return this; }
  gte(col: string, val: unknown): this { this.spec.filters.push({ t: "gte", col, val }); return this; }
  like(col: string, pattern: string): this { this.spec.filters.push({ t: "like", col, val: pattern }); return this; }
  ilike(col: string, pattern: string): this { this.spec.filters.push({ t: "ilike", col, val: pattern }); return this; }
  in(col: string, vals: unknown[]): this { this.spec.filters.push({ t: "in", col, vals }); return this; }
  is(col: string, val: unknown): this {
    if (val === null) this.spec.filters.push({ t: "is_null", col, neg: false });
    return this;
  }
  not(col: string, op: string, val: unknown): this {
    if (op === "is" && val === null) this.spec.filters.push({ t: "is_null", col, neg: true });
    else if (op === "eq") this.spec.filters.push({ t: "neq", col, val });
    return this;
  }
  or(clause: string): this { this.spec.filters.push({ t: "or", clause }); return this; }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.spec.order = { col, ascending: opts?.ascending !== false };
    return this;
  }
  limit(n: number): this { this.spec.limit = n; return this; }
  range(from: number, to: number): this { this.spec.range = [from, to]; return this; }
  single(): this { this.spec.singleMode = "single"; return this; }
  maybeSingle(): this { this.spec.singleMode = "maybeSingle"; return this; }

  async exec(): Promise<{ data: unknown; error: { message: string } | null; count: number | null }> {
    try {
      const res = await fetch("/api/local/db", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(this.spec),
      });
      if (!res.ok) {
        return { data: null, error: { message: `HTTP ${res.status}` }, count: null };
      }
      return await res.json();
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : String(err) },
        count: null,
      };
    }
  }

  then<TResult1 = QResult, TResult2 = never>(
    onfulfilled?: ((value: QResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected) as Promise<TResult1 | TResult2>;
  }
}

export interface LocalBrowserUser {
  id: string;
  email: string;
}

interface LocalBrowserClient {
  from(table: string): BrowserQB;
  auth: {
    signInWithPassword(args: { email: string; password: string }): Promise<{ data: { user: LocalBrowserUser } | null; error: { message: string } | null }>;
    signOut(): Promise<void>;
    getUser(): Promise<{ data: { user: LocalBrowserUser | null } }>;
  };
}

export function createBrowserLocalClient(): LocalBrowserClient {
  return {
    from(table: string) {
      return new BrowserQB(table);
    },
    auth: {
      async signInWithPassword({ email, password }) {
        const res = await fetch("/api/local/auth/signin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (!res.ok) return { data: null, error: { message: json.error ?? "Sign in failed" } };
        return { data: { user: json.user }, error: null };
      },
      async signOut() {
        await fetch("/api/local/auth/signout", { method: "POST" });
      },
      async getUser() {
        const res = await fetch("/api/local/auth/user");
        if (!res.ok) return { data: { user: null } };
        const json = await res.json();
        return { data: { user: json.user ?? null } };
      },
    },
  };
}
