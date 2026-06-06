import { create } from "zustand"
import type { SampleType } from "@/types"
import * as api from "@/api/sampleTypes"
import { SampleTypeApiError } from "@/api/sampleTypes"
import { useToastStore } from "@/store/toastStore"

interface SampleTypeStore {
  sampleTypes: SampleType[]
  loading: boolean
  fetchSampleTypes: () => Promise<void>
  createSampleType: (data: { name: string; description?: string; sort_order?: number }) => Promise<boolean>
  updateSampleType: (id: number, data: { name?: string; description?: string; sort_order?: number }) => Promise<boolean>
  deleteSampleType: (id: number) => Promise<boolean>
}

function handleError(error: unknown, defaultMessage: string): string {
  if (error instanceof SampleTypeApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return defaultMessage
}

export const useSampleTypeStore = create<SampleTypeStore>((set, get) => ({
  sampleTypes: [],
  loading: false,

  fetchSampleTypes: async () => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const sampleTypes = await api.fetchSampleTypes()
      set({ sampleTypes })
    } catch (error) {
      const message = handleError(error, "加载样本类型列表失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  createSampleType: async (data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.createSampleType(data)
      await get().fetchSampleTypes()
      showToast("样本类型创建成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "创建样本类型失败")
      showToast(message, "error")
      return false
    }
  },

  updateSampleType: async (id, data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.updateSampleType(id, data)
      await get().fetchSampleTypes()
      showToast("样本类型更新成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "更新样本类型失败")
      showToast(message, "error")
      return false
    }
  },

  deleteSampleType: async (id) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.deleteSampleType(id)
      await get().fetchSampleTypes()
      showToast("样本类型删除成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "删除样本类型失败")
      showToast(message, "error")
      return false
    }
  },
}))
