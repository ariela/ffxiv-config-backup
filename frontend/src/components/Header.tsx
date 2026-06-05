// frontend/src/components/Header.tsx
import { useAppStore } from '../store/useAppStore'

interface Props {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: Props) {
  const nasPath = useAppStore((s) => s.nasPath)

  return (
    <header className="bg-gray-950 border-b border-gray-800 px-6 py-3 flex justify-between items-center shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
        <h1 className="text-lg font-bold tracking-wider text-gray-100">FFXIV Backup Configurator</h1>
      </div>
      <div className="flex items-center space-x-4 text-sm">
        {nasPath && (
          <span className="text-green-400 flex items-center gap-1">
            <span>✓</span>
            <span className="font-mono text-xs truncate max-w-[240px]">{nasPath}</span>
          </span>
        )}
        <button
          onClick={onSettingsClick}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-1.5 rounded text-sm transition"
        >
          設定
        </button>
      </div>
    </header>
  )
}
