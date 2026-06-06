import { useState, useEffect } from "react"
import { Tag, ArrowLeft, Edit2, Trash2, Plus, X } from "lucide-react"
import { Link } from "react-router-dom"
import { useTagStore } from "@/store/tagStore"
import ConfirmModal from "@/components/ConfirmModal"
import type { Tag as TagType } from "@/types"

const PRESET_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#84cc16",
]

export default function Tags() {
  const tags = useTagStore((s) => s.tags)
  const loading = useTagStore((s) => s.loading)
  const fetchTags = useTagStore((s) => s.fetchTags)
  const createTag = useTagStore((s) => s.createTag)
  const updateTag = useTagStore((s) => s.updateTag)
  const deleteTag = useTagStore((s) => s.deleteTag)

  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  const [formName, setFormName] = useState("")
  const [formColor, setFormColor] = useState("#3b82f6")
  const [formDescription, setFormDescription] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<TagType | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const resetForm = () => {
    setFormName("")
    setFormColor("#3b82f6")
    setFormDescription("")
    setEditingTag(null)
  }

  const handleAddClick = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEditClick = (tag: TagType) => {
    setEditingTag(tag)
    setFormName(tag.name)
    setFormColor(tag.color)
    setFormDescription(tag.description)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    let success: boolean
    if (editingTag) {
      success = await updateTag(editingTag.id, {
        name: formName.trim(),
        color: formColor,
        description: formDescription.trim(),
      })
    } else {
      success = await createTag({
        name: formName.trim(),
        color: formColor,
        description: formDescription.trim(),
      })
    }

    if (success) {
      resetForm()
      setShowForm(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const success = await deleteTag(deleteTarget.id)
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
          <Tag className="w-7 h-7 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">标签管理</h1>
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
                创建标签
              </button>
            </div>

            {showForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">
                    {editingTag ? "编辑标签" : "新建标签"}
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
                      标签名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="输入标签名称"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      标签颜色
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm w-full hover:bg-gray-50 transition-colors"
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-gray-200"
                          style={{ backgroundColor: formColor }}
                        />
                        <span className="text-gray-700 font-mono text-xs">
                          {formColor}
                        </span>
                      </button>
                      {showColorPicker && (
                        <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10 grid grid-cols-5 gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => {
                                setFormColor(color)
                                setShowColorPicker(false)
                              }}
                              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                                formColor === color
                                  ? "border-gray-700 scale-110"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      描述
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="输入标签描述（可选）"
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
                      {editingTag ? "保存修改" : "创建"}
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
            {loading && tags.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                加载中...
              </div>
            ) : tags.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                暂无标签数据，点击左侧"创建标签"按钮添加
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        标签
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
                    {tags.map((tag) => (
                      <tr
                        key={tag.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="font-medium text-gray-800">
                              {tag.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {tag.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                          {new Date(tag.created_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditClick(tag)}
                              className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(tag)}
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
        title="删除标签"
        message={`确定要删除标签 "${deleteTarget?.name}" 吗？删除后所有样本的该标签将被移除。此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
