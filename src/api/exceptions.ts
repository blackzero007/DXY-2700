import type { SampleExceptionWithSample, ExceptionType, ExceptionStatus } from "@/types"

const API_BASE = "/api/exceptions"

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

export async function fetchExceptions(params?: {
  sample_id?: number
  type?: ExceptionType
  status?: ExceptionStatus
}): Promise<SampleExceptionWithSample[]> {
  const searchParams = new URLSearchParams()
  if (params?.sample_id !== undefined) searchParams.set("sample_id", String(params.sample_id))
  if (params?.type) searchParams.set("type", params.type)
  if (params?.status) searchParams.set("status", params.status)
  const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const res = await fetch(`${API_BASE}${query}`)
  return handleResponse<SampleExceptionWithSample[]>(res)
}

export async function createException(data: {
  sample_id: number
  type: ExceptionType
  title: string
  description: string
  reporter: string
}): Promise<SampleExceptionWithSample> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<SampleExceptionWithSample>(res)
}

export async function fetchExceptionById(id: number): Promise<SampleExceptionWithSample> {
  const res = await fetch(`${API_BASE}/${id}`)
  return handleResponse<SampleExceptionWithSample>(res)
}

export async function updateException(id: number, data: {
  type?: ExceptionType
  title?: string
  description?: string
  status?: ExceptionStatus
  handler?: string | null
  resolution?: string | null
}): Promise<SampleExceptionWithSample> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<SampleExceptionWithSample>(res)
}

export async function deleteException(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
  await handleResponse<void>(res)
}
