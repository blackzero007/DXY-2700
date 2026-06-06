import { useState, useEffect } from "react"
import { Plus, Package } from "lucide-react"
import { useBatchStore } from "@/store/batchStore"
import { BatchType } from "@/types"
import type { Batch } from "@/types"

interface BatchFormProps {
  batch?: Batch | null
  onSuccess?: () => void
}

const BATCH_TYPES = Object.values(BatchType) as string[]

export default function BatchForm({ batch, onSuccess }: BatchFormProps) {
  const createBatch = useBatchStore((s) => s.createBatch)
  const updateBatch = useBatchStore((s) => s.updateBatch)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<string>(BATCH_TYPES[0])
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (batch) {
      setCode(batch.code)
      setName(batch.name)
      setType(batch.type)
      setDescription(batch.description)
    } else {
      setCode("")
      setName("")
      setType(BATCH_TYPES[0])
      setDescription("")
    }
  }, [batch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return

    let success: boolean
    if (batch) {
      success = await updateBatch(batch.id, {
        name: name.trim(),
        type,
        description: description.trim(),
      })
    } else {
      success = await createBatch({
        code: code.trim(),
        name: name.trim(),
        type,
        description: description.trim(),
      })
    }

    if (success) {
      if (!batch) {
        setCode("")
        setName("")
        setType(BATCH_TYPES[0])
        setDescription("")
      }
      onSuccess?.()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        {batch ? "编辑批次" : "创建批次"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            批次编号
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm font-mono disabled:bg-gray-50 disabled:text-gray-400"
            placeholder="输入批次编号"
            required
            disabled={!!batch}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            批次名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            placeholder="输入批次名称"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            批次类型
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
          >
            {BATCH_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
            placeholder="输入批次描述（可选）"
            rows={3}
          />
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {batch ? "保存修改" : "创建批次"}
        </button>
      </form>
    </div>
  )
}
