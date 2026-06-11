// frontend/src/components/Toast.tsx
import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function Toast() {
  const error = useAppStore((s) => s.error)
  const clearError = useAppStore((s) => s.clearError)

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(clearError, 5000)
    return () => clearTimeout(timer)
  }, [error, clearError])

  if (!error) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-abyss border border-garnet/70 text-parchment rounded-lg shadow-glow-garnet p-4 flex items-start gap-3">
      <span className="text-garnet shrink-0 mt-0.5">✕</span>
      <div>
        <p className="font-bold text-sm text-garnet">エラー</p>
        <p className="text-sm mt-1 text-mist">{error}</p>
      </div>
      <button onClick={clearError} className="ml-auto text-faint hover:text-garnet shrink-0 transition">✕</button>
    </div>
  )
}
