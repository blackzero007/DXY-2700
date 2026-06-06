import { useState } from "react"
import { X } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { SampleStatus } from "@/types"
import type { Sample } from "@/types"

const STATUS_OPTIONS = Object.values(SampleStatus)

interface StatusModalProps {
  sample: Sample | null
  onClose: () => void
  onSuccess?: () => void
}

export default function StatusModal({ sample, onClose, onSuccess }: StatusModalProps) {
  const updateSampleStatus = useSampleStore((s) => s.updateSampleStatus)
  const [status, setStatus] = useState<SampleStatus>(sample?.status ?? SampleStatus.REGISTERED)

  if (!sample) return null

  const handleConfirm = async () => {
    const success = await updateSampleStatus(sample.id, status)
    if (success) {
      onSuccess?.()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">更新状态</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500 mb-3">
            样本 <span className="font-mono font-medium text-gray-700">{sample.code}</span> - {sample.name}
          </p>
          <label className="block text-sm font-medium text-gray-600 mb-1">选择新状态</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SampleStatus)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}
