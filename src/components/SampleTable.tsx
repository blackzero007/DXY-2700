import { Link } from "react-router-dom"
import { Eye, Trash2, Edit, Download } from "lucide-react"
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

interface SampleTableProps {
  onUpdateStatus: (sample: Sample) => void
  onDelete: (sample: Sample) => void
}

function TagBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {name}
    </span>
  )
}

export default function SampleTable({ onUpdateStatus, onDelete }: SampleTableProps) {
  const samples = useSampleStore((s) => s.samples)
  const loading = useSampleStore((s) => s.loading)
  const exporting = useSampleStore((s) => s.exporting)
  const exportSamples = useSampleStore((s) => s.exportSamples)

  if (loading && samples.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
        加载中...
      </div>
    )
  }

  if (samples.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
        暂无样本数据
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-gray-700">样本列表</h3>
        <button
          onClick={() => exportSamples()}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {exporting ? "导出中..." : "导出 CSV"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-600">编号</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">名称</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">类型</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">来源</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">标签</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">创建时间</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample) => (
              <tr key={sample.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{sample.code}</td>
                <td className="px-4 py-3 text-gray-800">{sample.name}</td>
                <td className="px-4 py-3 text-gray-600">{sample.type}</td>
                <td className="px-4 py-3 text-gray-600">{sample.source || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sample.status]}`}>
                    {sample.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {sample.tags && sample.tags.length > 0 ? (
                      sample.tags.map((tag) => (
                        <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                      ))
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                  {new Date(sample.created_at).toLocaleString("zh-CN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/sample/${sample.id}`}
                      className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onUpdateStatus(sample)}
                      className="p-1.5 rounded-md hover:bg-amber-50 text-accent transition-colors"
                      title="更新状态"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(sample)}
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
