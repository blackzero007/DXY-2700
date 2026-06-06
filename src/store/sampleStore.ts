import { create } from "zustand"
import type { Sample, Transition } from "@/types"
import { SampleStatus } from "@/types"
import * as api from "@/api/samples"
import { ApiError } from "@/api/samples"
import { useToastStore } from "@/store/toastStore"

interface SampleStore {
  samples: Sample[]
  currentSample: (Sample & { transitions: Transition[] }) | null
  searchQuery: string
  loading: boolean
  fetchSamples: (batchId?: number) => Promise<void>
  searchSamples: (query: string, batchId?: number) => Promise<void>
  createSample: (data: {
    code: string
    name: string
    type: string
    source: string
    batch_id?: number | null
  }) => Promise<boolean>
  updateSampleStatus: (id: number, status: SampleStatus) => Promise<boolean>
  updateSampleBatch: (id: number, batchId: number | null) => Promise<boolean>
  deleteSample: (id: number) => Promise<boolean>
  fetchSampleDetail: (id: number) => Promise<boolean>
  addTransition: (id: number, data: { node_name: string; operator: string; note: string }) => Promise<boolean>
  setSearchQuery: (query: string) => void
}

function handleError(error: unknown, defaultMessage: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return defaultMessage
}

export const useSampleStore = create<SampleStore>((set, get) => ({
  samples: [],
  currentSample: null,
  searchQuery: "",
  loading: false,

  fetchSamples: async (batchId) => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const samples = await api.fetchSamples(undefined, batchId)
      set({ samples })
    } catch (error) {
      const message = handleError(error, "加载样本列表失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  searchSamples: async (query, batchId) => {
    const showToast = useToastStore.getState().showToast
    set({ searchQuery: query, loading: true })
    try {
      const samples = await api.fetchSamples(query, batchId)
      set({ samples })
    } catch (error) {
      const message = handleError(error, "搜索样本失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  createSample: async (data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.createSample(data)
      await get().fetchSamples()
      showToast("样本登记成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "样本登记失败")
      showToast(message, "error")
      return false
    }
  },

  updateSampleStatus: async (id, status) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.updateSample(id, { status })
      await get().fetchSamples()
      showToast("状态更新成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "状态更新失败")
      showToast(message, "error")
      return false
    }
  },

  updateSampleBatch: async (id, batchId) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.updateSampleBatch(id, batchId)
      await get().fetchSamples()
      showToast("批次更新成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "批次更新失败")
      showToast(message, "error")
      return false
    }
  },

  deleteSample: async (id) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.deleteSample(id)
      await get().fetchSamples()
      showToast("样本删除成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "删除样本失败")
      showToast(message, "error")
      return false
    }
  },

  fetchSampleDetail: async (id) => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const currentSample = await api.fetchSampleById(id)
      set({ currentSample })
      return true
    } catch (error) {
      const message = handleError(error, "加载样本详情失败")
      showToast(message, "error")
      return false
    } finally {
      set({ loading: false })
    }
  },

  addTransition: async (id, data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.addTransition(id, data)
      await get().fetchSampleDetail(id)
      showToast("流转记录添加成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "添加流转记录失败")
      showToast(message, "error")
      return false
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}))
