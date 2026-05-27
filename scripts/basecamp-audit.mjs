// Audit ALL Basecamp projects (active + archived + trashed) for cleanup.
// Usage: node --env-file=.env.local scripts/basecamp-audit.mjs

const ACCT = process.env.BASECAMP_ACCOUNT_ID;
const TOKEN = process.env.BASECAMP_ACCESS_TOKEN;
const UA = process.env.BASECAMP_USER_AGENT;
if (!ACCT || !TOKEN || !UA) throw new Error("Missing BASECAMP_* env vars");

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "User-Agent": UA,
  Accept: "application/json",
};

function parseNext(linkHeader) {
  if (!linkHeader) return null;
  const m = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return m ? m[1] : null;
}

async function fetchAll(initialUrl) {
  const items = [];
  let url = initialUrl;
  while (url) {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${url} :: ${t.slice(0, 200)}`);
    }
    const page = await res.json();
    items.push(...page);
    url = parseNext(res.headers.get("link"));
  }
  return items;
}

const ms_in_day = 86400000;

function ageDays(iso) {
  const t = new Date(iso).getTime();
  return Math.floor((Date.now() - t) / ms_in_day);
}

function fmtDate(iso) {
  return iso?.slice(0, 10) ?? "-";
}

function escMd(s) {
  return (s ?? "").replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
}

function truncate(s, n) {
  s = (s ?? "").replace(/<[^>]+>/g, "").trim(); // strip HTML the API returns in `description`
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

const base = `https://3.basecampapi.com/${ACCT}/projects.json`;

console.log("Fetching active + archived + trashed projects ...\n");
const [active, archived, trashed] = await Promise.all([
  fetchAll(base),
  fetchAll(base + "?status=archived"),
  fetchAll(base + "?status=trashed"),
]);

console.log(`active=${active.length}  archived=${archived.length}  trashed=${trashed.length}\n`);

// --- ACTIVE: full detail ---
active.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

console.log("## Active projects (oldest update first)\n");
console.log("| ID | Name | Status | Last Updated | Age | Purpose | Description |");
console.log("|---|---|---|---|---|---|---|");
for (const p of active) {
  console.log(
    `| ${p.id} | ${escMd(p.name)} | ${p.status} | ${fmtDate(p.updated_at)} | ${ageDays(p.updated_at)} d | ${p.purpose ?? "-"} | ${escMd(truncate(p.description, 120)) || "_(no description)_"} |`,
  );
}

// --- ARCHIVED ---
archived.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
console.log("\n## Archived projects\n");
if (archived.length === 0) {
  console.log("_(none)_");
} else {
  console.log("| ID | Name | Status | Last Updated | Age |");
  console.log("|---|---|---|---|---|");
  for (const p of archived) {
    console.log(`| ${p.id} | ${escMd(p.name)} | ${p.status} | ${fmtDate(p.updated_at)} | ${ageDays(p.updated_at)} d |`);
  }
}

// --- TRASHED ---
trashed.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
console.log("\n## Trashed projects\n");
if (trashed.length === 0) {
  console.log("_(none)_");
} else {
  console.log("| ID | Name | Status | Last Updated | Age |");
  console.log("|---|---|---|---|---|");
  for (const p of trashed) {
    console.log(`| ${p.id} | ${escMd(p.name)} | ${p.status} | ${fmtDate(p.updated_at)} | ${ageDays(p.updated_at)} d |`);
  }
}

// --- Summary recommendation ---
console.log("\n## Recommendation (top 5 stalest active)\n");
const top = active.slice(0, 5);
for (const p of top) {
  console.log(`- **${p.name}** (id=${p.id}) — last update ${fmtDate(p.updated_at)} (${ageDays(p.updated_at)} d ago) · ${p.app_url}`);
}
