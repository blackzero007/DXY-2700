import { X, AlertTriangle } from "lucide-react"

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onClose: () => void
  onConfirm: () => void
  variant?: "danger" | "default"
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  onClose,
  onConfirm,
  variant = "default",
}: ConfirmModalProps) {
  if (!open) return null

  const confirmColor =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-primary hover:bg-primary/90"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-start gap-3">
            {variant === "danger" && (
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
