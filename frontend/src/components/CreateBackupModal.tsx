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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[480px] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
          <h2 className="font-bold text-gray-100">新規バックアップ作成</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded p-2.5 text-gray-200 text-sm focus:border-blue-500 outline-none"
              placeholder="パッチ8.0直前 安定版"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="w-full bg-gray-950 border border-gray-700 rounded p-2.5 text-gray-200 text-sm focus:border-blue-500 outline-none resize-none"
              placeholder="変更前の状態を保存"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              バックアップ対象 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2.5 p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-750 transition">
                <input
                  type="checkbox"
                  checked={includeCommon}
                  onChange={(e) => setIncludeCommon(e.target.checked)}
                  className="rounded text-blue-500"
                />
                <span className="text-sm text-gray-300">📁 アカウント共通設定</span>
              </label>
              {characters.filter((c) => !c.isAccount).map((chr) => (
                <label
                  key={chr.id}
                  className={`flex items-center gap-2.5 p-2 rounded cursor-pointer transition ${
                    selectedCharIDs.has(chr.id) ? 'bg-blue-900/30 border border-blue-700/40' : 'bg-gray-800 hover:bg-gray-750'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCharIDs.has(chr.id)}
                    onChange={() => toggleChar(chr.id)}
                    className="rounded text-blue-500"
                  />
                  <span className={`text-sm ${selectedCharIDs.has(chr.id) ? 'text-blue-300 font-medium' : 'text-gray-300'}`}>
                    {chr.displayName}
                  </span>
                  {chr.id === selectedCharId && (
                    <span className="text-xs text-gray-500 ml-auto">現在選択中</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 text-sm transition">
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate || isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded font-bold transition"
          >
            {isLoading ? '作成中...' : '作成'}
          </button>
        </div>
      </div>
    </div>
  )
}
