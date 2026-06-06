import { FlaskConical, PlusCircle, CheckCircle, Trash2, BarChart3 } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { SampleStatus } from "@/types"
import { cn } from "@/lib/utils"

const statusConfig: { status: SampleStatus; label: string; color: string; bgColor: string }[] = [
  { status: SampleStatus.REGISTERED, label: "已登记", color: "text-blue-600", bgColor: "bg-blue-50" },
  { status: SampleStatus.IN_PROGRESS, label: "实验中", color: "text-amber-600", bgColor: "bg-amber-50" },
  { status: SampleStatus.COMPLETED, label: "已完成", color: "text-green-600", bgColor: "bg-green-50" },
  { status: SampleStatus.ARCHIVED, label: "已归档", color: "text-purple-600", bgColor: "bg-purple-50" },
  { status: SampleStatus.DISCARDED, label: "已废弃", color: "text-red-600", bgColor: "bg-red-50" },
]

export default function SampleStatsCard() {
  const stats = useSampleStore((s) => s.stats)
  const statsLoading = useSampleStore((s) => s.statsLoading)

  if (statsLoading && !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
          <div className="h-5 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="grid grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-800">样本统计看板</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <FlaskConical className="w-4 h-4" />
            <span className="text-sm">样本总数</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <PlusCircle className="w-4 h-4" />
            <span className="text-sm">今日新增</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.todayNew}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">已完成</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">已废弃</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.discarded}</p>
        </div>
      </div>

      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-600 mb-3">状态分布</h3>
        <div className="grid grid-cols-5 gap-3">
          {statusConfig.map(({ status, label, color, bgColor }) => {
            const count = stats.statusCounts[status] || 0
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
            return (
              <div key={status} className={cn("rounded-lg p-3 text-center", bgColor)}>
                <p className={cn("text-xl font-bold", color)}>{count}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
                <div className="mt-2 h-1 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
