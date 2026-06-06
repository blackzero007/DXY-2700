import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { useOperatorStore } from "@/store/operatorStore"
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
  const { operators, fetchOperators } = useOperatorStore()
  const [status, setStatus] = useState<SampleStatus>(sample?.status ?? SampleStatus.REGISTERED)
  const [operator, setOperator] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    fetchOperators()
  }, [fetchOperators])

  useEffect(() => {
    if (sample) {
      setStatus(sample.status)
      setOperator("")
      setNote("")
    }
  }, [sample])

  if (!sample) return null

  const statusChanged = sample.status !== status

  const handleConfirm = async () => {
    if (statusChanged && (!operator.trim() || !note.trim())) {
      return
    }
    const success = await updateSampleStatus(
      sample.id,
      status,
      statusChanged ? operator.trim() : undefined,
      statusChanged ? note.trim() : undefined
    )
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
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-500">
            样本 <span className="font-mono font-medium text-gray-700">{sample.code}</span> - {sample.name}
          </p>
          <div>
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
          {statusChanged && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">操作人 <span className="text-red-500">*</span></label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
                >
                  <option value="">请选择操作人</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.name}>
                      {op.name} ({op.employee_id})
                      {op.team ? ` - ${op.team}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">变更备注 <span className="text-red-500">*</span></label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
                  rows={3}
                  placeholder="请输入状态变更的原因和说明"
                  required
                />
              </div>
            </>
          )}
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
            disabled={statusChanged && (!operator.trim() || !note.trim())}
            className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}
