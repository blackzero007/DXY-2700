import { useState, useEffect } from "react"
import { Plus, FlaskConical } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { useBatchStore } from "@/store/batchStore"

const SAMPLE_TYPES = ["血液", "尿液", "组织", "细胞", "其他"]

export default function SampleForm() {
  const createSample = useSampleStore((s) => s.createSample)
  const batches = useBatchStore((s) => s.batches)
  const fetchBatches = useBatchStore((s) => s.fetchBatches)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState(SAMPLE_TYPES[0])
  const [source, setSource] = useState("")
  const [batchId, setBatchId] = useState<string>("")

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return
    const success = await createSample({
      code: code.trim(),
      name: name.trim(),
      type,
      source: source.trim(),
      batch_id: batchId ? Number(batchId) : null,
    })
    if (success) {
      setCode("")
      setName("")
      setType(SAMPLE_TYPES[0])
      setSource("")
      setBatchId("")
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FlaskConical className="w-5 h-5 text-primary" />
        登记样本
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">样本编号</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm font-mono"
            placeholder="输入样本编号"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">样本名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            placeholder="输入样本名称"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">样本类型</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
          >
            {SAMPLE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">所属批次</label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
          >
            <option value="">不归属批次</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} - {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">来源</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            placeholder="输入样本来源"
          />
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          登记样本
        </button>
      </form>
    </div>
  )
}
