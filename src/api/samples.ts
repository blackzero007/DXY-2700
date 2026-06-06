import type { Sample, Transition, Tag, SampleStats, SampleAttachment, ArchivedSample } from "@/types"
import { SampleStatus, AttachmentType } from "@/types"

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

export async function fetchSamples(
  search?: string,
  batchId?: number | null,
  tagId?: number | null,
  status?: string | null,
  sampleType?: string | null
): Promise<Sample[]> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (batchId != null) params.set("batch_id", String(batchId))
  if (tagId != null) params.set("tag_id", String(tagId))
  if (status) params.set("status", status)
  if (sampleType) params.set("sample_type", sampleType)
  const query = params.toString() ? `?${params.toString()}` : ""
  const res = await fetch(`${API_BASE}${query}`)
  return handleResponse<Sample[]>(res)
}

export async function fetchArchivedSamples(search?: string): Promise<ArchivedSample[]> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  const query = params.toString() ? `?${params.toString()}` : ""
  const res = await fetch(`${API_BASE}/archived${query}`)
  return handleResponse<ArchivedSample[]>(res)
}

export async function createSample(data: {
  code: string
  name: string
  type: string
  source: string
  batch_id?: number | null
}): Promise<Sample> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<Sample>(res)
}

export async function updateSampleBatch(id: number, batchId: number | null): Promise<Sample> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batch_id: batchId }),
  })
  return handleResponse<Sample>(res)
}

export async function fetchSampleById(id: number): Promise<Sample & { transitions: Transition[]; tags: Tag[]; attachments: SampleAttachment[] }> {
  const res = await fetch(`${API_BASE}/${id}`)
  return handleResponse<Sample & { transitions: Transition[]; tags: Tag[]; attachments: SampleAttachment[] }>(res)
}

export async function updateSample(id: number, data: { status: SampleStatus; operator?: string; note?: string }): Promise<Sample> {
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

export async function fetchSampleTags(sampleId: number): Promise<Tag[]> {
  const res = await fetch(`${API_BASE}/${sampleId}/tags`)
  return handleResponse<Tag[]>(res)
}

export async function addTagToSample(sampleId: number, tagId: number): Promise<Tag[]> {
  const res = await fetch(`${API_BASE}/${sampleId}/tags/${tagId}`, {
    method: "POST",
  })
  return handleResponse<Tag[]>(res)
}

export async function removeTagFromSample(sampleId: number, tagId: number): Promise<Tag[]> {
  const res = await fetch(`${API_BASE}/${sampleId}/tags/${tagId}`, {
    method: "DELETE",
  })
  return handleResponse<Tag[]>(res)
}

export async function exportSamples(
  search?: string,
  batchId?: number | null,
  tagId?: number | null,
  status?: string | null,
  sampleType?: string | null
): Promise<void> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (batchId != null) params.set("batch_id", String(batchId))
  if (tagId != null) params.set("tag_id", String(tagId))
  if (status) params.set("status", status)
  if (sampleType) params.set("sample_type", sampleType)
  const query = params.toString() ? `?${params.toString()}` : ""

  const res = await fetch(`${API_BASE}/export${query}`)

  if (!res.ok) {
    let errorMessage = "导出失败"
    try {
      const json = await res.json()
      if (json.error) errorMessage = json.error
    } catch {
      // ignore
    }
    throw new ApiError(errorMessage, res.status)
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `samples_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export async function fetchSampleStats(): Promise<SampleStats> {
  const res = await fetch(`${API_BASE}/stats`)
  return handleResponse<SampleStats>(res)
}

export async function fetchSampleAttachments(sampleId: number): Promise<SampleAttachment[]> {
  const res = await fetch(`${API_BASE}/${sampleId}/attachments`)
  return handleResponse<SampleAttachment[]>(res)
}

export async function createSampleAttachment(
  sampleId: number,
  data: { name: string; type: AttachmentType; note?: string }
): Promise<SampleAttachment> {
  const res = await fetch(`${API_BASE}/${sampleId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<SampleAttachment>(res)
}

export async function updateSampleAttachment(
  sampleId: number,
  attachmentId: number,
  data: { name?: string; type?: AttachmentType; note?: string }
): Promise<SampleAttachment> {
  const res = await fetch(`${API_BASE}/${sampleId}/attachments/${attachmentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return handleResponse<SampleAttachment>(res)
}

export async function deleteSampleAttachment(
  sampleId: number,
  attachmentId: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/${sampleId}/attachments/${attachmentId}`, {
    method: "DELETE",
  })
  await handleResponse<void>(res)
}
