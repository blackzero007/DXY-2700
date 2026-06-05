import type { Sample, Transition } from "@/types"
import { SampleStatus } from "@/types"

const API_BASE = "/api/samples"

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  let json: ApiResponse<T>
  try {
    json = await res.json()
  } catch {
    throw new ApiError(`请求失败：${res.status} ${res.statusText}`, res.status)
  }

  if (!res.ok) {
    const message = json.error || `请求失败：${res.status} ${res.statusText}`
    throw new ApiError(message, res.status)
  }

  if (!json.success) {
    const message = json.error || "操作失败"
    throw new ApiError(message, res.status)
  }

  return json.data
}

export async function fetchSamples(search?: string): Promise<Sample[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ""
  const res = await fetch(`${API_BASE}${query}`)
  return handleResponse<Sample[]>(res)
}

export async function createSample(data: { code: string; name: string; type: string; source: string }): Promise<Sample> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<Sample>(res)
}

export async function fetchSampleById(id: number): Promise<Sample & { transitions: Transition[] }> {
  const res = await fetch(`${API_BASE}/${id}`)
  return handleResponse<Sample & { transitions: Transition[] }>(res)
}

export async function updateSample(id: number, data: { status: SampleStatus }): Promise<Sample> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<Sample>(res)
}

export async function deleteSample(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
  await handleResponse<void>(res)
}

export async function addTransition(
  id: number,
  data: { node_name: string; operator: string; note: string }
): Promise<Transition> {
  const res = await fetch(`${API_BASE}/${id}/transitions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<Transition>(res)
}
