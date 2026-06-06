export enum SampleStatus {
  REGISTERED = "已登记",
  IN_PROGRESS = "实验中",
  COMPLETED = "已完成",
  ARCHIVED = "已归档",
  DISCARDED = "已废弃",
}

export enum ExceptionType {
  CONTAMINATION = "污染",
  DAMAGE = "破损",
  INFO_MISSING = "信息缺失",
  RESULT_ABNORMAL = "结果异常",
  OTHER = "其他",
}

export enum ExceptionStatus {
  OPEN = "待处理",
  IN_PROGRESS = "处理中",
  RESOLVED = "已解决",
  CLOSED = "已关闭",
}

export enum BatchType {
  PROJECT = "项目",
  EXPERIMENT = "实验批次",
}

export interface Sample {
  id: number
  code: string
  name: string
  type: string
  source: string
  status: SampleStatus
  batch_id: number | null
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

export interface Batch {
  id: number
  code: string
  name: string
  type: string
  description: string
  created_at: string
  updated_at: string
}

export interface BatchStats {
  total: number
  completed: number
  discarded: number
}

export interface BatchWithStats extends Batch {
  stats: BatchStats
}

export interface CreateSampleRequest {
  code: string
  name: string
  type: string
  source: string
  batch_id?: number | null
}

export interface UpdateSampleStatusRequest {
  status: SampleStatus
}

export interface CreateTransitionRequest {
  node_name: string
  operator: string
  note: string
}

export interface CreateBatchRequest {
  code: string
  name: string
  type: string
  description?: string
}

export interface Tag {
  id: number
  name: string
  color: string
  description: string
  created_at: string
  updated_at: string
}

export interface SampleWithTags extends Sample {
  tags: Tag[]
}

export interface CreateTagRequest {
  name: string
  color?: string
  description?: string
}

export interface UpdateTagRequest {
  name?: string
  color?: string
  description?: string
}

export interface UpdateBatchRequest {
  name?: string
  type?: string
  description?: string
}

export interface SampleException {
  id: number
  sample_id: number
  type: ExceptionType
  title: string
  description: string
  status: ExceptionStatus
  reporter: string
  handler: string | null
  resolution: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface CreateSampleExceptionRequest {
  sample_id: number
  type: ExceptionType
  title: string
  description: string
  reporter: string
}

export interface UpdateSampleExceptionRequest {
  type?: ExceptionType
  title?: string
  description?: string
  status?: ExceptionStatus
  handler?: string | null
  resolution?: string | null
}

export interface SampleExceptionWithSample extends SampleException {
  sample_code: string
  sample_name: string
}
