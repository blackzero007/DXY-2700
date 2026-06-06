import { useState, useEffect } from "react"
import { AlertTriangle, ArrowLeft, Search, X, Filter } from "lucide-react"
import { Link } from "react-router-dom"
import { useExceptionStore } from "@/store/exceptionStore"
import { ExceptionStatus, ExceptionType } from "@/types"
import type { SampleExceptionWithSample } from "@/types"
import ExceptionTable from "@/components/ExceptionTable"
import ExceptionResolveForm from "@/components/ExceptionResolveForm"
import ConfirmModal from "@/components/ConfirmModal"

const EXCEPTION_TYPE_OPTIONS = Object.values(ExceptionType)
const EXCEPTION_STATUS_OPTIONS = Object.values(ExceptionStatus)

export default function Exceptions() {
  const exceptions = useExceptionStore((s) => s.exceptions)
  const loading = useExceptionStore((s) => s.loading)
  const fetchExceptions = useExceptionStore((s) => s.fetchExceptions)
  const deleteException = useExceptionStore((s) => s.deleteException)
  const setFilterType = useExceptionStore((s) => s.setFilterType)
  const setFilterStatus = useExceptionStore((s) => s.setFilterStatus)
  const filterType = useExceptionStore((s) => s.filterType)
  const filterStatus = useExceptionStore((s) => s.filterStatus)

  const [editTarget, setEditTarget] = useState<SampleExceptionWithSample | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SampleExceptionWithSample | null>(null)
  const [searchText, setSearchText] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchExceptions()
  }, [fetchExceptions])

  const filteredExceptions = exceptions.filter((exc) => {
    if (!searchText.trim()) return true
    const q = searchText.toLowerCase()
    return (
      exc.title.toLowerCase().includes(q) ||
      exc.sample_code.toLowerCase().includes(q) ||
      exc.sample_name.toLowerCase().includes(q) ||
      exc.reporter.toLowerCase().includes(q) ||
      exc.description.toLowerCase().includes(q)
    )
  })

  const handleFilterType = (type: ExceptionType | null) => {
    setFilterType(type)
    fetchExceptions()
  }

  const handleFilterStatus = (status: ExceptionStatus | null) => {
    setFilterStatus(status)
    fetchExceptions()
  }

  const clearFilters = () => {
    setFilterType(null)
    setFilterStatus(null)
    fetchExceptions()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const success = await deleteException(deleteTarget.id)
    if (success) setDeleteTarget(null)
  }

  const hasActiveFilters = filterType !== null || filterStatus !== null

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
          <AlertTriangle className="w-7 h-7 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">异常管理</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索异常标题、样本编号..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              hasActiveFilters
                ? "border-primary text-primary bg-primary/5"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-6 animate-fadeIn">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">异常类型</label>
              <div className="flex flex-wrap gap-2">
                {EXCEPTION_TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleFilterType(filterType === t ? null : t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterType === t
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">处理状态</label>
              <div className="flex flex-wrap gap-2">
                {EXCEPTION_STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleFilterStatus(filterStatus === s ? null : s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterStatus === s
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <ExceptionTable
          exceptions={filteredExceptions}
          loading={loading}
          onEdit={(exc) => setEditTarget(exc)}
          onDelete={(exc) => setDeleteTarget(exc)}
          showSample={true}
        />
      </main>

      {editTarget && (
        <ExceptionResolveForm
          exception={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="删除异常记录"
        message={`确定要删除异常记录 "${deleteTarget?.title}" 吗？此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
