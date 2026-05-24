// Bridge for browser-side mutations in local mode. Re-runs the same
// query-builder pipeline on the server using the user's cookie auth.
import { NextResponse } from "next/server";
import { from as localFrom } from "@/lib/local-db/query-builder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface OpSpec {
  table: string;
  op: "select" | "insert" | "update" | "delete";
  selectCols?: string;
  count?: "exact";
  head?: boolean;
  filters?: Array<
    | { t: "eq" | "neq" | "lt" | "gt" | "lte" | "gte" | "like" | "ilike"; col: string; val: unknown }
    | { t: "in"; col: string; vals: unknown[] }
    | { t: "is_null"; col: string; neg: boolean }
    | { t: "or"; clause: string }
  >;
  order?: { col: string; ascending: boolean };
  limit?: number;
  range?: [number, number];
  singleMode?: "single" | "maybeSingle";
  payload?: unknown;
  returning?: string;
}

export async function POST(req: Request) {
  const spec = (await req.json()) as OpSpec;
  let qb = localFrom(spec.table);

  if (spec.op === "insert") qb = qb.insert(spec.payload);
  else if (spec.op === "update") qb = qb.update(spec.payload);
  else if (spec.op === "delete") qb = qb.delete();

  if (spec.op === "select") {
    qb.select(spec.selectCols ?? "*", { count: spec.count, head: spec.head });
  } else if (spec.returning) {
    qb.select(spec.returning);
  }

  if (spec.filters) {
    for (const f of spec.filters) {
      if (f.t === "eq") qb.eq(f.col, f.val);
      else if (f.t === "neq") qb.neq(f.col, f.val);
      else if (f.t === "lt") qb.lt(f.col, f.val);
      else if (f.t === "gt") qb.gt(f.col, f.val);
      else if (f.t === "lte") qb.lte(f.col, f.val);
      else if (f.t === "gte") qb.gte(f.col, f.val);
      else if (f.t === "like") qb.like(f.col, f.val as string);
      else if (f.t === "ilike") qb.ilike(f.col, f.val as string);
      else if (f.t === "in") qb.in(f.col, f.vals);
      else if (f.t === "is_null") {
        if (f.neg) qb.not(f.col, "is", null);
        else qb.is(f.col, null);
      } else if (f.t === "or") qb.or(f.clause);
    }
  }
  if (spec.order) qb.order(spec.order.col, { ascending: spec.order.ascending });
  if (spec.limit != null) qb.limit(spec.limit);
  if (spec.range) qb.range(spec.range[0], spec.range[1]);
  if (spec.singleMode === "single") qb.single();
  else if (spec.singleMode === "maybeSingle") qb.maybeSingle();

  const result = await qb;
  return NextResponse.json(result);
}
