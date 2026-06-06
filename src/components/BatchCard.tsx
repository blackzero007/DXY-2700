import { Link } from "react-router-dom"
import { Package, Users, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react"
import type { BatchWithStats } from "@/types"
import { BatchType } from "@/types"

interface BatchCardProps {
  batch: BatchWithStats
  onEdit: (batch: BatchWithStats) => void
  onDelete: (batch: BatchWithStats) => void
}

export default function BatchCard({ batch, onEdit, onDelete }: BatchCardProps) {
  const isProject = batch.type === BatchType.PROJECT

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg ${
              isProject ? "bg-indigo-100 text-indigo-600" : "bg-teal-100 text-teal-600"
            }`}
          >
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{batch.name}</h3>
            <p className="text-xs text-gray-400 font-mono">{batch.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(batch)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(batch)}
            className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {batch.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{batch.description}</p>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs">总数</span>
          </div>
          <p className="text-lg font-bold text-gray-800">{batch.stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs">完成</span>
          </div>
          <p className="text-lg font-bold text-green-600">{batch.stats.completed}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
            <XCircle className="w-3.5 h-3.5" />
            <span className="text-xs">废弃</span>
          </div>
          <p className="text-lg font-bold text-red-500">{batch.stats.discarded}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span
          className={`px-2 py-0.5 rounded-full font-medium ${
            isProject ? "bg-indigo-100 text-indigo-600" : "bg-teal-100 text-teal-600"
          }`}
        >
          {batch.type}
        </span>
        <Link
          to={`/batch/${batch.id}`}
          className="text-primary hover:text-primary/80 font-medium"
        >
          查看详情 →
        </Link>
      </div>
    </div>
  )
}
