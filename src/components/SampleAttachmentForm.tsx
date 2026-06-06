import { useState, useEffect } from "react"
import { Plus, X } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { AttachmentType } from "@/types"
import type { SampleAttachment } from "@/types"

interface SampleAttachmentFormProps {
  sampleId: number
  attachment?: SampleAttachment | null
  onClose?: () => void
}

const ATTACHMENT_TYPE_OPTIONS = Object.values(AttachmentType)

export default function SampleAttachmentForm({ sampleId, attachment, onClose }: SampleAttachmentFormProps) {
  const addAttachment = useSampleStore((s) => s.addAttachment)
  const updateAttachment = useSampleStore((s) => s.updateAttachment)
  const [name, setName] = useState("")
  const [type, setType] = useState<AttachmentType>(AttachmentType.TEST_REPORT)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!attachment

  useEffect(() => {
    if (attachment) {
      setName(attachment.name)
      setType(attachment.type)
      setNote(attachment.note)
    }
  }, [attachment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    let success = false
    if (isEdit && attachment) {
      success = await updateAttachment(sampleId, attachment.id, {
        name: name.trim(),
        type,
        note: note.trim(),
      })
    } else {
      success = await addAttachment(sampleId, {
        name: name.trim(),
        type,
        note: note.trim(),
      })
    }
    setSubmitting(false)

    if (success) {
      setName("")
      setType(AttachmentType.TEST_REPORT)
      setNote("")
      onClose?.()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">{isEdit ? "编辑附件" : "登记附件"}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            附件名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            placeholder="输入附件名称"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
          附件类型 <span className="text-red-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AttachmentType)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
          >
            {ATTACHMENT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">备注</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
            rows={3}
            placeholder="输入备注信息"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {submitting ? "提交中..." : isEdit ? "保存修改" : "登记附件"}
        </button>
      </form>
    </div>
  )
}
