import { useState, useEffect } from "react"
import { Package, ArrowLeft, Search } from "lucide-react"
import { Link } from "react-router-dom"
import { useBatchStore } from "@/store/batchStore"
import BatchCard from "@/components/BatchCard"
import BatchForm from "@/components/BatchForm"
import ConfirmModal from "@/components/ConfirmModal"
import type { BatchWithStats } from "@/types"

export default function Batches() {
  const batches = useBatchStore((s) => s.batches)
  const loading = useBatchStore((s) => s.loading)
  const fetchBatches = useBatchStore((s) => s.fetchBatches)
  const searchBatches = useBatchStore((s) => s.searchBatches)
  const searchQuery = useBatchStore((s) => s.searchQuery)
  const setSearchQuery = useBatchStore((s) => s.setSearchQuery)
  const deleteBatch = useBatchStore((s) => s.deleteBatch)

  const [editingBatch, setEditingBatch] = useState<BatchWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BatchWithStats | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      searchBatches(value)
    } else {
      fetchBatches()
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const success = await deleteBatch(deleteTarget.id)
    if (success) {
      setDeleteTarget(null)
    }
  }

  const handleFormSuccess = () => {
    setEditingBatch(null)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Package className="w-7 h-7 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">批次管理</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div>
            <div className="mb-4">
              <button
                onClick={() => {
                  setEditingBatch(null)
                  setShowForm(!showForm)
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {showForm ? "收起表单" : "+ 创建批次"}
              </button>
            </div>
            {showForm && (
              <BatchForm batch={editingBatch} onSuccess={handleFormSuccess} />
            )}
          </div>

          <div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="搜索批次编号、名称..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
                />
              </div>
            </div>

            {loading && batches.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                加载中...
              </div>
            ) : batches.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                暂无批次数据
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {batches.map((batch) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onEdit={(b) => {
                      setEditingBatch(b)
                      setShowForm(true)
                    }}
                    onDelete={(b) => setDeleteTarget(b)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmModal
        open={!!deleteTarget}
        title="删除批次"
        message={`确定要删除批次 "${deleteTarget?.name}" 吗？删除后批次中的样本将取消关联。此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
