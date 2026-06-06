import { useState, useEffect } from "react"
import { FlaskConical, Package, Tag, AlertTriangle, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { useSampleStore } from "@/store/sampleStore"
import SampleForm from "@/components/SampleForm"
import SearchBar from "@/components/SearchBar"
import SampleTable from "@/components/SampleTable"
import StatusModal from "@/components/StatusModal"
import DeleteModal from "@/components/DeleteModal"
import type { Sample } from "@/types"

export default function Home() {
  const fetchSamples = useSampleStore((s) => s.fetchSamples)
  const [statusTarget, setStatusTarget] = useState<Sample | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Sample | null>(null)

  useEffect(() => {
    fetchSamples()
  }, [fetchSamples])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-primary" />
            <h1 className="text-xl font-bold text-gray-800">样本追踪系统</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              样本管理
            </Link>
            <Link
              to="/batches"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              批次管理
            </Link>
            <Link
              to="/tags"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              标签管理
            </Link>
            <Link
              to="/exceptions"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              异常管理
            </Link>
            <Link
              to="/operators"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              人员管理
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <SearchBar />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div>
            <SampleForm />
          </div>
          <div>
            <SampleTable
              onUpdateStatus={(sample) => setStatusTarget(sample)}
              onDelete={(sample) => setDeleteTarget(sample)}
            />
          </div>
        </div>
      </main>

      <StatusModal
        sample={statusTarget}
        onClose={() => setStatusTarget(null)}
      />
      <DeleteModal
        sample={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
