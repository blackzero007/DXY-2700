import { useState } from "react"
import { Plus } from "lucide-react"
import { useSampleStore } from "@/store/sampleStore"

interface TransitionFormProps {
  sampleId: number
}

export default function TransitionForm({ sampleId }: TransitionFormProps) {
  const addTransition = useSampleStore((s) => s.addTransition)
  const [nodeName, setNodeName] = useState("")
  const [operator, setOperator] = useState("")
  const [note, setNote] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nodeName.trim() || !operator.trim()) return
    const success = await addTransition(sampleId, {
      node_name: nodeName.trim(),
      operator: operator.trim(),
      note: note.trim(),
    })
    if (success) {
      setNodeName("")
      setOperator("")
      setNote("")
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">添加流转记录</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">节点名称</label>
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            placeholder="输入节点名称"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">操作人</label>
          <input
            type="text"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            placeholder="输入操作人"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">备注</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
            rows={3}
            placeholder="输入备注信息"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加记录
        </button>
      </form>
    </div>
  )
}
