import type { SampleType } from "@/types"

const API_BASE = "/api/sample-types"

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export class SampleTypeApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "SampleTypeApiError"
    this.status = status
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  let json: ApiResponse<T>
  try {
    json = await res.json()
  } catch {
    throw new SampleTypeApiError(`请求失败：${res.status} ${res.statusText}`, res.status)
  }

  if (!res.ok) {
    const message = json.error || `请求失败：${res.status} ${res.statusText}`
    throw new SampleTypeApiError(message, res.status)
  }

  if (!json.success) {
    const message = json.error || "操作失败"
    throw new SampleTypeApiError(message, res.status)
  }

  return json.data
}

export async function fetchSampleTypes(): Promise<SampleType[]> {
  const res = await fetch(API_BASE)
  return handleResponse<SampleType[]>(res)
}

export async function fetchSampleTypeById(id: number): Promise<SampleType> {
  const res = await fetch(`${API_BASE}/${id}`)
  return handleResponse<SampleType>(res)
}

export async function createSampleType(data: {
  name: string
  description?: string
  sort_order?: number
}): Promise<SampleType> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<SampleType>(res)
}

export async function updateSampleType(
  id: number,
  data: {
    name?: string
    description?: string
    sort_order?: number
  }
): Promise<SampleType> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<SampleType>(res)
}

export async function deleteSampleType(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
  await handleResponse<void>(res)
}
