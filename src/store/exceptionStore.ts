import { create } from "zustand"
import type { SampleExceptionWithSample, ExceptionType, ExceptionStatus } from "@/types"
import * as api from "@/api/exceptions"
import { ApiError } from "@/api/exceptions"
import { useToastStore } from "@/store/toastStore"

interface ExceptionStore {
  exceptions: SampleExceptionWithSample[]
  currentException: SampleExceptionWithSample | null
  loading: boolean
  filterType: ExceptionType | null
  filterStatus: ExceptionStatus | null
  fetchExceptions: (sampleId?: number) => Promise<void>
  fetchExceptionDetail: (id: number) => Promise<boolean>
  createException: (data: {
    sample_id: number
    type: ExceptionType
    title: string
    description: string
    reporter: string
  }) => Promise<boolean>
  updateException: (id: number, data: {
    type?: ExceptionType
    title?: string
    description?: string
    status?: ExceptionStatus
    handler?: string | null
    resolution?: string | null
  }) => Promise<boolean>
  deleteException: (id: number) => Promise<boolean>
  setFilterType: (type: ExceptionType | null) => void
  setFilterStatus: (status: ExceptionStatus | null) => void
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

export const useExceptionStore = create<ExceptionStore>((set, get) => ({
  exceptions: [],
  currentException: null,
  loading: false,
  filterType: null,
  filterStatus: null,

  fetchExceptions: async (sampleId) => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const { filterType, filterStatus } = get()
      const useFilters = sampleId === undefined
      const exceptions = await api.fetchExceptions({
        sample_id: sampleId,
        type: useFilters ? filterType ?? undefined : undefined,
        status: useFilters ? filterStatus ?? undefined : undefined,
      })
      set({ exceptions })
    } catch (error) {
      const message = handleError(error, "加载异常列表失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  fetchExceptionDetail: async (id) => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const exception = await api.fetchExceptionById(id)
      set({ currentException: exception })
      return true
    } catch (error) {
      const message = handleError(error, "加载异常详情失败")
      showToast(message, "error")
      return false
    } finally {
      set({ loading: false })
    }
  },

  createException: async (data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.createException(data)
      await get().fetchExceptions()
      showToast("异常登记成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "异常登记失败")
      showToast(message, "error")
      return false
    }
  },

  updateException: async (id, data) => {
    const showToast = useToastStore.getState().showToast
    try {
      const updated = await api.updateException(id, data)
      set({ currentException: updated })
      await get().fetchExceptions()
      showToast("异常更新成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "异常更新失败")
      showToast(message, "error")
      return false
    }
  },

  deleteException: async (id) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.deleteException(id)
      await get().fetchExceptions()
      showToast("异常记录删除成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "删除异常记录失败")
      showToast(message, "error")
      return false
    }
  },

  setFilterType: (type) => set({ filterType: type }),

  setFilterStatus: (status) => set({ filterStatus: status }),
}))
