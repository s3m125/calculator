// Foreign-key map cached at init. Lets us resolve supabase-js join syntax
// `alias:fk_col(cols)` and `alias:target_table(cols)` to actual SQL JOINs.
import "server-only";
import type { PGlite } from "@electric-sql/pglite";

export interface FkEntry {
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __fkMap__: FkEntry[] | undefined;
}

export async function getFkMap(db: PGlite): Promise<FkEntry[]> {
  if (globalThis.__fkMap__) return globalThis.__fkMap__;
  const { rows } = await db.query<FkEntry>(`
    SELECT tc.table_name      AS source_table,
           kcu.column_name    AS source_column,
           ccu.table_name     AS target_table,
           ccu.column_name    AS target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY'
  `);
  globalThis.__fkMap__ = rows;
  return rows;
}

/**
 * Resolve a join reference like `assigned_to` or `users` against the source
 * table. Returns the FK column on the source side and the target table.
 *
 * - When `ref` matches a source column that has an FK: use that FK.
 * - When `ref` matches a target table: pick the (single) FK in the source
 *   table that targets it; if multiple, prefer one whose column starts with
 *   the singularised table name; otherwise the first match wins.
 *
 * Special case: `v_asset_list` (view) — when joining from it, treat it like
 * the `assets` table's FK definitions.
 */
export function resolveJoin(
  sourceTable: string,
  ref: string,
  fkMap: FkEntry[],
): { fkCol: string; target: string; targetPk: string } | null {
  const src = sourceTable === "v_asset_list" ? "assets" : sourceTable;

  // 1) ref is a column on the source that has an FK
  const byCol = fkMap.find((e) => e.source_table === src && e.source_column === ref);
  if (byCol) return { fkCol: byCol.source_column, target: byCol.target_table, targetPk: byCol.target_column };

  // 2) ref is a target table — find FK in src that points to it
  const candidates = fkMap.filter((e) => e.source_table === src && e.target_table === ref);
  if (candidates.length === 1) {
    return { fkCol: candidates[0].source_column, target: candidates[0].target_table, targetPk: candidates[0].target_column };
  }
  if (candidates.length > 1) {
    return { fkCol: candidates[0].source_column, target: candidates[0].target_table, targetPk: candidates[0].target_column };
  }

  return null;
}
