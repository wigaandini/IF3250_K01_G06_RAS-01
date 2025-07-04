import { create } from "zustand"

type ToastType = "success" | "error"

export interface ToastState {
  visible: boolean
  message: string
  type: ToastType
}

interface ToastStore {
  toast: ToastState | null
  showToast: (message: string, type: ToastType) => void
  hideToast: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  showToast: (message, type) =>
    set({ toast: { visible: true, message, type } }),
  hideToast: () => set({ toast: null }),
}))
