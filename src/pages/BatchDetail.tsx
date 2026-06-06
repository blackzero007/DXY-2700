import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Package, Users, CheckCircle, XCircle, FlaskConical } from "lucide-react"
import { useBatchStore } from "@/store/batchStore"
import { useSampleStore } from "@/store/sampleStore"
import { SampleStatus } from "@/types"
import type { Sample } from "@/types"
import StatusModal from "@/components/StatusModal"
import DeleteModal from "@/components/DeleteModal"

const STATUS_COLORS: Record<SampleStatus, string> = {
  [SampleStatus.REGISTERED]: "bg-blue-100 text-blue-700",
  [SampleStatus.IN_PROGRESS]: "bg-amber-100 text-amber-700",
  [SampleStatus.COMPLETED]: "bg-green-100 text-green-700",
  [SampleStatus.ARCHIVED]: "bg-gray-100 text-gray-600",
  [SampleStatus.DISCARDED]: "bg-red-100 text-red-700",
}

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>()
  const currentBatch = useBatchStore((s) => s.currentBatch)
  const fetchBatchDetail = useBatchStore((s) => s.fetchBatchDetail)
  const batchSamples = useBatchStore((s) => s.batchSamples)
  const fetchBatchSamples = useBatchStore((s) => s.fetchBatchSamples)
  const loading = useBatchStore((s) => s.loading)

  const [statusTarget, setStatusTarget] = useState<Sample | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Sample | null>(null)

  useEffect(() => {
    if (id) {
      const batchId = Number(id)
      fetchBatchDetail(batchId)
      fetchBatchSamples(batchId)
    }
  }, [id, fetchBatchDetail, fetchBatchSamples])

  const refreshSamples = () => {
    if (id) {
      fetchBatchSamples(Number(id))
    }
  }

  const handleStatusUpdate = () => {
    refreshSamples()
    if (id) fetchBatchDetail(Number(id))
  }

  const handleDelete = () => {
    refreshSamples()
    if (id) fetchBatchDetail(Number(id))
  }

  if (loading && !currentBatch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </div>
    )
  }

  if (!currentBatch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">批次不存在</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            to="/batches"
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Package className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{currentBatch.name}</h1>
            <p className="text-sm text-gray-400 font-mono">{currentBatch.code}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">样本总数</p>
                <p className="text-2xl font-bold text-gray-800">
                  {currentBatch.stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-green-600">
                  {currentBatch.stats.completed}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已废弃</p>
                <p className="text-2xl font-bold text-red-500">
                  {currentBatch.stats.discarded}
                </p>
              </div>
            </div>
          </div>
        </div>

        {currentBatch.description && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">批次描述</h3>
            <p className="text-gray-700">{currentBatch.description}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-gray-800">批次样本</h2>
            <span className="text-sm text-gray-400">({batchSamples.length})</span>
          </div>

          {loading && batchSamples.length === 0 ? (
            <div className="p-12 text-center text-gray-400">加载中...</div>
          ) : batchSamples.length === 0 ? (
            <div className="p-12 text-center text-gray-400">该批次暂无样本</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      编号
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      名称
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      类型
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      状态
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      创建时间
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batchSamples.map((sample) => (
                    <tr
                      key={sample.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {sample.code}
                      </td>
                      <td className="px-4 py-3 text-gray-800">{sample.name}</td>
                      <td className="px-4 py-3 text-gray-600">{sample.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sample.status]}`}
                        >
                          {sample.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                        {new Date(sample.created_at).toLocaleString("zh-CN")}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/sample/${sample.id}`}
                          className="text-primary hover:text-primary/80 text-sm"
                        >
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <StatusModal
        sample={statusTarget}
        onClose={() => setStatusTarget(null)}
        onSuccess={handleStatusUpdate}
      />
      <DeleteModal
        sample={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleDelete}
      />
    </div>
  )
}
