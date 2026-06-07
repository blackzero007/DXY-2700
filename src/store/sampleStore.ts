import { create } from "zustand"
import type { Sample, Transition, Tag, SampleStats, SampleAttachment, ArchivedSample } from "@/types"
import { SampleStatus, AttachmentType } from "@/types"
import * as api from "@/api/samples"
import { ApiError } from "@/api/samples"
import { useToastStore } from "@/store/toastStore"

interface SampleStore {
  samples: Sample[]
  archivedSamples: ArchivedSample[]
  currentSample: (Sample & { transitions: Transition[]; tags: Tag[]; attachments: SampleAttachment[] }) | null
  searchQuery: string
  selectedTagId: number | null
  selectedStatus: string | null
  selectedSampleType: string | null
  loading: boolean
  archivedLoading: boolean
  exporting: boolean
  stats: SampleStats | null
  statsLoading: boolean
  _detailFetchId: number
  fetchSamples: (batchId?: number, tagId?: number, status?: string, sampleType?: string) => Promise<void>
  searchSamples: (query: string, batchId?: number, tagId?: number, status?: string, sampleType?: string) => Promise<void>
  refreshSamples: () => Promise<void>
  createSample: (data: {
    code: string
    name: string
    type: string
    source: string
    batch_id?: number | null
  }) => Promise<{ success: boolean; data?: Sample; error?: string }>
  updateSampleStatus: (id: number, status: SampleStatus, operator?: string, note?: string) => Promise<boolean>
  updateSampleBatch: (id: number, batchId: number | null) => Promise<boolean>
  deleteSample: (id: number) => Promise<boolean>
  fetchSampleDetail: (id: number) => Promise<boolean>
  addTransition: (id: number, data: { node_name: string; operator: string; note: string }) => Promise<boolean>
  addTagToSample: (sampleId: number, tagId: number) => Promise<boolean>
  removeTagFromSample: (sampleId: number, tagId: number) => Promise<boolean>
  addAttachment: (sampleId: number, data: { name: string; type: AttachmentType; note?: string }) => Promise<boolean>
  updateAttachment: (sampleId: number, attachmentId: number, data: { name?: string; type?: AttachmentType; note?: string }) => Promise<boolean>
  deleteAttachment: (sampleId: number, attachmentId: number) => Promise<boolean>
  exportSamples: (batchId?: number) => Promise<boolean>
  setSearchQuery: (query: string) => void
  setSelectedTagId: (tagId: number | null) => void
  setSelectedStatus: (status: string | null) => void
  setSelectedSampleType: (sampleType: string | null) => void
  clearFilters: () => Promise<void>
  clearAllFilters: () => Promise<void>
  fetchSampleStats: () => Promise<void>
  fetchArchivedSamples: (search?: string) => Promise<void>
  searchArchivedSamples: (query: string) => Promise<void>
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
  archivedSamples: [],
  currentSample: null,
  searchQuery: "",
  selectedTagId: null,
  selectedStatus: null,
  selectedSampleType: null,
  loading: false,
  archivedLoading: false,
  exporting: false,
  stats: null,
  statsLoading: false,
  _detailFetchId: 0,

