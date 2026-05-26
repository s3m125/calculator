// Minimal Basecamp 3 API wrapper.
// Loaded server-side only. Reads OAuth credentials from env vars (which
// are gitignored — see .env.local and .env.example).
//
// Behaviour:
// - All requests carry the mandatory `Authorization: Bearer <token>` and a
//   descriptive `User-Agent` (Basecamp rejects anonymous UAs).
// - On HTTP 401 (token expired), the wrapper transparently calls the
//   refresh-token endpoint, persists the new access token back to
//   .env.local + process.env, and replays the original request once.
// - Pagination: Basecamp uses Link-header style pagination. The helpers
//   here return the first page; pass `?page=N` via the `query` arg to
//   walk further.
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

const ACCOUNT_BASE = "https://3.basecampapi.com";
const TOKEN_URL = "https://launchpad.37signals.com/authorization/token";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing Basecamp env var: ${name}`);
  return v;
}

function defaultHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${requireEnv("BASECAMP_ACCESS_TOKEN")}`,
    "User-Agent": process.env.BASECAMP_USER_AGENT ?? "GSI App (no-contact)",
    Accept: "application/json",
  };
}

function accountUrl(pathSuffix: string): string {
  const accountId = requireEnv("BASECAMP_ACCOUNT_ID");
  return `${ACCOUNT_BASE}/${accountId}${pathSuffix.startsWith("/") ? pathSuffix : "/" + pathSuffix}`;
}

// ============================================================================
// Token refresh
// ============================================================================

interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

async function refreshAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    type: "refresh",
    refresh_token: requireEnv("BASECAMP_REFRESH_TOKEN"),
    client_id: requireEnv("BASECAMP_CLIENT_ID"),
    client_secret: requireEnv("BASECAMP_CLIENT_SECRET"),
    redirect_uri: requireEnv("BASECAMP_REDIRECT_URI"),
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": process.env.BASECAMP_USER_AGENT ?? "GSI App",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Token refresh failed: HTTP ${res.status} ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as RefreshResponse;
  if (!data.access_token) throw new Error("Token refresh: no access_token in response");

  // Update process.env so the rest of this process picks it up immediately.
  process.env.BASECAMP_ACCESS_TOKEN = data.access_token;

  // Best-effort persist back to .env.local so a restart sees the new token.
  // Failure here is non-fatal — the in-memory env var is what counts for the
  // rest of this process; a developer can hand-update .env.local later.
  await persistAccessToken(data.access_token).catch(() => {});

  return data.access_token;
}

async function persistAccessToken(newToken: string): Promise<void> {
  const envPath = path.join(process.cwd(), ".env.local");
  let contents: string;
  try {
    contents = await fs.readFile(envPath, "utf-8");
  } catch {
    return; // .env.local may not exist in serverless / production environments
  }
  const line = `BASECAMP_ACCESS_TOKEN=${newToken}`;
  const replaced = /^BASECAMP_ACCESS_TOKEN=.*$/m.test(contents)
    ? contents.replace(/^BASECAMP_ACCESS_TOKEN=.*$/m, line)
    : contents.trimEnd() + "\n" + line + "\n";
  await fs.writeFile(envPath, replaced, "utf-8");
}

// ============================================================================
// Core fetch with auto-refresh + retry
// ============================================================================

async function bcFetch(input: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...defaultHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (res.status !== 401 || retried) return res;

  // Refresh once, then retry the original call.
  await refreshAccessToken();
  return bcFetch(input, init, true);
}

async function bcJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await bcFetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Basecamp ${init?.method ?? "GET"} ${input} → HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

// ============================================================================
// Public API
// ============================================================================

export interface BasecampProject {
  id: number;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  app_url: string;
  bookmark_url: string;
  dock?: Array<{ id: number; title: string; name: string; enabled: boolean; url: string }>;
}

export interface BasecampDock {
  id: number;
  title: string;
  name: string;
  enabled: boolean;
  url: string;
}

export interface BasecampTodoSet {
  id: number;
  title: string;
  type: string;
  url: string;
  todolists_url?: string;
}

export interface BasecampTodolist {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  completed_ratio?: string;
  todos_url?: string;
}

