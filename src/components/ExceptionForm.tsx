import { useState } from "react"
import { Plus, X } from "lucide-react"
import { useExceptionStore } from "@/store/exceptionStore"
import { ExceptionType } from "@/types"

interface ExceptionFormProps {
  sampleId: number
  sampleCode: string
  onClose?: () => void
}

const EXCEPTION_TYPE_OPTIONS = Object.values(ExceptionType)

export default function ExceptionForm({ sampleId, sampleCode, onClose }: ExceptionFormProps) {
  const createException = useExceptionStore((s) => s.createException)
  const [type, setType] = useState<ExceptionType>(ExceptionType.CONTAMINATION)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [reporter, setReporter] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !reporter.trim() || !type) return

    setSubmitting(true)
    const success = await createException({
      sample_id: sampleId,
      type,
      title: title.trim(),
      description: description.trim(),
      reporter: reporter.trim(),
    })
    setSubmitting(false)

    if (success) {
      setType(ExceptionType.CONTAMINATION)
      setTitle("")
      setDescription("")
      setReporter("")
      onClose?.()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">登记异常</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4 font-mono">{sampleCode}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-600 mb-1">
            异常标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            placeholder="输入异常标题"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">异常描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
            rows={3}
            placeholder="输入异常描述"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            报告人 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={reporter}
            onChange={(e) => setReporter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            placeholder="输入报告人姓名"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {submitting ? "提交中..." : "登记异常"}
        </button>
      </form>
    </div>
  )
}
