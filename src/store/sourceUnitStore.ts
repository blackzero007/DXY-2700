import { create } from "zustand"
import type { SourceUnit } from "@/types"
import * as api from "@/api/sourceUnits"
import { SourceUnitApiError } from "@/api/sourceUnits"
import { useToastStore } from "@/store/toastStore"

interface SourceUnitStore {
  sourceUnits: SourceUnit[]
  loading: boolean
  fetchSourceUnits: (params?: { type?: string; search?: string }) => Promise<void>
  createSourceUnit: (data: {
    name: string
    type?: string
    code?: string
    contact_person?: string
    contact_phone?: string
    address?: string
    description?: string
    sort_order?: number
  }) => Promise<boolean>
  updateSourceUnit: (
    id: number,
    data: {
      name?: string
      type?: string
      code?: string
      contact_person?: string
      contact_phone?: string
      address?: string
      description?: string
      sort_order?: number
    }
  ) => Promise<boolean>
  deleteSourceUnit: (id: number) => Promise<boolean>
}

function handleError(error: unknown, defaultMessage: string): string {
  if (error instanceof SourceUnitApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return defaultMessage
}

export const useSourceUnitStore = create<SourceUnitStore>((set, get) => ({
  sourceUnits: [],
  loading: false,

  fetchSourceUnits: async (params) => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const sourceUnits = await api.fetchSourceUnits(params)
      set({ sourceUnits })
    } catch (error) {
      const message = handleError(error, "加载来源单位列表失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  createSourceUnit: async (data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.createSourceUnit(data)
      await get().fetchSourceUnits()
      showToast("来源单位创建成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "创建来源单位失败")
      showToast(message, "error")
      return false
    }
  },

  updateSourceUnit: async (id, data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.updateSourceUnit(id, data)
      await get().fetchSourceUnits()
      showToast("来源单位更新成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "更新来源单位失败")
      showToast(message, "error")
      return false
    }
  },

  deleteSourceUnit: async (id) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.deleteSourceUnit(id)
      await get().fetchSourceUnits()
      showToast("来源单位删除成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "删除来源单位失败")
      showToast(message, "error")
      return false
    }
  },
}))
