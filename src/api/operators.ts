import type { Operator } from "@/types"

const API_BASE = "/api/operators"

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export class OperatorApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "OperatorApiError"
    this.status = status
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  let json: ApiResponse<T>
  try {
    json = await res.json()
  } catch {
    throw new OperatorApiError(`请求失败：${res.status} ${res.statusText}`, res.status)
  }

  if (!res.ok) {
    const message = json.error || `请求失败：${res.status} ${res.statusText}`
    throw new OperatorApiError(message, res.status)
  }

  if (!json.success) {
    const message = json.error || "操作失败"
    throw new OperatorApiError(message, res.status)
  }

  return json.data
}

export async function fetchOperators(): Promise<Operator[]> {
  const res = await fetch(API_BASE)
  return handleResponse<Operator[]>(res)
}

export async function fetchOperatorById(id: number): Promise<Operator> {
  const res = await fetch(`${API_BASE}/${id}`)
  return handleResponse<Operator>(res)
}

export async function createOperator(data: {
  name: string
  employee_id: string
  team?: string
}): Promise<Operator> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<Operator>(res)
}

export async function updateOperator(
  id: number,
  data: {
    name?: string
    employee_id?: string
    team?: string
  }
): Promise<Operator> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<Operator>(res)
}

export async function deleteOperator(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
  await handleResponse<void>(res)
}
