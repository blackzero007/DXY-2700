import type { SourceUnit } from "@/types"

const API_BASE = "/api/source-units"

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export class SourceUnitApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "SourceUnitApiError"
    this.status = status
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  let json: ApiResponse<T>
  try {
    json = await res.json()
  } catch {
    throw new SourceUnitApiError(`请求失败：${res.status} ${res.statusText}`, res.status)
  }

  if (!res.ok) {
    const message = json.error || `请求失败：${res.status} ${res.statusText}`
    throw new SourceUnitApiError(message, res.status)
  }

  if (!json.success) {
    const message = json.error || "操作失败"
    throw new SourceUnitApiError(message, res.status)
  }

  return json.data
}

export async function fetchSourceUnits(params?: { type?: string; search?: string }): Promise<SourceUnit[]> {
  let url = API_BASE
  if (params) {
    const searchParams = new URLSearchParams()
    if (params.type) searchParams.set("type", params.type)
    if (params.search) searchParams.set("search", params.search)
    const queryString = searchParams.toString()
    if (queryString) url += `?${queryString}`
  }
  const res = await fetch(url)
  return handleResponse<SourceUnit[]>(res)
}

export async function fetchSourceUnitById(id: number): Promise<SourceUnit> {
  const res = await fetch(`${API_BASE}/${id}`)
  return handleResponse<SourceUnit>(res)
}

export async function createSourceUnit(data: {
  name: string
  type?: string
  code?: string
  contact_person?: string
  contact_phone?: string
  address?: string
  description?: string
  sort_order?: number
}): Promise<SourceUnit> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<SourceUnit>(res)
}

export async function updateSourceUnit(
  id: number,
  data: {
    name?: string
    type?: string
    code?: string
    contact_person?: string
    contact_phone?: string
    address?: string
    description?: string
    sort_order?: number
  }
): Promise<SourceUnit> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<SourceUnit>(res)
}

export async function deleteSourceUnit(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
  await handleResponse<void>(res)
}
