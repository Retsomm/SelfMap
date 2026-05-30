import { useEffect, useRef } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    containerRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="bg-(--paper) border border-(--ink) rounded-sm px-8 py-7 max-w-sm w-full mx-4 shadow-xl outline-none"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="font-mono text-base tracking-widest uppercase text-(--ink) mb-3">
          {title}
        </h2>
        <p className="text-sm text-(--ink-soft) mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-mono tracking-widest uppercase text-(--ink-soft) hover:text-(--ink) border border-(--ink) transition-colors duration-120 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-mono tracking-widest uppercase text-(--paper) bg-(--crimson) hover:opacity-80 border border-(--crimson) transition-opacity duration-120 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
