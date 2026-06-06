import { useState, useEffect } from "react"
import { Plus, FlaskConical, AlertCircle } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"
import { useBatchStore } from "@/store/batchStore"
import { useSampleTypeStore } from "@/store/sampleTypeStore"
import { useSourceUnitStore } from "@/store/sourceUnitStore"

const SAMPLE_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/

interface FormErrors {
  code?: string
  name?: string
  type?: string
  source?: string
}

export default function SampleForm() {
  const createSample = useSampleStore((s) => s.createSample)
  const batches = useBatchStore((s) => s.batches)
  const fetchBatches = useBatchStore((s) => s.fetchBatches)
  const sampleTypes = useSampleTypeStore((s) => s.sampleTypes)
  const fetchSampleTypes = useSampleTypeStore((s) => s.fetchSampleTypes)
  const sourceUnits = useSourceUnitStore((s) => s.sourceUnits)
  const fetchSourceUnits = useSourceUnitStore((s) => s.fetchSourceUnits)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [source, setSource] = useState("")
  const [sourceUnitId, setSourceUnitId] = useState<string>("")
  const [batchId, setBatchId] = useState<string>("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBatches()
    fetchSampleTypes()
    fetchSourceUnits()
  }, [fetchBatches, fetchSampleTypes, fetchSourceUnits])

  useEffect(() => {
    if (sampleTypes.length > 0 && !type) {
      setType(sampleTypes[0].name)
    }
  }, [sampleTypes, type])

  useEffect(() => {
    if (sourceUnitId) {
      const unit = sourceUnits.find((u) => u.id === Number(sourceUnitId))
      if (unit) {
        setSource(unit.name)
      }
    }
  }, [sourceUnitId, sourceUnits])

  const validateCode = (value: string): string | undefined => {
    const trimmed = value.trim()
    if (!trimmed) {
      return "请输入样本编号"
    }
    if (trimmed.length < 2) {
      return "样本编号至少需要 2 个字符"
    }
    if (trimmed.length > 30) {
      return "样本编号不能超过 30 个字符"
    }
    if (!SAMPLE_CODE_PATTERN.test(trimmed)) {
      return "样本编号格式不正确：仅支持字母、数字、下划线和连字符，且必须以字母或数字开头"
    }
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    const codeError = validateCode(code)
    if (codeError) {
      newErrors.code = codeError
    }

    if (!name.trim()) {
      newErrors.name = "请输入样本名称"
    }

    if (!type) {
      newErrors.type = "请选择样本类型"
    }

    if (!source.trim()) {
      newErrors.source = "请输入样本来源详情"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCode(value)
    if (errors.code) {
      const error = validateCode(value)
      setErrors((prev) => ({ ...prev, code: error }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (submitting) return

    setSubmitting(true)
    try {
      const result = await createSample({
        code: code.trim(),
        name: name.trim(),
        type,
        source: source.trim(),
        batch_id: batchId ? Number(batchId) : null,
      })
      if (result.success) {
        setCode("")
        setName("")
        setType(sampleTypes[0]?.name || "")
        setSource("")
        setSourceUnitId("")
        setBatchId("")
        setErrors({})
      } else if (result.error) {
        if (result.error.includes("样本编号") && result.error.includes("已存在")) {
          setErrors((prev) => ({ ...prev, code: result.error }))
        } else if (result.error.includes("样本名称")) {
          setErrors((prev) => ({ ...prev, name: result.error }))
        } else if (result.error.includes("样本类型")) {
          setErrors((prev) => ({ ...prev, type: result.error }))
        } else if (result.error.includes("样本来源")) {
          setErrors((prev) => ({ ...prev, source: result.error }))
        }
      }
    } finally {
      setSubmitting(false)
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
            onChange={handleCodeChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm font-mono ${
              errors.code ? "border-red-300 focus:ring-red-300 focus:border-red-400" : "border-gray-200"
            }`}
            placeholder="如：SAMPLE-001"
          />
          {errors.code ? (
            <p className="mt-1.5 text-xs text-red-500 flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{errors.code}</span>
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-400">支持字母、数字、下划线和连字符，2-30 个字符</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">样本名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm ${
              errors.name ? "border-red-300 focus:ring-red-300 focus:border-red-400" : "border-gray-200"
            }`}
            placeholder="输入样本名称"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-500 flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">样本类型</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white ${
              errors.type ? "border-red-300 focus:ring-red-300 focus:border-red-400" : "border-gray-200"
            }`}
          >
            {sampleTypes.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1.5 text-xs text-red-500 flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{errors.type}</span>
            </p>
          )}
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
          <label className="block text-sm font-medium text-gray-600 mb-1">来源单位</label>
          <select
            value={sourceUnitId}
            onChange={(e) => setSourceUnitId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
          >
            <option value="">请选择来源单位</option>
            {sourceUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">来源详情</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm ${
              errors.source ? "border-red-300 focus:ring-red-300 focus:border-red-400" : "border-gray-200"
            }`}
            placeholder="或手动输入来源信息"
          />
          {errors.source && (
            <p className="mt-1.5 text-xs text-red-500 flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{errors.source}</span>
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={`w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-lg text-sm font-medium transition-colors ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          <Plus className="w-4 h-4" />
          {submitting ? "登记中..." : "登记样本"}
        </button>
      </form>
    </div>
  )
}
