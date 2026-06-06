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

export interface Tag {
  id: number
  name: string
  color: string
  description: string
  created_at: string
  updated_at: string
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
  tags: Tag[]
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

export interface SampleExceptionWithSample extends SampleException {
  sample_code: string
  sample_name: string
}

export interface Operator {
  id: number
  name: string
  employee_id: string
  team: string
  created_at: string
  updated_at: string
}

export interface SampleStats {
  total: number
  statusCounts: Record<SampleStatus, number>
  todayNew: number
  completed: number
  discarded: number
}

export interface SampleType {
  id: number
  name: string
  description: string
  sort_order: number
  created_at: string
  updated_at: string
}

export enum SourceUnitType {
  HOSPITAL = "医院",
  DEPARTMENT = "科室",
  PARTNER = "合作机构",
  OTHER = "其他",
}

export enum AttachmentType {
  TEST_REPORT = "检测报告",
  HANDOVER_FORM = "交接单",
  IMAGE = "图片",
  OTHER = "其他",
}

export interface SourceUnit {
  id: number
  name: string
  type: string
  code: string | null
  contact_person: string
  contact_phone: string
  address: string
  description: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SampleAttachment {
  id: number
  sample_id: number
  name: string
  type: AttachmentType
  note: string
  created_at: string
  updated_at: string
}

export interface ArchivedSample extends Sample {
  archived_at: string | null
  archived_by: string | null
  archive_note: string | null
}
