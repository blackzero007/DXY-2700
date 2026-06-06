import { X, AlertTriangle } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import type { Sample } from "@/types"

interface DeleteModalProps {
  sample: Sample | null
  onClose: () => void
  onSuccess?: () => void
}

export default function DeleteModal({ sample, onClose, onSuccess }: DeleteModalProps) {
  const deleteSample = useSampleStore((s) => s.deleteSample)

  if (!sample) return null

  const handleConfirm = async () => {
    const success = await deleteSample(sample.id)
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
          <h3 className="text-lg font-semibold text-gray-800">确认删除</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 font-medium">确定要删除此样本吗？</p>
              <p className="text-sm text-gray-500 mt-1">
                样本 <span className="font-mono font-medium text-gray-700">{sample.code}</span> - {sample.name}
              </p>
              <p className="text-xs text-gray-400 mt-2">此操作不可撤销</p>
            </div>
          </div>
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
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  )
}
