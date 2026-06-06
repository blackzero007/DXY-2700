import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, FlaskConical, FileText, Clock, Tag as TagIcon, X, Plus, AlertTriangle } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { useExceptionStore } from "@/store/exceptionStore"
import { useTagStore } from "@/store/tagStore"
import { SampleStatus, ExceptionStatus, ExceptionType } from "@/types"
import type { Tag, SampleExceptionWithSample } from "@/types"
import TransitionTimeline from "@/components/TransitionTimeline"
import TransitionForm from "@/components/TransitionForm"
import ExceptionForm from "@/components/ExceptionForm"
import ExceptionResolveForm from "@/components/ExceptionResolveForm"
import ConfirmModal from "@/components/ConfirmModal"

const STATUS_COLORS: Record<SampleStatus, string> = {
  [SampleStatus.REGISTERED]: "bg-blue-100 text-blue-700",
  [SampleStatus.IN_PROGRESS]: "bg-amber-100 text-amber-700",
  [SampleStatus.COMPLETED]: "bg-green-100 text-green-700",
  [SampleStatus.ARCHIVED]: "bg-gray-100 text-gray-600",
  [SampleStatus.DISCARDED]: "bg-red-100 text-red-700",
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{currentSample.name}</h2>
              <p className="text-sm font-mono text-gray-400 mt-1">{currentSample.code}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[currentSample.status]}`}>
              {currentSample.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">类型</p>
                <p className="text-sm text-gray-700">{currentSample.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">来源</p>
                <p className="text-sm text-gray-700">{currentSample.source || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">创建时间</p>
                <p className="text-sm text-gray-700 font-mono text-xs">
                  {new Date(currentSample.created_at).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">更新时间</p>
                <p className="text-sm text-gray-700 font-mono text-xs">
                  {new Date(currentSample.updated_at).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">样本标签</span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowTagSelector(!showTagSelector)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加标签
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
            <div className="flex flex-wrap gap-2">
              {currentSample.tags && currentSample.tags.length > 0 ? (
                currentSample.tags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} onRemove={() => handleRemoveTag(tag.id)} />
                ))
              ) : (
                <span className="text-sm text-gray-300">暂无标签</span>
              )}
            </div>
          </div>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">流转记录</h3>
          <TransitionTimeline transitions={currentSample.transitions} />
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
    </div>
  )
}
