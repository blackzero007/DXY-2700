import { useState, useEffect } from "react"
import { FlaskConical } from "lucide-react"
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <FlaskConical className="w-7 h-7 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">样本追踪系统</h1>
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