  fetchSamples: async (batchId, tagId, status, sampleType) => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const samples = await api.fetchSamples(undefined, batchId, tagId, status, sampleType)
      set({ samples })
    } catch (error) {
      const message = handleError(error, "加载样本列表失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  searchSamples: async (query, batchId, tagId, status, sampleType) => {
    const showToast = useToastStore.getState().showToast
    set({ searchQuery: query, loading: true })
    try {
      const samples = await api.fetchSamples(query, batchId, tagId, status, sampleType)
      set({ samples })
    } catch (error) {
      const message = handleError(error, "搜索样本失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  refreshSamples: async () => {
    const showToast = useToastStore.getState().showToast
    const state = get()
    set({ loading: true })
    try {
      const samples = await api.fetchSamples(
        state.searchQuery,
        undefined,
        state.selectedTagId,
        state.selectedStatus,
        state.selectedSampleType
      )
      set({ samples })
    } catch (error) {
      const message = handleError(error, "刷新样本列表失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  createSample: async (data) => {
    const showToast = useToastStore.getState().showToast
    try {
      const sample = await api.createSample(data)
      await get().refreshSamples()
      showToast("样本登记成功", "success")
      return { success: true, data: sample }
    } catch (error) {
      const message = handleError(error, "样本登记失败")
      showToast(message, "error")
      return { success: false, error: message }
    }
  },

  updateSampleStatus: async (id, status, operator, note) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.updateSample(id, { status, operator, note })
      await get().refreshSamples()
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
      await get().refreshSamples()
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
      await get().refreshSamples()
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
    const requestId = get()._detailFetchId + 1
    set({ _detailFetchId: requestId, loading: true })
    try {
      const currentSample = await api.fetchSampleById(id)
      if (get()._detailFetchId !== requestId) {
        return false
      }
      set({ currentSample })
      return true
    } catch (error) {
      const message = handleError(error, "加载样本详情失败")
      showToast(message, "error")
      return false
    } finally {
      if (get()._detailFetchId === requestId) {
        set({ loading: false })
      }
    }
  },

  addTransition: async (id, data) => {
    const showToast = useToastStore.getState().showToast
    try {
      const newTransition = await api.addTransition(id, data)
      const currentSample = get().currentSample
      if (currentSample && currentSample.id === id) {
        const updatedTransitions = [newTransition, ...currentSample.transitions]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        set({
          currentSample: {
            ...currentSample,
            transitions: updatedTransitions,
            updated_at: new Date().toISOString(),
          },
        })
      }
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

  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),

  setSelectedStatus: (status) => set({ selectedStatus: status }),

  setSelectedSampleType: (sampleType) => set({ selectedSampleType: sampleType }),

  clearFilters: async () => {
    set({
      selectedTagId: null,
      selectedStatus: null,
      selectedSampleType: null,
    })
    await get().refreshSamples()
  },

  clearAllFilters: async () => {
    set({
      searchQuery: "",
      selectedTagId: null,
      selectedStatus: null,
      selectedSampleType: null,
    })
    await get().refreshSamples()
  },

  addTagToSample: async (sampleId, tagId) => {
    const showToast = useToastStore.getState().showToast
    try {
      const tags = await api.addTagToSample(sampleId, tagId)
      const currentSample = get().currentSample
      if (currentSample && currentSample.id === sampleId) {
        set({ currentSample: { ...currentSample, tags } })
      }
      await get().refreshSamples()
      showToast("标签添加成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "添加标签失败")
      showToast(message, "error")
      return false
    }
  },

  removeTagFromSample: async (sampleId, tagId) => {
    const showToast = useToastStore.getState().showToast
    try {
      const tags = await api.removeTagFromSample(sampleId, tagId)
      const currentSample = get().currentSample
      if (currentSample && currentSample.id === sampleId) {
        set({ currentSample: { ...currentSample, tags } })
      }
      await get().refreshSamples()
      showToast("标签移除成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "移除标签失败")
      showToast(message, "error")
      return false
    }
  },

  addAttachment: async (sampleId, data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.createSampleAttachment(sampleId, data)
      const currentSample = get().currentSample
      if (currentSample && currentSample.id === sampleId) {
        const attachments = await api.fetchSampleAttachments(sampleId)
        set({ currentSample: { ...currentSample, attachments } })
      }
      showToast("附件添加成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "添加附件失败")
      showToast(message, "error")
      return false
    }
  },

  updateAttachment: async (sampleId, attachmentId, data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.updateSampleAttachment(sampleId, attachmentId, data)
      const currentSample = get().currentSample
      if (currentSample && currentSample.id === sampleId) {
        const attachments = await api.fetchSampleAttachments(sampleId)
        set({ currentSample: { ...currentSample, attachments } })
      }
      showToast("附件更新成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "更新附件失败")
      showToast(message, "error")
      return false
    }
  },

  deleteAttachment: async (sampleId, attachmentId) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.deleteSampleAttachment(sampleId, attachmentId)
      const currentSample = get().currentSample
      if (currentSample && currentSample.id === sampleId) {
        const attachments = await api.fetchSampleAttachments(sampleId)
        set({ currentSample: { ...currentSample, attachments } })
      }
      showToast("附件删除成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "删除附件失败")
      showToast(message, "error")
      return false
    }
  },

  exportSamples: async (batchId) => {
    const showToast = useToastStore.getState().showToast
    set({ exporting: true })
    try {
      await api.exportSamples(
        get().searchQuery,
        batchId,
        get().selectedTagId,
        get().selectedStatus,
        get().selectedSampleType
      )
      showToast("导出成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "导出失败")
      showToast(message, "error")
      return false
    } finally {
      set({ exporting: false })
    }
  },

  fetchSampleStats: async () => {
    const showToast = useToastStore.getState().showToast
    set({ statsLoading: true })
    try {
      const stats = await api.fetchSampleStats()
      set({ stats })
    } catch (error) {
      const message = handleError(error, "加载统计数据失败")
      showToast(message, "error")
    } finally {
      set({ statsLoading: false })
    }
  },

  fetchArchivedSamples: async (search) => {
    const showToast = useToastStore.getState().showToast
    set({ archivedLoading: true })
    try {
      const archivedSamples = await api.fetchArchivedSamples(search)
      set({ archivedSamples })
    } catch (error) {
      const message = handleError(error, "加载归档样本列表失败")
      showToast(message, "error")
    } finally {
      set({ archivedLoading: false })
    }
  },

  searchArchivedSamples: async (query) => {
    const showToast = useToastStore.getState().showToast
    set({ archivedLoading: true })
    try {
      const archivedSamples = await api.fetchArchivedSamples(query)
      set({ archivedSamples })
    } catch (error) {
      const message = handleError(error, "搜索归档样本失败")
      showToast(message, "error")
    } finally {
      set({ archivedLoading: false })
    }
  },
}))
