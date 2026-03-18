import { getAccessToken } from "@/lib/auth"

export type FundingModel = "aon" | "kia" | "milestone"

export type Project = {
  id: string
  creator_id: string
  title: string
  slug: string
  category: string
  subcategory: string | null
  goal_amount: number
  currency: string
  funding_model: FundingModel
  deadline: string
  state: string
  current_amount: number
  backers_count: number
  launch_date: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json")
  const token = getAccessToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}

function toNumber(value: unknown) {
  const parsed = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN
  return Number.isFinite(parsed) ? parsed : 0
}

function mapProject(row: any): Project {
  return {
    id: row.id,
    creator_id: row.creator_id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    subcategory: row.subcategory ?? null,
    goal_amount: toNumber(row.goal_amount),
    currency: row.currency,
    funding_model: row.funding_model,
    deadline: row.deadline,
    state: row.state,
    current_amount: toNumber(row.current_amount),
    backers_count: Number(row.backers_count ?? 0),
    launch_date: row.launch_date ?? null,
  }
}

export async function listProjects(): Promise<Project[]> {
  const res = await apiFetch(`/projects`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to list projects (${res.status})`)
  const data = await res.json()
  return Array.isArray(data) ? data.map(mapProject) : []
}

export async function getProject(idOrSlug: string): Promise<Project & { timeline?: any }> {
  const res = await apiFetch(`/projects/${encodeURIComponent(idOrSlug)}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to get project (${res.status})`)
  const row = await res.json()
  return { ...mapProject(row), timeline: row.timeline }
}

export async function createProject(input: {
  creator_id?: string
  title: string
  category: string
  goal_amount: number
  currency?: string
  funding_model: FundingModel
  deadline: string
  milestones?: Array<{ title: string; amount: number; due_at?: string }>
}): Promise<Project> {
  const res = await apiFetch(`/projects`, {
    method: "POST",
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to create project (${res.status})`)
  return mapProject(await res.json())
}

export async function launchProject(projectId: string): Promise<Project> {
  const res = await apiFetch(`/projects/${projectId}/launch`, {
    method: "POST",
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(`Failed to launch project (${res.status})`)
  return mapProject(await res.json())
}

export async function closeProject(projectId: string, force = false): Promise<Project> {
  const res = await apiFetch(`/projects/${projectId}/close`, {
    method: "POST",
    body: JSON.stringify({ force }),
  })
  if (!res.ok) throw new Error(`Failed to close project (${res.status})`)
  return mapProject(await res.json())
}

export async function createPledge(
  projectId: string,
  input: {
    amount: number
    currency?: string
    reward_tier_id?: string
    add_ons?: Array<{ add_on_id: string; quantity: number }>
  }
) {
  const res = await apiFetch(`/projects/${projectId}/pledges`, {
    method: "POST",
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to pledge (${res.status})`)
  return res.json()
}

export type Comment = {
  id: string
  project_id: string
  user_id: string
  parent_id: string | null
  body: string
  created_at: string
}

export async function listComments(projectId: string): Promise<Comment[]> {
  const res = await apiFetch(`/projects/${projectId}/comments`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to list comments (${res.status})`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createComment(projectId: string, input: { body: string; parent_id?: string }) {
  const res = await apiFetch(`/projects/${projectId}/comments`, {
    method: "POST",
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to create comment (${res.status})`)
  return res.json()
}

export type ProjectUpdate = {
  id: string
  project_id: string
  title: string
  body_md: string
  published: boolean
  created_at: string
}

export async function listUpdates(projectId: string): Promise<ProjectUpdate[]> {
  const res = await apiFetch(`/projects/${projectId}/updates`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to list updates (${res.status})`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createUpdate(projectId: string, input: { title: string; body_md: string; published?: boolean; is_backers_only?: boolean }) {
  const res = await apiFetch(`/projects/${projectId}/updates`, {
    method: "POST",
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Failed to create update (${res.status})`)
  return res.json()
}

export async function register(input: { email: string; password: string; display_name: string; role?: string }) {
  const res = await apiFetch(`/auth/register`, { method: "POST", body: JSON.stringify(input) })
  if (!res.ok) throw new Error(`Failed to register (${res.status})`)
  return res.json()
}

export async function login(input: { email: string; password: string }) {
  const res = await apiFetch(`/auth/login`, { method: "POST", body: JSON.stringify(input) })
  if (!res.ok) throw new Error(`Failed to login (${res.status})`)
  return res.json()
}