export interface BasecampTodo {
  id: number;
  title: string;
  content: string;
  completed: boolean;
  due_on: string | null;
  created_at: string;
  url: string;
}

export interface BasecampMessage {
  id: number;
  subject: string;
  content: string;
  status: string;
  created_at: string;
  url: string;
}

/** List all projects (1st page, up to 100 per Basecamp default). */
export async function listProjects(query?: Record<string, string>): Promise<BasecampProject[]> {
  const qs = query ? "?" + new URLSearchParams(query).toString() : "";
  return await bcJson<BasecampProject[]>(accountUrl(`/projects.json${qs}`));
}

/** Fetch a single project's details (includes the populated `dock`). */
export async function getProject(projectId: number | string): Promise<BasecampProject> {
  return await bcJson<BasecampProject>(accountUrl(`/projects/${projectId}.json`));
}

/** Each Basecamp project has at most one Todo Set in its dock. Returns it. */
export async function listTodoSets(projectId: number | string): Promise<BasecampTodoSet | null> {
  const project = await getProject(projectId);
  const todoset = project.dock?.find((d) => d.name === "todoset" && d.enabled);
  if (!todoset) return null;
  return await bcJson<BasecampTodoSet>(todoset.url);
}

/** List todolists inside a given todo set. */
export async function listTodolists(projectId: number | string): Promise<BasecampTodolist[]> {
  const set = await listTodoSets(projectId);
  if (!set?.todolists_url) return [];
  return await bcJson<BasecampTodolist[]>(set.todolists_url);
}

/** List the todos within a specific todolist. */
export async function listTodos(
  projectId: number | string,
  todolistId: number | string,
): Promise<BasecampTodo[]> {
  return await bcJson<BasecampTodo[]>(
    accountUrl(`/buckets/${projectId}/todolists/${todolistId}/todos.json`),
  );
}

/** Create a todo inside a todolist. */
export async function createTodo(
  projectId: number | string,
  todolistId: number | string,
  content: string,
  options?: { description?: string; due_on?: string; assignee_ids?: number[] },
): Promise<BasecampTodo> {
  const body: Record<string, unknown> = { content };
  if (options?.description) body.description = options.description;
  if (options?.due_on) body.due_on = options.due_on;
  if (options?.assignee_ids?.length) body.assignee_ids = options.assignee_ids;

  return await bcJson<BasecampTodo>(
    accountUrl(`/buckets/${projectId}/todolists/${todolistId}/todos.json`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

/** List message-board posts for a project. */
export async function listMessages(projectId: number | string): Promise<BasecampMessage[]> {
  const project = await getProject(projectId);
  const board = project.dock?.find((d) => d.name === "message_board" && d.enabled);
  if (!board) return [];
  // The dock URL points at the board; its messages live at /messages.json under it.
  type Board = { messages_url?: string; id: number };
  const boardDetail = await bcJson<Board>(board.url);
  const url = boardDetail.messages_url ?? `${board.url.replace(/\.json$/, "")}/messages.json`;
  return await bcJson<BasecampMessage[]>(url);
}

/** Post a new message to a project's message board. */
export async function createMessage(
  projectId: number | string,
  subject: string,
  content: string,
  options?: { category_id?: number; status?: "active" | "draft" },
): Promise<BasecampMessage> {
  // We need the message_board id for the POST endpoint.
  const project = await getProject(projectId);
  const board = project.dock?.find((d) => d.name === "message_board" && d.enabled);
  if (!board) throw new Error(`Project ${projectId} has no message_board enabled`);

  const body: Record<string, unknown> = { subject, content };
  if (options?.category_id) body.category_id = options.category_id;
  if (options?.status) body.status = options.status;

  return await bcJson<BasecampMessage>(
    accountUrl(`/buckets/${projectId}/message_boards/${board.id}/messages.json`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

// ============================================================================
// Diagnostics (handy when wiring up)
// ============================================================================

export async function ping(): Promise<{
  ok: boolean;
  projectCount: number;
  sample: Array<{ id: number; name: string; status: string }>;
}> {
  const projects = await listProjects();
  return {
    ok: true,
    projectCount: projects.length,
    sample: projects.slice(0, 5).map((p) => ({ id: p.id, name: p.name, status: p.status })),
  };
}
