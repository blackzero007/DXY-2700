import { useState, useEffect } from "react"
import { Archive, ArrowLeft, Search, Eye, User, Clock, FileText } from "lucide-react"
import { Link } from "react-router-dom"
import { useSampleStore } from "@/store/sampleStore"
import { SampleStatus } from "@/types"
import type { ArchivedSample } from "@/types"

const STATUS_COLORS: Record<SampleStatus, string> = {
  [SampleStatus.REGISTERED]: "bg-blue-100 text-blue-700",
  [SampleStatus.IN_PROGRESS]: "bg-amber-100 text-amber-700",
  [SampleStatus.COMPLETED]: "bg-green-100 text-green-700",
  [SampleStatus.ARCHIVED]: "bg-gray-100 text-gray-600",
  [SampleStatus.DISCARDED]: "bg-red-100 text-red-700",
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

function ArchiveCard({ sample }: { sample: ArchivedSample }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-gray-400">{sample.code}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sample.status]}`}>
              {sample.status}
            </span>
          </div>
          <h3 className="text-base font-medium text-gray-800 truncate">{sample.name}</h3>
        </div>
        <Link
          to={`/sample/${sample.id}`}
          className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors flex-shrink-0"
          title="查看详情"
        >
          <Eye className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div className="flex items-center gap-1.5 text-gray-500">
          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{sample.type}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Archive className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{sample.source || "-"}</span>
        </div>
      </div>

      {sample.tags && sample.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {sample.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-500 flex-shrink-0">归档时间：</span>
          <span className="text-gray-700 font-mono text-xs">
            {sample.archived_at ? new Date(sample.archived_at).toLocaleString("zh-CN") : "-"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-500 flex-shrink-0">归档人：</span>
          <span className="text-gray-700">{sample.archived_by || "-"}</span>
        </div>
        {sample.archive_note && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-gray-500 flex-shrink-0">归档说明：</span>
            <span className="text-gray-600 line-clamp-2">{sample.archive_note}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ArchiveRecords() {
  const archivedSamples = useSampleStore((s) => s.archivedSamples)
  const archivedLoading = useSampleStore((s) => s.archivedLoading)
  const fetchArchivedSamples = useSampleStore((s) => s.fetchArchivedSamples)
  const searchArchivedSamples = useSampleStore((s) => s.searchArchivedSamples)
  const [searchText, setSearchText] = useState("")
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchArchivedSamples()
  }, [fetchArchivedSamples])

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    const timeout = setTimeout(() => {
      if (value.trim()) {
        searchArchivedSamples(value)
      } else {
        fetchArchivedSamples()
      }
    }, 300)
    setSearchTimeout(timeout)
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
          <Archive className="w-7 h-7 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">样本归档记录</h1>
          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
            共 {archivedSamples.length} 条
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索样本编号、名称..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          />
        </div>

        {archivedLoading && archivedSamples.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
            加载中...
          </div>
        ) : archivedSamples.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Archive className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">暂无归档样本</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedSamples.map((sample) => (
              <ArchiveCard key={sample.id} sample={sample} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
