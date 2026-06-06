import { Trash2, Edit2, AlertTriangle } from "lucide-react"
import { ExceptionStatus, ExceptionType } from "@/types"
import type { SampleExceptionWithSample } from "@/types"

const TYPE_COLORS: Record<ExceptionType, string> = {
  [ExceptionType.CONTAMINATION]: "bg-red-100 text-red-700",
  [ExceptionType.DAMAGE]: "bg-orange-100 text-orange-700",
  [ExceptionType.INFO_MISSING]: "bg-yellow-100 text-yellow-700",
  [ExceptionType.RESULT_ABNORMAL]: "bg-purple-100 text-purple-700",
  [ExceptionType.OTHER]: "bg-gray-100 text-gray-600",
}

const STATUS_COLORS: Record<ExceptionStatus, string> = {
  [ExceptionStatus.OPEN]: "bg-red-100 text-red-700",
  [ExceptionStatus.IN_PROGRESS]: "bg-blue-100 text-blue-700",
  [ExceptionStatus.RESOLVED]: "bg-green-100 text-green-700",
  [ExceptionStatus.CLOSED]: "bg-gray-100 text-gray-500",
}

interface ExceptionTableProps {
  exceptions: SampleExceptionWithSample[]
  loading: boolean
  onEdit: (exception: SampleExceptionWithSample) => void
  onDelete: (exception: SampleExceptionWithSample) => void
  showSample?: boolean
}

export default function ExceptionTable({
  exceptions,
  loading,
  onEdit,
  onDelete,
  showSample = true,
}: ExceptionTableProps) {
  if (loading && exceptions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
        加载中...
      </div>
    )
  }

  if (exceptions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>暂无异常记录</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {showSample && <th className="text-left px-4 py-3 font-medium text-gray-600">样本</th>}
              <th className="text-left px-4 py-3 font-medium text-gray-600">类型</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">标题</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">报告人</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">处理人</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">创建时间</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.map((exc) => (
              <tr key={exc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                {showSample && (
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-800 font-medium">{exc.sample_name}</p>
                      <p className="text-xs font-mono text-gray-400">{exc.sample_code}</p>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[exc.type] || TYPE_COLORS[ExceptionType.OTHER]}`}>
                    {exc.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-800 max-w-[200px] truncate" title={exc.title}>
                  {exc.title}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[exc.status] || STATUS_COLORS[ExceptionStatus.OPEN]}`}>
                    {exc.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{exc.reporter}</td>
                <td className="px-4 py-3 text-gray-600">{exc.handler || "-"}</td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                  {new Date(exc.created_at).toLocaleString("zh-CN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(exc)}
                      className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                      title="处理异常"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(exc)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
