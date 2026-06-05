// frontend/src/components/RestorePane.tsx
import { useAppStore } from '../store/useAppStore'
import { CHARACTER_FILES, ACCOUNT_FILES } from '../constants/fileMapping'

export function RestorePane() {
  const selectedCharId = useAppStore((s) => s.selectedCharId)
  const selectedBackupId = useAppStore((s) => s.selectedBackupId)
  const backups = useAppStore((s) => s.backups)
  const selectedFiles = useAppStore((s) => s.selectedFiles)
  const toggleFile = useAppStore((s) => s.toggleFile)
  const toggleAllFiles = useAppStore((s) => s.toggleAllFiles)
  const isGameRunning = useAppStore((s) => s.isGameRunning)
  const isLoading = useAppStore((s) => s.isLoading)
  const checkGameProcess = useAppStore((s) => s.checkGameProcess)
  const restoreBackup = useAppStore((s) => s.restoreBackup)

  const selectedBackup = backups.find((b) => b.backup_id === selectedBackupId)
  const isAccount = selectedCharId === 'ACCOUNT'
  const fileEntries = isAccount ? ACCOUNT_FILES : CHARACTER_FILES
  const filenames = fileEntries.map((f) => f.filename)
  const allSelected = filenames.every((f) => selectedFiles.has(f))

  const handleRestore = async () => {
    await checkGameProcess()
    if (useAppStore.getState().isGameRunning) return
    await restoreBackup(selectedCharId!, selectedBackup?.contains_common_macro ?? false)
  }

  if (!selectedBackupId) {
    return (
      <section className="flex-1 bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 text-sm">バックアップを選択してください</p>
      </section>
    )
  }

  return (
    <section className="flex-1 bg-gray-900 flex flex-col relative">
      <div className="p-4 border-b border-gray-800 shrink-0 flex justify-between items-center">
        <h2 className="text-xs uppercase font-bold text-gray-500 tracking-widest">3. リストア対象項目選択</h2>
        <label className="flex items-center space-x-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => toggleAllFiles(filenames)}
            className="rounded bg-gray-800 border-gray-600 text-blue-500"
          />
          <span className="text-gray-400 hover:text-gray-200">すべて選択</span>
        </label>
      </div>

      <div className="overflow-y-auto flex-1 p-4 grid grid-cols-2 gap-3 content-start pb-24">
        {selectedBackup?.contains_common_macro && !isAccount && (
          <div className="col-span-2 bg-yellow-900/20 border border-yellow-700/50 p-3 rounded flex items-start">
            <span className="text-yellow-500 mr-2">ℹ</span>
            <p className="text-xs text-yellow-200/80">このバックアップには「アカウント共通マクロ」が含まれています。</p>
          </div>
        )}
        {fileEntries.map((entry) => (
          <label
            key={entry.filename}
            className="flex items-center p-3 border border-gray-700 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer transition"
          >
            <input
              type="checkbox"
              checked={selectedFiles.has(entry.filename)}
              onChange={() => toggleFile(entry.filename)}
              className="rounded bg-gray-900 border-gray-600 text-blue-500"
            />
            <div className="ml-3">
              <div className="text-sm font-bold text-gray-100">{entry.logicalName}</div>
              <div className="text-xs text-gray-500 font-mono mt-0.5">{entry.filename}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center text-sm">
          {isGameRunning ? (
            <>
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse" />
              <span className="text-red-400 font-bold">FF14クライアントが起動中のため復元できません</span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <span className="text-gray-400">安全に復元可能です</span>
            </>
          )}
        </div>
        <button
          onClick={handleRestore}
          disabled={isGameRunning || isLoading || selectedFiles.size === 0}
          className="px-8 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded font-bold transition"
        >
          {isLoading ? '処理中...' : '選択項目を復元'}
        </button>
      </div>
    </section>
  )
}
