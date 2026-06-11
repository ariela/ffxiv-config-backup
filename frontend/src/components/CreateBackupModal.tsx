// frontend/src/components/CreateBackupModal.tsx
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

interface Props {
  onClose: () => void
}

export function CreateBackupModal({ onClose }: Props) {
  const characters = useAppStore((s) => s.characters)
  const selectedCharId = useAppStore((s) => s.selectedCharId)
  const createBackup = useAppStore((s) => s.createBackup)
  const isLoading = useAppStore((s) => s.isLoading)

  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  const [selectedCharIDs, setSelectedCharIDs] = useState<Set<string>>(
    new Set(selectedCharId && selectedCharId !== 'ACCOUNT' ? [selectedCharId] : [])
  )
  const [includeCommon, setIncludeCommon] = useState(selectedCharId === 'ACCOUNT')

  const canCreate = name.trim() !== '' && (selectedCharIDs.size > 0 || includeCommon)

  const toggleChar = (id: string) => {
    const next = new Set(selectedCharIDs)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedCharIDs(next)
  }

  const handleCreate = async () => {
    await createBackup(name, memo, Array.from(selectedCharIDs), includeCommon)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-abyss/90 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-umbra border border-arcanum rounded-lg shadow-2xl w-[480px] overflow-hidden flex flex-col crystal-frame">
        <div className="p-4 border-b border-arcanum bg-abyss flex items-center gap-2 relative z-10">
          <div className="w-2.5 h-2.5 bg-crystal rounded-full animate-pulse-crystal" />
          <h2 className="font-display font-bold text-gold-bright tracking-wider">新規バックアップ作成</h2>
        </div>
        <div className="p-5 space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-faint uppercase tracking-wider mb-1.5">
              名称 <span className="text-garnet">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-abyss border border-arcanum rounded p-2.5 text-parchment text-sm focus:border-crystal/70 focus:shadow-glow-crystal outline-none transition"
              placeholder="パッチ8.0直前 安定版"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-faint uppercase tracking-wider mb-1.5">メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="w-full bg-abyss border border-arcanum rounded p-2.5 text-parchment text-sm focus:border-crystal/70 focus:shadow-glow-crystal outline-none resize-none transition"
              placeholder="変更前の状態を保存"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-faint uppercase tracking-wider mb-1.5">
              バックアップ対象 <span className="text-garnet">*</span>
            </label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2.5 p-2 bg-aether/40 hover:bg-aether border border-transparent rounded cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={includeCommon}
                  onChange={(e) => setIncludeCommon(e.target.checked)}
                  className="rounded text-gold border-arcanum"
                />
                <span className="text-sm text-parchment">📁 アカウント共通設定</span>
              </label>
              {characters.filter((c) => !c.isAccount).map((chr) => (
                <label
                  key={chr.id}
                  className={`flex items-center gap-2.5 p-2 rounded cursor-pointer transition ${
                    selectedCharIDs.has(chr.id)
                      ? 'bg-gold/10 border border-gold/40'
                      : 'bg-aether/40 hover:bg-aether border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCharIDs.has(chr.id)}
                    onChange={() => toggleChar(chr.id)}
                    className="rounded text-gold border-arcanum"
                  />
                  <span className={`text-sm ${selectedCharIDs.has(chr.id) ? 'text-gold-bright font-medium' : 'text-parchment'}`}>
                    {chr.displayName}
                  </span>
                  {chr.id === selectedCharId && (
                    <span className="text-xs text-faint ml-auto">現在選択中</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-arcanum bg-abyss flex justify-end gap-3 relative z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-arcanum hover:border-mist/50 text-mist hover:text-parchment rounded text-sm transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate || isLoading}
            className="px-6 py-2 bg-gold hover:bg-gold-bright disabled:opacity-40 text-abyss rounded font-bold font-display uppercase tracking-wider transition shadow-glow-gold"
          >
            {isLoading ? '作成中...' : '作成'}
          </button>
        </div>
      </div>
    </div>
  )
}
