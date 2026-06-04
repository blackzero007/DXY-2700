export enum SampleStatus {
  REGISTERED = "已登记",
  IN_PROGRESS = "实验中",
  COMPLETED = "已完成",
  ARCHIVED = "已归档",
  DISCARDED = "已废弃",
}

export interface Sample {
  id: number
  code: string
  name: string
  type: string
  source: string
  status: SampleStatus
  created_at: string
  updated_at: string
}

export interface Transition {
  id: number
  sample_id: number
  node_name: string
  operator: string
  note: string
  created_at: string
}

export interface CreateSampleRequest {
  code: string
  name: string
  type: string
  source: string
}

export interface UpdateSampleStatusRequest {
  status: SampleStatus
}

export interface CreateTransitionRequest {
  node_name: string
  operator: string
  note: string
}
