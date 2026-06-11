// frontend/src/components/Header.tsx
import { useAppStore } from '../store/useAppStore'

interface Props {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: Props) {
  const nasPath = useAppStore((s) => s.nasPath)

  return (
    <header className="bg-abyss border-b border-gold-dim px-6 py-3 flex justify-between items-center shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 bg-crystal rounded-full animate-pulse-crystal" />
        <h1 className="text-base font-display font-bold tracking-[0.18em] uppercase text-gold-bright">FFXIV Backup Configurator</h1>
      </div>
      <div className="flex items-center space-x-4 text-sm">
        {nasPath && (
          <span className="text-jade flex items-center gap-1.5">
            <span>✓</span>
            <span className="font-mono text-xs truncate max-w-[240px] text-jade/80">{nasPath}</span>
          </span>
        )}
        <button
          onClick={onSettingsClick}
          className="border border-arcanum hover:border-gold/50 text-mist hover:text-parchment px-4 py-1.5 rounded text-sm transition"
        >
          設定
        </button>
      </div>
    </header>
  )
}
