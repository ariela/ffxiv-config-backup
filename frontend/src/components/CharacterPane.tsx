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
  }

  return (
    <section className="w-1/4 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800 shrink-0">
        <h2 className="text-xs uppercase font-bold text-gray-500 tracking-widest">1. 対象キャラクター選択</h2>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {characters.map((chr) => {
          const isSelected = chr.id === selectedCharId
          return (
            <div
              key={chr.id}
              onClick={() => selectCharacter(chr.id)}
              className={`p-3 rounded cursor-pointer flex items-center justify-between group transition ${
                isSelected
                  ? 'bg-blue-900/40 border border-blue-700/50'
                  : 'bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {chr.isAccount ? (
                  <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-blue-800 text-blue-200' : chr.isUnknown ? 'border border-dashed border-gray-600 text-gray-500' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {chr.isUnknown ? '?' : (chr.initials || chr.id.slice(-2))}
                  </div>
                )}
                <div>
                  {editingId === chr.id ? (
                    <input
                      className="bg-gray-900 border border-blue-500 rounded px-1 text-sm text-gray-100 w-28"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleEditSave(chr.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditSave(chr.id)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className={`text-sm font-medium ${isSelected ? 'text-blue-300 font-bold' : chr.isUnknown ? 'text-gray-400 italic' : 'text-gray-200'}`}>
                        {chr.displayName}
                      </div>
                      {!chr.isAccount && (
                        <div className="text-xs text-gray-500 font-mono">{chr.id.slice(0, 12)}...</div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!chr.isAccount && (
                <button
                  className={`text-xs transition opacity-0 group-hover:opacity-100 ${
                    chr.isUnknown ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-gray-300'
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
      <div className="p-4 border-t border-gray-800 shrink-0">
        <button
          onClick={onCreateBackup}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-2 rounded text-sm font-bold transition flex items-center justify-center gap-2"
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
