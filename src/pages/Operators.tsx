import { useState, useEffect } from "react"
import { Users, ArrowLeft, Edit2, Trash2, Plus, X } from "lucide-react"
import { Link } from "react-router-dom"
import { useOperatorStore } from "@/store/operatorStore"
import ConfirmModal from "@/components/ConfirmModal"
import type { Operator } from "@/types"

export default function Operators() {
  const operators = useOperatorStore((s) => s.operators)
  const loading = useOperatorStore((s) => s.loading)
  const fetchOperators = useOperatorStore((s) => s.fetchOperators)
  const createOperator = useOperatorStore((s) => s.createOperator)
  const updateOperator = useOperatorStore((s) => s.updateOperator)
  const deleteOperator = useOperatorStore((s) => s.deleteOperator)

  const [showForm, setShowForm] = useState(false)
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null)
  const [formName, setFormName] = useState("")
  const [formEmployeeId, setFormEmployeeId] = useState("")
  const [formTeam, setFormTeam] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Operator | null>(null)

  useEffect(() => {
    fetchOperators()
  }, [fetchOperators])

  const resetForm = () => {
    setFormName("")
    setFormEmployeeId("")
    setFormTeam("")
    setEditingOperator(null)
  }

  const handleAddClick = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEditClick = (op: Operator) => {
    setEditingOperator(op)
    setFormName(op.name)
    setFormEmployeeId(op.employee_id)
    setFormTeam(op.team)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formEmployeeId.trim()) return

    let success: boolean
    if (editingOperator) {
      success = await updateOperator(editingOperator.id, {
        name: formName.trim(),
        employee_id: formEmployeeId.trim(),
        team: formTeam.trim(),
      })
    } else {
      success = await createOperator({
        name: formName.trim(),
        employee_id: formEmployeeId.trim(),
        team: formTeam.trim(),
      })
    }

    if (success) {
      resetForm()
      setShowForm(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const success = await deleteOperator(deleteTarget.id)
    if (success) {
      setDeleteTarget(null)
    }
  }

  const teams = [...new Set(operators.map((op) => op.team).filter(Boolean))]

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
          <Users className="w-7 h-7 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">实验人员管理</h1>
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
                添加人员
              </button>
            </div>

            {showForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">
                    {editingOperator ? "编辑人员" : "新建人员"}
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
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="输入姓名"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      工号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formEmployeeId}
                      onChange={(e) => setFormEmployeeId(e.target.value)}
                      placeholder="输入工号"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      所属小组
                    </label>
                    <input
                      type="text"
                      value={formTeam}
                      onChange={(e) => setFormTeam(e.target.value)}
                      placeholder="输入所属小组（可选）"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      list="team-list"
                    />
                    <datalist id="team-list">
                      {teams.map((team) => (
                        <option key={team} value={team} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={!formName.trim() || !formEmployeeId.trim()}
                      className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {editingOperator ? "保存修改" : "创建"}
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

            {teams.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-600 mb-3">小组列表</h4>
                <div className="space-y-2">
                  {teams.map((team) => {
                    const count = operators.filter((op) => op.team === team).length
                    return (
                      <div
                        key={team}
                        className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-100 text-sm"
                      >
                        <span className="text-gray-700">{team}</span>
                        <span className="text-gray-400 text-xs">{count} 人</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            {loading && operators.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                加载中...
              </div>
            ) : operators.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                暂无实验人员数据，点击左侧"添加人员"按钮添加
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        姓名
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        工号
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        所属小组
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
                    {operators.map((op) => (
                      <tr
                        key={op.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                              {op.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-800">
                              {op.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                          {op.employee_id}
                        </td>
                        <td className="px-4 py-3">
                          {op.team ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {op.team}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                          {new Date(op.created_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditClick(op)}
                              className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(op)}
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
        title="删除实验人员"
        message={`确定要删除实验人员 "${deleteTarget?.name}" 吗？此操作不可撤销。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
