import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, FlaskConical, FileText, Clock, Tag as TagIcon, X, Plus, AlertTriangle, Paperclip, Edit, User, ChevronRight, Activity, CheckCircle2, Archive, Trash2, FileBarChart } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { useExceptionStore } from "@/store/exceptionStore"
import { useTagStore } from "@/store/tagStore"
import { SampleStatus, ExceptionStatus, ExceptionType, AttachmentType } from "@/types"
import type { Tag, SampleExceptionWithSample, SampleAttachment, Sample, Transition } from "@/types"
import TransitionTimeline from "@/components/TransitionTimeline"
import TransitionForm from "@/components/TransitionForm"
import ExceptionForm from "@/components/ExceptionForm"
import ExceptionResolveForm from "@/components/ExceptionResolveForm"
import ConfirmModal from "@/components/ConfirmModal"
import SampleAttachmentForm from "@/components/SampleAttachmentForm"
import StatusModal from "@/components/StatusModal"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<SampleStatus, { bgColor: string; textColor: string; ringColor: string; icon: typeof CheckCircle2; label: string }> = {
  [SampleStatus.REGISTERED]: { bgColor: "bg-blue-50", textColor: "text-blue-700", ringColor: "ring-blue-200", icon: FileBarChart, label: "已登记" },
  [SampleStatus.IN_PROGRESS]: { bgColor: "bg-amber-50", textColor: "text-amber-700", ringColor: "ring-amber-200", icon: Activity, label: "实验中" },
  [SampleStatus.COMPLETED]: { bgColor: "bg-green-50", textColor: "text-green-700", ringColor: "ring-green-200", icon: CheckCircle2, label: "已完成" },
  [SampleStatus.ARCHIVED]: { bgColor: "bg-gray-50", textColor: "text-gray-600", ringColor: "ring-gray-200", icon: Archive, label: "已归档" },
  [SampleStatus.DISCARDED]: { bgColor: "bg-red-50", textColor: "text-red-700", ringColor: "ring-red-200", icon: Trash2, label: "已废弃" },
}

const EXCEPTION_STATUS_COLORS: Record<ExceptionStatus, string> = {
  [ExceptionStatus.OPEN]: "bg-red-100 text-red-700",
  [ExceptionStatus.IN_PROGRESS]: "bg-blue-100 text-blue-700",
  [ExceptionStatus.RESOLVED]: "bg-green-100 text-green-700",
  [ExceptionStatus.CLOSED]: "bg-gray-100 text-gray-500",
}

const EXCEPTION_TYPE_COLORS: Record<ExceptionType, string> = {
  [ExceptionType.CONTAMINATION]: "bg-red-100 text-red-700",
  [ExceptionType.DAMAGE]: "bg-orange-100 text-orange-700",
  [ExceptionType.INFO_MISSING]: "bg-yellow-100 text-yellow-700",
  [ExceptionType.RESULT_ABNORMAL]: "bg-purple-100 text-purple-700",
  [ExceptionType.OTHER]: "bg-gray-100 text-gray-600",
}

const ATTACHMENT_TYPE_COLORS: Record<AttachmentType, string> = {
  [AttachmentType.TEST_REPORT]: "bg-blue-100 text-blue-700",
  [AttachmentType.HANDOVER_FORM]: "bg-green-100 text-green-700",
  [AttachmentType.IMAGE]: "bg-purple-100 text-purple-700",
  [AttachmentType.OTHER]: "bg-gray-100 text-gray-600",
}

function TagBadge({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

function ExceptionBadge({ exc }: { exc: SampleExceptionWithSample }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${EXCEPTION_TYPE_COLORS[exc.type]}`}>
        {exc.type}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">{exc.title}</p>
        <p className="text-xs text-gray-400">{exc.reporter} · {new Date(exc.created_at).toLocaleString("zh-CN")}</p>
      </div>
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${EXCEPTION_STATUS_COLORS[exc.status]}`}>
        {exc.status}
      </span>
    </div>
  )
}

