// Archive specific Basecamp projects, then verify.
// Usage: node --env-file=.env.local scripts/basecamp-archive.mjs

const ACCT = process.env.BASECAMP_ACCOUNT_ID;
const TOKEN = process.env.BASECAMP_ACCESS_TOKEN;
const UA = process.env.BASECAMP_USER_AGENT;
if (!ACCT || !TOKEN || !UA) throw new Error("Missing BASECAMP_* env vars");

const TARGETS = [
  { id: 40734469, name: "Trial tools" },
  { id: 40754169, name: "Ayana" },
  { id: 41061504, name: "Sales Jakarta" },
];

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "User-Agent": UA,
  Accept: "application/json",
  "Content-Type": "application/json",
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
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    items.push(...(await res.json()));
    url = parseNext(res.headers.get("link"));
  }
  return items;
}

console.log("== Archiving 3 projects ==\n");
const results = [];
for (const t of TARGETS) {
  const url = `https://3.basecampapi.com/${ACCT}/projects/${t.id}.json`;
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ status: "archived" }),
  });
  let body = "";
  try { body = await res.text(); } catch { /* noop */ }
  let returnedStatus = "?";
  try {
    const j = JSON.parse(body);
    returnedStatus = j.status ?? "?";
  } catch { /* noop */ }
  console.log(`  PUT ${t.id} (${t.name}) → HTTP ${res.status}  returned-status="${returnedStatus}"`);
  results.push({ id: t.id, name: t.name, http: res.status, status: returnedStatus });
}

console.log("\n== Verifying via GET /projects.json?status=archived ==\n");
const archived = await fetchAll(
  `https://3.basecampapi.com/${ACCT}/projects.json?status=archived`,
);
const idsInArchive = new Set(archived.map((p) => p.id));

for (const t of TARGETS) {
  const present = idsInArchive.has(t.id);
  console.log(`  ${present ? "✓" : "✗"} ${t.id} ${t.name} ${present ? "is in archived list" : "NOT in archived list"}`);
}

console.log(`\nTotal archived projects now: ${archived.length}`);

// Also confirm they no longer appear in active list
console.log("\n== Confirming removal from active list ==\n");
const active = await fetchAll(`https://3.basecampapi.com/${ACCT}/projects.json`);
const idsInActive = new Set(active.map((p) => p.id));
for (const t of TARGETS) {
  const stillActive = idsInActive.has(t.id);
  console.log(`  ${stillActive ? "✗ STILL ACTIVE" : "✓ removed"}  ${t.id} ${t.name}`);
}
console.log(`\nTotal active projects now: ${active.length}`);
