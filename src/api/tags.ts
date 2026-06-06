import type { Tag, Sample } from "@/types"

const API_BASE = "/api/tags"

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export class TagApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "TagApiError"
    this.status = status
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  let json: ApiResponse<T>
  try {
    json = await res.json()
  } catch {
    throw new TagApiError(`请求失败：${res.status} ${res.statusText}`, res.status)
  }

  if (!res.ok) {
    const message = json.error || `请求失败：${res.status} ${res.statusText}`
    throw new TagApiError(message, res.status)
  }

  if (!json.success) {
    const message = json.error || "操作失败"
    throw new TagApiError(message, res.status)
  }

  return json.data
}

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch(API_BASE)
  return handleResponse<Tag[]>(res)
}

export async function fetchTagById(id: number): Promise<Tag> {
  const res = await fetch(`${API_BASE}/${id}`)
  return handleResponse<Tag>(res)
}

export async function createTag(data: {
  name: string
  color?: string
  description?: string
}): Promise<Tag> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<Tag>(res)
}

export async function updateTag(
  id: number,
  data: {
    name?: string
    color?: string
    description?: string
  }
): Promise<Tag> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<Tag>(res)
}

export async function deleteTag(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
  await handleResponse<void>(res)
}

export async function fetchSamplesByTag(tagId: number): Promise<Sample[]> {
  const res = await fetch(`${API_BASE}/${tagId}/samples`)
  return handleResponse<Sample[]>(res)
}
