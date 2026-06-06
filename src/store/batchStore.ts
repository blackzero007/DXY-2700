import { create } from "zustand"
import type { BatchWithStats, Sample } from "@/types"
import * as api from "@/api/batches"
import { ApiError } from "@/api/batches"
import { useToastStore } from "@/store/toastStore"

interface BatchStore {
  batches: BatchWithStats[]
  currentBatch: BatchWithStats | null
  batchSamples: Sample[]
  searchQuery: string
  loading: boolean
  fetchBatches: () => Promise<void>
  searchBatches: (query: string) => Promise<void>
  createBatch: (data: {
    code: string
    name: string
    type: string
    description?: string
  }) => Promise<boolean>
  updateBatch: (
    id: number,
    data: { name?: string; type?: string; description?: string }
  ) => Promise<boolean>
  deleteBatch: (id: number) => Promise<boolean>
  fetchBatchDetail: (id: number) => Promise<boolean>
  fetchBatchSamples: (id: number) => Promise<boolean>
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

export const useBatchStore = create<BatchStore>((set, get) => ({
  batches: [],
  currentBatch: null,
  batchSamples: [],
  searchQuery: "",
  loading: false,

  fetchBatches: async () => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const batches = await api.fetchBatches()
      set({ batches })
    } catch (error) {
      const message = handleError(error, "加载批次列表失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  searchBatches: async (query) => {
    const showToast = useToastStore.getState().showToast
    set({ searchQuery: query, loading: true })
    try {
      const batches = await api.fetchBatches(query)
      set({ batches })
    } catch (error) {
      const message = handleError(error, "搜索批次失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  createBatch: async (data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.createBatch(data)
      await get().fetchBatches()
      showToast("批次创建成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "批次创建失败")
      showToast(message, "error")
      return false
    }
  },

  updateBatch: async (id, data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.updateBatch(id, data)
      await get().fetchBatches()
      showToast("批次更新成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "批次更新失败")
      showToast(message, "error")
      return false
    }
  },

  deleteBatch: async (id) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.deleteBatch(id)
      await get().fetchBatches()
      showToast("批次删除成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "批次删除失败")
      showToast(message, "error")
      return false
    }
  },

  fetchBatchDetail: async (id) => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const batch = await api.fetchBatchById(id)
      set({ currentBatch: batch })
      return true
    } catch (error) {
      const message = handleError(error, "加载批次详情失败")
      showToast(message, "error")
      return false
    } finally {
      set({ loading: false })
    }
  },

  fetchBatchSamples: async (id) => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const samples = await api.fetchBatchSamples(id)
      set({ batchSamples: samples })
      return true
    } catch (error) {
      const message = handleError(error, "加载批次样本失败")
      showToast(message, "error")
      return false
    } finally {
      set({ loading: false })
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}))
