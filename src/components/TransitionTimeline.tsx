import { useState, useMemo } from "react"
import { Clock, User, ArrowDown, ArrowUp } from "lucide-react"
import type { Transition } from "@/types"
import { cn } from "@/lib/utils"

type SortOrder = "desc" | "asc"

interface TransitionTimelineProps {
  transitions: Transition[]
}

export default function TransitionTimeline({ transitions }: TransitionTimelineProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const sortedTransitions = useMemo(() => {
    const sorted = [...transitions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    return sortOrder === "desc" ? sorted.reverse() : sorted
  }, [transitions, sortOrder])

  const latestTransition = useMemo(() => {
    if (transitions.length === 0) return null
    return [...transitions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
  }, [transitions])

  if (transitions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        暂无流转记录
      </div>
    )
  }

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            共 {transitions.length} 条记录
          </span>
        </div>
        <button
          onClick={toggleSortOrder}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          {sortOrder === "desc" ? (
            <>
              <ArrowDown className="w-3.5 h-3.5" />
              <span>时间倒序</span>
            </>
          ) : (
            <>
              <ArrowUp className="w-3.5 h-3.5" />
              <span>时间正序</span>
            </>
          )}
        </button>
      </div>

      <div className="relative">
        {sortedTransitions.map((t, i) => {
          const isLatest = latestTransition && t.id === latestTransition.id
          const isLast = i === sortedTransitions.length - 1
          return (
            <div key={t.id} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0 transition-all",
                    isLatest
                      ? "bg-primary ring-4 ring-primary/20 scale-125"
                      : "bg-gray-300"
                  )}
                />
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 mt-1 transition-colors",
                      isLatest ? "bg-primary/30" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
              <div className="flex-1 -mt-0.5">
                <div
                  className={cn(
                    "rounded-lg p-3 border transition-all",
                    isLatest
                      ? "bg-primary/5 border-primary/20 shadow-sm"
                      : "bg-gray-50 border-gray-100"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isLatest ? "text-gray-800" : "text-gray-800"
                        )}
                      >
                        {t.node_name}
                      </span>
                      {isLatest && (
                        <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                          最新
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-mono flex items-center gap-1",
                        isLatest ? "text-primary" : "text-gray-400"
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      {new Date(t.created_at).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      isLatest ? "text-gray-600" : "text-gray-500"
                    )}
                  >
                    <User className="w-3 h-3" />
                    <span>{t.operator}</span>
                  </div>
                  {t.note && (
                    <p
                      className={cn(
                        "text-xs mt-1.5 rounded px-2 py-1 border",
                        isLatest
                          ? "text-gray-600 bg-white border-primary/10"
                          : "text-gray-500 bg-white border-gray-100"
                      )}
                    >
                      {t.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
