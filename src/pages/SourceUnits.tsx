import { useState, useEffect } from "react"
import { Building2, ArrowLeft, Edit2, Trash2, Plus, X, Search } from "lucide-react"
import { Link } from "react-router-dom"
import { useSourceUnitStore } from "@/store/sourceUnitStore"
import ConfirmModal from "@/components/ConfirmModal"
import type { SourceUnit } from "@/types"
import { SourceUnitType } from "@/types"

export default function SourceUnits() {
  const sourceUnits = useSourceUnitStore((s) => s.sourceUnits)
  const loading = useSourceUnitStore((s) => s.loading)
  const fetchSourceUnits = useSourceUnitStore((s) => s.fetchSourceUnits)
  const createSourceUnit = useSourceUnitStore((s) => s.createSourceUnit)
  const updateSourceUnit = useSourceUnitStore((s) => s.updateSourceUnit)
  const deleteSourceUnit = useSourceUnitStore((s) => s.deleteSourceUnit)

  const [showForm, setShowForm] = useState(false)
  const [editingUnit, setEditingUnit] = useState<SourceUnit | null>(null)
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState(SourceUnitType.HOSPITAL)
  const [formCode, setFormCode] = useState("")
  const [formContactPerson, setFormContactPerson] = useState("")
  const [formContactPhone, setFormContactPhone] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<SourceUnit | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("")

  useEffect(() => {
    fetchSourceUnits()
  }, [fetchSourceUnits])

  useEffect(() => {
    fetchSourceUnits({ type: filterType || undefined, search: searchQuery || undefined })
  }, [filterType, searchQuery, fetchSourceUnits])

  const resetForm = () => {
    setFormName("")
    setFormType(SourceUnitType.HOSPITAL)
    setFormCode("")
    setFormContactPerson("")
    setFormContactPhone("")
    setFormAddress("")
    setFormDescription("")
    setFormSortOrder(0)
    setEditingUnit(null)
  }

  const handleAddClick = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEditClick = (unit: SourceUnit) => {
    setEditingUnit(unit)
    setFormName(unit.name)
    setFormType(unit.type as SourceUnitType)
    setFormCode(unit.code || "")
    setFormContactPerson(unit.contact_person)
    setFormContactPhone(unit.contact_phone)
    setFormAddress(unit.address)
    setFormDescription(unit.description)
    setFormSortOrder(unit.sort_order)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    let success: boolean
    if (editingUnit) {
      success = await updateSourceUnit(editingUnit.id, {
        name: formName.trim(),
        type: formType,
        code: formCode.trim() || undefined,
        contact_person: formContactPerson.trim(),
        contact_phone: formContactPhone.trim(),
        address: formAddress.trim(),
        description: formDescription.trim(),
        sort_order: formSortOrder,
      })
    } else {
      success = await createSourceUnit({
        name: formName.trim(),
        type: formType,
        code: formCode.trim() || undefined,
        contact_person: formContactPerson.trim(),
        contact_phone: formContactPhone.trim(),
        address: formAddress.trim(),
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
    const success = await deleteSourceUnit(deleteTarget.id)
    if (success) {
      setDeleteTarget(null)
    }
  }

  const unitTypes = Object.values(SourceUnitType)
  const typeColors: Record<string, string> = {
    [SourceUnitType.HOSPITAL]: "bg-blue-50 text-blue-700",
    [SourceUnitType.DEPARTMENT]: "bg-green-50 text-green-700",
    [SourceUnitType.PARTNER]: "bg-purple-50 text-purple-700",
    [SourceUnitType.OTHER]: "bg-gray-50 text-gray-700",
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
          <Building2 className="w-7 h-7 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">来源单位管理</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <div>
            <div className="mb-4">
              <button
                onClick={handleAddClick}
                className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加来源单位
              </button>
            </div>

            {showForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">
                    {editingUnit ? "编辑单位" : "新建单位"}
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
                      单位名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="输入单位名称"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      单位类型
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as SourceUnitType)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                    >
                      {unitTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      单位编码
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="输入单位编码（可选）"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      联系人
                    </label>
                    <input
                      type="text"
                      value={formContactPerson}
                      onChange={(e) => setFormContactPerson(e.target.value)}
                      placeholder="输入联系人（可选）"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      联系电话
                    </label>
                    <input
                      type="text"
                      value={formContactPhone}
                      onChange={(e) => setFormContactPhone(e.target.value)}
                      placeholder="输入联系电话（可选）"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      地址
                    </label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="输入地址（可选）"
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
                      placeholder="输入描述信息（可选）"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
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

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={!formName.trim()}
                      className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {editingUnit ? "保存修改" : "创建"}
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-medium text-gray-600 mb-3">筛选条件</h4>
              <div className="space-y-3">
                <div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索单位名称/编码"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                  >
                    <option value="">全部类型</option>
                    {unitTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-600 mb-3">类型统计</h4>
              <div className="space-y-2">
                {unitTypes.map((type) => {
                  const count = sourceUnits.filter((u) => u.type === type).length
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-100 text-sm"
                    >
                      <span className="text-gray-700">{type}</span>
                      <span className="text-gray-400 text-xs">{count} 个</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            {loading && sourceUnits.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                加载中...
              </div>
            ) : sourceUnits.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                暂无来源单位数据，点击左侧"添加来源单位"按钮添加
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        单位名称
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        类型
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        编码
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        联系人
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        联系电话
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
                    {sourceUnits.map((unit) => (
                      <tr
                        key={unit.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                              {unit.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">
                                {unit.name}
                              </div>
                              {unit.address && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {unit.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[unit.type] || typeColors[SourceUnitType.OTHER]}`}>
                            {unit.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                          {unit.code || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {unit.contact_person || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {unit.contact_phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                          {new Date(unit.created_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditClick(unit)}
                              className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(unit)}
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
        title="删除来源单位"
        message={`确定要删除来源单位 "${deleteTarget?.name}" 吗？此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