function AttachmentItem({ attachment, onEdit, onDelete }: { 
  attachment: SampleAttachment
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
      <Paperclip className="w-5 h-5 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-800 font-medium truncate">{attachment.name}</p>
          <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${ATTACHMENT_TYPE_COLORS[attachment.type]}`}>
            {attachment.type}
          </span>
        </div>
        {attachment.note && (
          <p className="text-xs text-gray-400 mt-1 truncate">{attachment.note}</p>
        )}
        <p className="text-xs text-gray-300 mt-1">{new Date(attachment.created_at).toLocaleString("zh-CN")}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1.5 rounded text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
            title="编辑"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="删除"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function LatestTransitionCard({ transition }: { transition: Transition }) {
  return (
    <div className="bg-white rounded-lg border border-primary/20 p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-4 ring-primary/5">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-base font-semibold text-gray-800">{transition.node_name}</h4>
            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
              最新
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>{transition.operator}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{new Date(transition.created_at).toLocaleString("zh-CN")}</span>
            </div>
          </div>
          {transition.note && (
            <div className="bg-gray-50 rounded-md p-2.5 border border-gray-100">
              <p className="text-xs text-gray-600 leading-relaxed">{transition.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SampleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentSample = useSampleStore((s) => s.currentSample)
  const fetchSampleDetail = useSampleStore((s) => s.fetchSampleDetail)
  const addTagToSample = useSampleStore((s) => s.addTagToSample)
  const removeTagFromSample = useSampleStore((s) => s.removeTagFromSample)
  const loading = useSampleStore((s) => s.loading)
  const { tags, fetchTags } = useTagStore()
  const exceptions = useExceptionStore((s) => s.exceptions)
  const fetchExceptions = useExceptionStore((s) => s.fetchExceptions)
  const deleteException = useExceptionStore((s) => s.deleteException)
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [showExceptionForm, setShowExceptionForm] = useState(false)
  const [editException, setEditException] = useState<SampleExceptionWithSample | null>(null)
  const [deleteExceptionTarget, setDeleteExceptionTarget] = useState<SampleExceptionWithSample | null>(null)
  const [showAttachmentForm, setShowAttachmentForm] = useState(false)
  const [editAttachment, setEditAttachment] = useState<SampleAttachment | null>(null)
  const [deleteAttachmentTarget, setDeleteAttachmentTarget] = useState<SampleAttachment | null>(null)
  const [statusTarget, setStatusTarget] = useState<Sample | null>(null)
  const deleteAttachment = useSampleStore((s) => s.deleteAttachment)

  useEffect(() => {
    if (id) {
      fetchSampleDetail(Number(id))
      fetchExceptions(Number(id))
    }
    fetchTags()
  }, [id, fetchSampleDetail, fetchExceptions, fetchTags])

  const availableTags = tags.filter(
    (tag) => !currentSample?.tags?.find((t) => t.id === tag.id)
  )

  const transitions = currentSample?.transitions || []

  const latestTransition = transitions.length > 0
    ? [...transitions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
    : null

  const handleAddTag = (tagId: number) => {
    if (id) {
      addTagToSample(Number(id), tagId)
      setShowTagSelector(false)
    }
  }

  const handleRemoveTag = (tagId: number) => {
    if (id) {
      removeTagFromSample(Number(id), tagId)
    }
  }

  const handleDeleteException = async () => {
    if (!deleteExceptionTarget) return
    const success = await deleteException(deleteExceptionTarget.id)
    if (success) {
      setDeleteExceptionTarget(null)
      if (id) fetchExceptions(Number(id))
    }
  }

  const handleDeleteAttachment = async () => {
    if (!deleteAttachmentTarget || !id) return
    const success = await deleteAttachment(Number(id), deleteAttachmentTarget.id)
    if (success) {
      setDeleteAttachmentTarget(null)
    }
  }

  if (loading && !currentSample) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        加载中...
      </div>
    )
  }

  if (!currentSample) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        未找到样本
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <FlaskConical className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold text-gray-800">样本详情</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6 animate-fadeIn">
        {/* 顶部概览区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 样本基础信息 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{currentSample.name}</h2>
                  <p className="text-sm font-mono text-gray-400 mt-1">{currentSample.code}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentSample.tags && currentSample.tags.length > 0 ? (
                      currentSample.tags.slice(0, 3).map((tag) => (
                        <TagBadge key={tag.id} tag={tag} />
                      ))
                    ) : (
                      <span className="text-xs text-gray-300">暂无标签</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowTagSelector(!showTagSelector)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  标签
                </button>
                {showTagSelector && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                    {availableTags.length > 0 ? (
                      availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleAddTag(tag.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-gray-400">没有可添加的标签</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-xs">样本类型</span>
                </div>
                <p className="text-sm font-medium text-gray-700">{currentSample.type}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span className="text-xs">样本来源</span>
                </div>
                <p className="text-sm font-medium text-gray-700">{currentSample.source || "-"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">创建时间</span>
                </div>
                <p className="text-xs font-mono text-gray-600">
                  {new Date(currentSample.created_at).toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">更新时间</span>
                </div>
                <p className="text-xs font-mono text-gray-600">
                  {new Date(currentSample.updated_at).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>

            {currentSample.tags && currentSample.tags.length > 3 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">全部标签</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentSample.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} onRemove={() => handleRemoveTag(tag.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 状态卡片 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">当前状态</h3>
              <button
                onClick={() => setStatusTarget(currentSample as Sample)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                更新
              </button>
            </div>
            <div className={cn("flex-1 rounded-xl p-5 flex flex-col items-center justify-center", STATUS_CONFIG[currentSample.status].bgColor, "ring-1", STATUS_CONFIG[currentSample.status].ringColor)}>
              {(() => {
                const config = STATUS_CONFIG[currentSample.status]
                const StatusIcon = config.icon
                return (
                  <>
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-3", "bg-white/80 shadow-sm")}>
                      <StatusIcon className={cn("w-7 h-7", config.textColor)} />
                    </div>
                    <p className={cn("text-lg font-bold", config.textColor)}>{config.label}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      共 {transitions.length || 0} 次流转
                    </p>
                  </>
                )
              })()}
            </div>
          </div>
        </div>

        {/* 最新流转记录 */}
        <div className="bg-gradient-to-r from-primary/5 via-white to-white rounded-xl shadow-sm border border-primary/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">最新流转</h3>
              <span className="text-xs text-gray-400">快速了解样本最新进展</span>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById("transition-history")
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              }}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <span>查看全部</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {latestTransition ? (
            <LatestTransitionCard transition={latestTransition} />
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm bg-white/50 rounded-lg border border-dashed border-gray-200">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>暂无流转记录</p>
            </div>
          )}
        </div>

        {/* 异常记录 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-800">异常记录</h3>
            </div>
            <button
              onClick={() => setShowExceptionForm(!showExceptionForm)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              登记异常
            </button>
          </div>

          {showExceptionForm && (
            <div className="mb-4">
              <ExceptionForm
                sampleId={currentSample.id}
                sampleCode={currentSample.code}
                onClose={() => setShowExceptionForm(false)}
              />
            </div>
          )}

          {exceptions.length > 0 ? (
            <div className="space-y-2">
              {exceptions.map((exc) => (
                <div key={exc.id} className="group relative">
                  <button
                    onClick={() => setEditException(exc)}
                    className="w-full text-left"
                  >
                    <ExceptionBadge exc={exc} />
                  </button>
                  <button
                    onClick={() => setDeleteExceptionTarget(exc)}
                    className="absolute top-2 right-2 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-300 text-center py-4">暂无异常记录</p>
          )}
        </div>

        {/* 附件管理 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-800">附件资料</h3>
            </div>
            <button
              onClick={() => {
                setEditAttachment(null)
                setShowAttachmentForm(!showAttachmentForm)
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              登记附件
            </button>
          </div>

          {showAttachmentForm && (
            <div className="mb-4">
              <SampleAttachmentForm
                sampleId={currentSample.id}
                attachment={editAttachment}
                onClose={() => {
                  setShowAttachmentForm(false)
                  setEditAttachment(null)
                }}
              />
            </div>
          )}

          {currentSample.attachments && currentSample.attachments.length > 0 ? (
            <div className="space-y-2">
              {currentSample.attachments.map((att) => (
                <AttachmentItem
                  key={att.id}
                  attachment={att}
                  onEdit={() => {
                    setEditAttachment(att)
                    setShowAttachmentForm(true)
                  }}
                  onDelete={() => setDeleteAttachmentTarget(att)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-300 text-center py-4">暂无附件资料</p>
          )}
        </div>

        <div id="transition-history" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">流转历史</h3>
          </div>
          <TransitionTimeline transitions={transitions} />
        </div>

        <TransitionForm sampleId={currentSample.id} />
      </main>

      {editException && (
        <ExceptionResolveForm
          exception={editException}
          onClose={() => {
            setEditException(null)
            if (id) fetchExceptions(Number(id))
          }}
        />
      )}

      <ConfirmModal
        open={!!deleteExceptionTarget}
        title="删除异常记录"
        message={`确定要删除异常记录 "${deleteExceptionTarget?.title}" 吗？此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        onClose={() => setDeleteExceptionTarget(null)}
        onConfirm={handleDeleteException}
      />

      <ConfirmModal
        open={!!deleteAttachmentTarget}
        title="删除附件"
        message={`确定要删除附件 "${deleteAttachmentTarget?.name}" 吗？此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        onClose={() => setDeleteAttachmentTarget(null)}
        onConfirm={handleDeleteAttachment}
      />

      <StatusModal
        sample={statusTarget}
        onClose={() => setStatusTarget(null)}
        onSuccess={() => {
          if (id) fetchSampleDetail(Number(id))
        }}
      />
    </div>
  )
}
