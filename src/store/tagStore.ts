import { create } from "zustand"
import type { Tag } from "@/types"
import * as api from "@/api/tags"
import { TagApiError } from "@/api/tags"
import { useToastStore } from "@/store/toastStore"

interface TagStore {
  tags: Tag[]
  loading: boolean
  fetchTags: () => Promise<void>
  createTag: (data: { name: string; color?: string; description?: string }) => Promise<boolean>
  updateTag: (id: number, data: { name?: string; color?: string; description?: string }) => Promise<boolean>
  deleteTag: (id: number) => Promise<boolean>
}

function handleError(error: unknown, defaultMessage: string): string {
  if (error instanceof TagApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return defaultMessage
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  loading: false,

  fetchTags: async () => {
    const showToast = useToastStore.getState().showToast
    set({ loading: true })
    try {
      const tags = await api.fetchTags()
      set({ tags })
    } catch (error) {
      const message = handleError(error, "加载标签列表失败")
      showToast(message, "error")
    } finally {
      set({ loading: false })
    }
  },

  createTag: async (data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.createTag(data)
      await get().fetchTags()
      showToast("标签创建成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "创建标签失败")
      showToast(message, "error")
      return false
    }
  },

  updateTag: async (id, data) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.updateTag(id, data)
      await get().fetchTags()
      showToast("标签更新成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "更新标签失败")
      showToast(message, "error")
      return false
    }
  },

  deleteTag: async (id) => {
    const showToast = useToastStore.getState().showToast
    try {
      await api.deleteTag(id)
      await get().fetchTags()
      showToast("标签删除成功", "success")
      return true
    } catch (error) {
      const message = handleError(error, "删除标签失败")
      showToast(message, "error")
      return false
    }
  },
}))
