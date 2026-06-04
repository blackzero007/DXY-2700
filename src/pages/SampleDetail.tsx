import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, FlaskConical, FileText, Clock } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { SampleStatus } from "@/types"
import TransitionTimeline from "@/components/TransitionTimeline"
import TransitionForm from "@/components/TransitionForm"

const STATUS_COLORS: Record<SampleStatus, string> = {
  [SampleStatus.REGISTERED]: "bg-blue-100 text-blue-700",
  [SampleStatus.IN_PROGRESS]: "bg-amber-100 text-amber-700",
  [SampleStatus.COMPLETED]: "bg-green-100 text-green-700",
  [SampleStatus.ARCHIVED]: "bg-gray-100 text-gray-600",
  [SampleStatus.DISCARDED]: "bg-red-100 text-red-700",
}

export default function SampleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentSample = useSampleStore((s) => s.currentSample)
  const fetchSampleDetail = useSampleStore((s) => s.fetchSampleDetail)
  const loading = useSampleStore((s) => s.loading)

  useEffect(() => {
    if (id) fetchSampleDetail(Number(id))
  }, [id, fetchSampleDetail])

  if (loading && !currentSample) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        加载中...
      </div>
    )
  }

  if (!currentSample) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        未找到样本
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <FlaskConical className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold text-gray-800">样本详情</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6 animate-fadeIn">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{currentSample.name}</h2>
              <p className="text-sm font-mono text-gray-400 mt-1">{currentSample.code}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[currentSample.status]}`}>
              {currentSample.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">类型</p>
                <p className="text-sm text-gray-700">{currentSample.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">来源</p>
                <p className="text-sm text-gray-700">{currentSample.source || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">创建时间</p>
                <p className="text-sm text-gray-700 font-mono text-xs">
                  {new Date(currentSample.created_at).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">更新时间</p>
                <p className="text-sm text-gray-700 font-mono text-xs">
                  {new Date(currentSample.updated_at).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">流转记录</h3>
          <TransitionTimeline transitions={currentSample.transitions} />
        </div>

        <TransitionForm sampleId={currentSample.id} />
      </main>
    </div>
  )
}
