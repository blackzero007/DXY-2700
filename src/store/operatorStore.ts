import { create } from "zustand"
import type { Operator } from "@/types"
import * as api from "@/api/operators"
import { OperatorApiError } from "@/api/operators"
import { useToastStore } from "@/store/toastStore"

interface OperatorStore {
  operators: Operator[]
  loading: boolean
  fetchOperators: () => Promise<void>
  createOperator: (data: { name: string; employee_id: string; team?: string }) => Promise<boolean>
  updateOperator: (id: number, data: { name?: string; employee_id?: string; team?: string }) => Promise<boolean>
  deleteOperator: (id: number) => Promise<boolean>
}

function handleError(error: unknown, defaultMessage: string): string {
  if (error instanceof OperatorApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return defaultMessage
}

export const useOperatorStore = create<OperatorStore>((set, get) => ({
  operators: [],
  loading: false,

  fetchOperators: async () => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const operators = await api.fetchOperators()
      set({ operators })
    } catch (error) {
      const message = handleError(error, "加载实验人员列表失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  createOperator: async (data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.createOperator(data)
      await get().fetchOperators()
      showToast("实验人员创建成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "创建实验人员失败")
      showToast(message, "error")
      return false
    }
  },

  updateOperator: async (id, data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.updateOperator(id, data)
      await get().fetchOperators()
      showToast("实验人员更新成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "更新实验人员失败")
      showToast(message, "error")
      return false
    }
  },

  deleteOperator: async (id) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.deleteOperator(id)
      await get().fetchOperators()
      showToast("实验人员删除成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "删除实验人员失败")
      showToast(message, "error")
      return false
    }
  },
}))
