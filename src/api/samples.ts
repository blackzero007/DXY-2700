import type { Sample, Transition } from "@/types"
import { SampleStatus } from "@/types"

const API_BASE = "/api/samples"

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export async function fetchSamples(search?: string): Promise<Sample[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ""
  const res = await fetch(`${API_BASE}${query}`)
  const json: ApiResponse<Sample[]> = await res.json()
  return json.data
}

export async function createSample(data: { code: string; name: string; type: string; source: string }): Promise<Sample> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<Sample> = await res.json()
  return json.data
}

export async function fetchSampleById(id: number): Promise<Sample & { transitions: Transition[] }> {
  const res = await fetch(`${API_BASE}/${id}`)
  const json: ApiResponse<Sample & { transitions: Transition[] }> = await res.json()
  return json.data
}

export async function updateSample(id: number, data: { status: SampleStatus }): Promise<Sample> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<Sample> = await res.json()
  return json.data
}

export async function deleteSample(id: number): Promise<void> {
  await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
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
  const json: ApiResponse<Transition> = await res.json()
  return json.data
}
