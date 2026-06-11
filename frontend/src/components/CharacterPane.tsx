// frontend/src/components/CharacterPane.tsx
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { UpdateCharacterMapping } from '../../wailsjs/go/main/App'

interface Props {
  onCreateBackup: () => void
}

export function CharacterPane({ onCreateBackup }: Props) {
  const characters = useAppStore((s) => s.characters)
  const selectedCharId = useAppStore((s) => s.selectedCharId)
  const selectCharacter = useAppStore((s) => s.selectCharacter)
  const isLoading = useAppStore((s) => s.isLoading)
  const initApp = useAppStore((s) => s.initApp)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleEditStart = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditName(currentName)
  }

  const handleEditSave = async (id: string) => {
    await UpdateCharacterMapping(id, editName)
    setEditingId(null)
    await initApp()
  }

  return (
    <section className="w-1/4 bg-umbra border-r border-arcanum flex flex-col crystal-frame animate-fade-up [animation-delay:0ms]">
      <div className="p-4 border-b border-arcanum shrink-0 relative z-10">
        <h2 className="text-xs font-display uppercase font-bold text-faint tracking-widest">1. 対象キャラクター選択</h2>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-1 relative z-10">
        {characters.map((chr) => {
          const isSelected = chr.id === selectedCharId
          return (
            <div
              key={chr.id}
              onClick={() => selectCharacter(chr.id)}
              className={`p-3 rounded cursor-pointer flex items-center justify-between group transition ${
                isSelected
                  ? 'bg-gold/10 border border-gold/50'
                  : 'bg-aether/40 hover:bg-aether border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {chr.isAccount ? (
                  <div className={`w-8 h-8 flex items-center justify-center ${isSelected ? 'text-gold' : 'text-faint'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                    isSelected
                      ? 'bg-gold/20 text-gold-bright border border-gold/60'
                      : chr.isUnknown
                        ? 'border border-dashed border-faint text-faint'
                        : 'bg-arcanum text-mist'
                  }`}>
                    {chr.isUnknown ? '?' : (chr.initials || chr.id.slice(-2))}
                  </div>
                )}
                <div className="min-w-0">
                  {editingId === chr.id ? (
                    <input
                      className="bg-abyss border border-crystal/70 rounded px-1 text-sm text-parchment w-28 outline-none"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleEditSave(chr.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditSave(chr.id)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className={`text-sm font-medium truncate ${
                        isSelected ? 'text-gold-bright font-bold' : chr.isUnknown ? 'text-faint italic' : 'text-parchment'
                      }`}>
                        {chr.displayName}
                      </div>
                      {!chr.isAccount && (
                        <div className="text-xs text-faint font-mono">{chr.id.slice(0, 12)}...</div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!chr.isAccount && (
                <button
                  className={`text-xs transition opacity-0 group-hover:opacity-100 ${
                    chr.isUnknown ? 'text-crystal hover:text-crystal-bright' : 'text-faint hover:text-mist'
                  }`}
                  onClick={(e) => handleEditStart(chr.id, chr.isUnknown ? '' : chr.displayName, e)}
                >
                  {chr.isUnknown ? '登録' : '✎'}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <div className="p-4 border-t border-arcanum shrink-0 relative z-10">
        <button
          onClick={onCreateBackup}
          disabled={isLoading}
          className="w-full bg-gold hover:bg-gold-bright disabled:opacity-40 text-abyss py-2 rounded text-sm font-bold font-display uppercase tracking-wider transition shadow-glow-gold flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          新規バックアップ作成
        </button>
      </div>
    </section>
  )
}
