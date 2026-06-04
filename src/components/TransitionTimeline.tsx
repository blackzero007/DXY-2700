import { Clock, User } from "lucide-react"
import type { Transition } from "@/types"

interface TransitionTimelineProps {
  transitions: Transition[]
}

export default function TransitionTimeline({ transitions }: TransitionTimelineProps) {
  if (transitions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        暂无流转记录
      </div>
    )
  }

  return (
    <div className="relative">
      {transitions.map((t, i) => (
        <div key={t.id} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i === 0 ? "bg-primary ring-4 ring-primary/20" : "bg-gray-300"}`} />
            {i < transitions.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
          </div>
          <div className="flex-1 -mt-0.5">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-800">{t.node_name}</span>
                <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(t.created_at).toLocaleString("zh-CN")}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span>{t.operator}</span>
              </div>
              {t.note && (
                <p className="text-xs text-gray-500 mt-1.5 bg-white rounded px-2 py-1 border border-gray-100">
                  {t.note}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
