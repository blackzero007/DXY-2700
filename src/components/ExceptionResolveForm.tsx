import { useState, useEffect } from "react"
import { X, CheckCircle } from "lucide-react"
import { ExceptionStatus, ExceptionType } from "@/types"
import type { SampleExceptionWithSample } from "@/types"
import { useExceptionStore } from "@/store/exceptionStore"
import { useOperatorStore } from "@/store/operatorStore"

const STATUS_OPTIONS = Object.values(ExceptionStatus)
const EXCEPTION_TYPE_OPTIONS = Object.values(ExceptionType)

interface ExceptionResolveFormProps {
  exception: SampleExceptionWithSample
  onClose: () => void
}

export default function ExceptionResolveForm({ exception, onClose }: ExceptionResolveFormProps) {
  const updateException = useExceptionStore((s) => s.updateException)
  const { operators, fetchOperators } = useOperatorStore()
  const [type, setType] = useState<ExceptionType>(exception.type)
  const [title, setTitle] = useState(exception.title)
  const [description, setDescription] = useState(exception.description)
  const [status, setStatus] = useState<ExceptionStatus>(exception.status)
  const [handler, setHandler] = useState(exception.handler || "")
  const [resolution, setResolution] = useState(exception.resolution || "")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchOperators()
  }, [fetchOperators])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const success = await updateException(exception.id, {
      type,
      title: title.trim(),
      description: description.trim(),
      status,
      handler: handler.trim() || null,
      resolution: resolution.trim() || null,
    })
    setSubmitting(false)
    if (success) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 animate-fadeIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">处理异常</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-gray-400 mb-2">
            样本：<span className="font-mono text-gray-600">{exception.sample_code}</span> - {exception.sample_name}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">异常类型</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ExceptionType)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
            >
              {EXCEPTION_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">异常标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">异常描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">处理状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ExceptionStatus)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">处理人</label>
            <select
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
            >
              <option value="">请选择处理人</option>
              {operators.map((op) => (
                <option key={op.id} value={op.name}>
                  {op.name} ({op.employee_id})
                  {op.team ? ` - ${op.team}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">处理方案</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
              rows={3}
              placeholder="输入处理方案"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {submitting ? "提交中..." : "保存处理"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
