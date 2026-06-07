import { X, AlertTriangle, FlaskConical, Tag, Activity } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { SampleStatus } from "@/types"
import type { Sample } from "@/types"

const STATUS_COLORS: Record<SampleStatus, string> = {
  [SampleStatus.REGISTERED]: "bg-blue-100 text-blue-700",
  [SampleStatus.IN_PROGRESS]: "bg-amber-100 text-amber-700",
  [SampleStatus.COMPLETED]: "bg-green-100 text-green-700",
  [SampleStatus.ARCHIVED]: "bg-gray-100 text-gray-600",
  [SampleStatus.DISCARDED]: "bg-red-100 text-red-700",
}

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
          <h3 className="text-lg font-semibold text-gray-800">确认删除样本</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-800 font-semibold">您确定要删除此样本吗？</p>
              <p className="text-xs text-gray-400 mt-1">删除后数据将无法恢复，请谨慎操作</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FlaskConical className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">样本编号</p>
                <p className="text-sm font-mono font-medium text-gray-700 truncate">{sample.code}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">样本名称</p>
                <p className="text-sm font-medium text-gray-700 truncate">{sample.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">当前状态</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sample.status]}`}>
                  {sample.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <p className="text-xs text-red-500">
              此操作将永久删除该样本及其所有相关数据（包括流转记录、附件等），且不可撤销。
            </p>
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
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  )
}
