import type { Batch, BatchWithStats, Sample } from "@/types"

const API_BASE = "/api/batches"

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

export async function fetchBatches(search?: string): Promise<BatchWithStats[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ""
  const res = await fetch(`${API_BASE}${query}`)
  return handleResponse<BatchWithStats[]>(res)
}

export async function createBatch(data: {
  code: string
  name: string
  type: string
  description?: string
}): Promise<BatchWithStats> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<BatchWithStats>(res)
}

export async function fetchBatchById(id: number): Promise<BatchWithStats> {
  const res = await fetch(`${API_BASE}/${id}`)
  return handleResponse<BatchWithStats>(res)
}

export async function updateBatch(
  id: number,
  data: { name?: string; type?: string; description?: string }
): Promise<BatchWithStats> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<BatchWithStats>(res)
}

export async function deleteBatch(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
  await handleResponse<void>(res)
}

export async function fetchBatchSamples(id: number): Promise<Sample[]> {
  const res = await fetch(`${API_BASE}/${id}/samples`)
  return handleResponse<Sample[]>(res)
}
