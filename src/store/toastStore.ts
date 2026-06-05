import { create } from "zustand"

export type ToastType = "success" | "error" | "info"

export interface ToastItem {
  id: number
  message: string
  type: ToastType
  duration: number
}

interface ToastStore {
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: number) => void
}

let toastIdCounter = 0

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  showToast: (message, type = "info", duration = 3000) => {
    const id = ++toastIdCounter
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
