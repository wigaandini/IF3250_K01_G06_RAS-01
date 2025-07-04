"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { CheckIcon, AlertCircleIcon } from "lucide-react"
import { useToastStore } from "@/lib/toast-store"

export default function ToastContainer() {
  const { toast, hideToast } = useToastStore()
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof document !== "undefined") {
      setPortalElement(document.body)
    }
  }, [])

  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => hideToast(), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast, hideToast])

  if (!toast?.visible || !portalElement) return null

  return createPortal(
    <div className="fixed top-4 left-0 right-0 z-[9999] flex items-center justify-center px-4">
      <div
        className={`relative flex items-center p-4 rounded-lg shadow-lg max-w-xs sm:max-w-md ${
          toast.type === "success"
            ? "bg-green-600 text-white"
            : "bg-red-600 text-white"
        }`}
      >
        <div className="mr-2">
          {toast.type === "success" ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <AlertCircleIcon className="w-5 h-5" />
          )}
        </div>
        <span className="text-sm font-medium">{toast.message}</span>
        {/* Tombol close dihapus */}
      </div>
    </div>,
    portalElement
  )
}
