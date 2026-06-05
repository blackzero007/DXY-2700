import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { useToastStore } from "@/store/toastStore"
import type { ToastType } from "@/store/toastStore"

const TOAST_STYLES: Record<ToastType, { bg: string; icon: string; ring: string }> = {
  success: { bg: "bg-green-50 border-green-200", icon: "text-green-500", ring: "ring-green-500/10" },
  error: { bg: "bg-red-50 border-red-200", icon: "text-red-500", ring: "ring-red-500/10" },
  info: { bg: "bg-blue-50 border-blue-200", icon: "text-blue-500", ring: "ring-blue-500/10" },
}

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconClass = "w-5 h-5 flex-shrink-0"
  const style = TOAST_STYLES[type].icon

  if (type === "success") return <CheckCircle className={`${iconClass} ${style}`} />
  if (type === "error") return <AlertCircle className={`${iconClass} ${style}`} />
  return <Info className={`${iconClass} ${style}`} />
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type]
        return (
          <div
            key={toast.id}
            className={`${style.bg} border ${style.ring} rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 animate-fadeIn`}
          >
            <ToastIcon type={toast.type} />
            <p className="flex-1 text-sm text-gray-700 leading-relaxed">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
