import { useState, useEffect } from "react"
import { List, ArrowLeft, Edit2, Trash2, Plus, X, FlaskConical } from "lucide-react"
import { Link } from "react-router-dom"
import { useSampleTypeStore } from "@/store/sampleTypeStore"
import ConfirmModal from "@/components/ConfirmModal"
import type { SampleType } from "@/types"

export default function SampleTypes() {
  const sampleTypes = useSampleTypeStore((s) => s.sampleTypes)
  const loading = useSampleTypeStore((s) => s.loading)
  const fetchSampleTypes = useSampleTypeStore((s) => s.fetchSampleTypes)
  const createSampleType = useSampleTypeStore((s) => s.createSampleType)
  const updateSampleType = useSampleTypeStore((s) => s.updateSampleType)
  const deleteSampleType = useSampleTypeStore((s) => s.deleteSampleType)

  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<SampleType | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<SampleType | null>(null)

  useEffect(() => {
    fetchSampleTypes()
  }, [fetchSampleTypes])

  const resetForm = () => {
    setFormName("")
    setFormDescription("")
    setFormSortOrder(0)
    setEditingType(null)
  }

  const handleAddClick = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEditClick = (sampleType: SampleType) => {
    setEditingType(sampleType)
    setFormName(sampleType.name)
    setFormDescription(sampleType.description)
    setFormSortOrder(sampleType.sort_order)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    let success: boolean
    if (editingType) {
      success = await updateSampleType(editingType.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        sort_order: formSortOrder,
      })
    } else {
      success = await createSampleType({
        name: formName.trim(),
        description: formDescription.trim(),
        sort_order: formSortOrder,
      })
    }

    if (success) {
      resetForm()
      setShowForm(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const success = await deleteSampleType(deleteTarget.id)
    if (success) {
      setDeleteTarget(null)
    }
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
          <FlaskConical className="w-7 h-7 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">样本类型管理</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div>
            <div className="mb-4">
              <button
                onClick={handleAddClick}
                className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建样本类型
              </button>
            </div>

            {showForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">
                    {editingType ? "编辑样本类型" : "新建样本类型"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                    className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      类型名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="输入样本类型名称"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      排序
                    </label>
                    <input
                      type="number"
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(Number(e.target.value))}
                      placeholder="排序号，数字越小越靠前"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      描述
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="输入描述（可选）"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={!formName.trim()}
                      className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {editingType ? "保存修改" : "创建"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div>
            {loading && sampleTypes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                加载中...
              </div>
            ) : sampleTypes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                暂无样本类型数据，点击左侧"创建样本类型"按钮添加
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        类型名称
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        排序
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        描述
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        创建时间
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleTypes.map((sampleType) => (
                      <tr
                        key={sampleType.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <List className="w-4 h-4 text-primary" />
                            <span className="font-medium text-gray-800">
                              {sampleType.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {sampleType.sort_order}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {sampleType.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                          {new Date(sampleType.created_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditClick(sampleType)}
                              className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(sampleType)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmModal
        open={!!deleteTarget}
        title="删除样本类型"
        message={`确定要删除样本类型 "${deleteTarget?.name}" 吗？若该类型已被样本使用则无法删除。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
