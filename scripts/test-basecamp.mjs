// Smoke-test the basecamp wrapper end-to-end.
// Usage:  node --env-file=.env.local scripts/test-basecamp.mjs
//
// Replicates the same fetch contract as src/lib/basecamp.ts so we can
// exercise the live API from outside the Next.js build pipeline.

const ACCOUNT_BASE = "https://3.basecampapi.com";

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

const accountId = env("BASECAMP_ACCOUNT_ID");
const ua = env("BASECAMP_USER_AGENT");
const token = env("BASECAMP_ACCESS_TOKEN");

async function bcGet(p) {
  const url = p.startsWith("http") ? p : `${ACCOUNT_BASE}/${accountId}${p}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": ua,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${url} :: ${t.slice(0, 200)}`);
  }
  return await res.json();
}

console.log("== listProjects ==");
const projects = await bcGet("/projects.json");
console.log(`projects: ${projects.length}`);
projects.slice(0, 3).forEach((p) =>
  console.log(`  ${p.id}\t${p.status}\t${p.name}`),
);

const first = projects[0];
console.log("");
console.log(`== getProject(${first.id}) ==`);
const detail = await bcGet(`/projects/${first.id}.json`);
console.log("  name:    ", detail.name);
console.log("  dock:    ", (detail.dock || []).map((d) => d.name).join(", "));

const todoset = (detail.dock || []).find((d) => d.name === "todoset" && d.enabled);
if (todoset) {
  console.log("");
  console.log("== listTodoSet ==");
  const set = await bcGet(todoset.url);
  console.log("  todoset id:", set.id, "  title:", set.title);
  if (set.todolists_url) {
    const lists = await bcGet(set.todolists_url);
    console.log(`  todolists: ${lists.length}`);
    lists.slice(0, 3).forEach((l) =>
      console.log(`    ${l.id}\t${l.completed ? "done" : "open"}\t${l.title}`),
    );
  }
}

const board = (detail.dock || []).find((d) => d.name === "message_board" && d.enabled);
if (board) {
  console.log("");
  console.log("== listMessages ==");
  const boardDetail = await bcGet(board.url);
  const url = boardDetail.messages_url ??
    `${board.url.replace(/\.json$/, "")}/messages.json`;
  const msgs = await bcGet(url);
  console.log(`  messages: ${msgs.length}`);
  msgs.slice(0, 3).forEach((m) =>
    console.log(`    ${m.id}\t${m.status}\t${m.subject}`),
  );
}

console.log("");
console.log("✓ Basecamp wrapper verified end-to-end");
