// Apply a SQL file to a Supabase cloud project via the Management API.
// Usage:
//   node --env-file=.env.local scripts/apply-cloud-sql.mjs <relative-path-to-sql>
//
// Requires SUPABASE_ACCESS_TOKEN (PAT) and NEXT_PUBLIC_SUPABASE_URL in env.

import fs from "node:fs/promises";

const pat = process.env.SUPABASE_ACCESS_TOKEN;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!pat || !url) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}
const projRef = url.replace(/^https:\/\//, "").split(".")[0];

const file = process.argv[2];
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/apply-cloud-sql.mjs <file.sql>");
  process.exit(1);
}

const sql = await fs.readFile(file, "utf-8");
process.stdout.write(`Applying ${file} (${sql.length} bytes) to project ${projRef}... `);

const res = await fetch(`https://api.supabase.com/v1/projects/${projRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}\n${text}`);
  process.exit(1);
}
console.log("ok");
// Truncate huge result arrays
let out = text;
if (out.length > 600) out = out.slice(0, 600) + `... (${out.length} bytes)`;
console.log(out);
