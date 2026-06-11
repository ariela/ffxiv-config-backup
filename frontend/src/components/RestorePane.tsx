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
      <section className="flex-1 bg-umbra flex items-center justify-center animate-fade-up [animation-delay:240ms]">
        <p className="text-faint text-sm">バックアップを選択してください</p>
      </section>
    )
  }

  return (
    <section className="flex-1 bg-umbra flex flex-col relative animate-fade-up [animation-delay:240ms]">
      <div className="p-4 border-b border-arcanum shrink-0 flex justify-between items-center">
        <h2 className="text-xs font-display uppercase font-bold text-faint tracking-widest">3. リストア対象項目選択</h2>
        <label className="flex items-center space-x-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => toggleAllFiles(filenames)}
            className="rounded bg-umbra border-arcanum text-gold focus:ring-gold/30"
          />
          <span className="text-mist hover:text-parchment transition">すべて選択</span>
        </label>
      </div>

      <div className="overflow-y-auto flex-1 p-4 grid grid-cols-2 gap-3 content-start pb-24">
        {selectedBackup?.contains_common_macro && !isAccount && (
          <div className="col-span-2 bg-amber/10 border border-amber/40 p-3 rounded flex items-start">
            <span className="text-amber mr-2">ℹ</span>
            <p className="text-xs text-amber/80">このバックアップには「アカウント共通マクロ」が含まれています。</p>
          </div>
        )}
        {fileEntries.map((entry) => (
          <label
            key={entry.filename}
            className={`flex items-center p-3 border rounded cursor-pointer transition ${
              selectedFiles.has(entry.filename)
                ? 'bg-crystal/10 border-crystal/40'
                : 'bg-aether/40 border-arcanum hover:bg-aether hover:border-arcanum/80'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedFiles.has(entry.filename)}
              onChange={() => toggleFile(entry.filename)}
              className="rounded bg-umbra border-arcanum text-crystal focus:ring-crystal/30"
            />
            <div className="ml-3">
              <div className="text-sm font-bold text-parchment">{entry.logicalName}</div>
              <div className="text-xs text-faint font-mono mt-0.5">{entry.filename}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-abyss/90 backdrop-blur-sm border-t border-arcanum p-4 flex justify-between items-center shadow-[0_-10px_30px_rgba(7,10,20,0.8)]">
        <div className="flex items-center text-sm">
          {isGameRunning ? (
            <>
              <span className="w-3 h-3 bg-garnet rounded-full mr-2 animate-pulse-garnet" />
              <span className="text-garnet font-bold">FF14クライアントが起動中のため復元できません</span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 bg-jade rounded-full mr-2 shadow-glow-jade" />
              <span className="text-mist">安全に復元可能です</span>
            </>
          )}
        </div>
        <button
          onClick={handleRestore}
          disabled={isGameRunning || isLoading || selectedFiles.size === 0}
          className="px-8 py-2 bg-gold hover:bg-gold-bright disabled:opacity-40 disabled:cursor-not-allowed text-abyss rounded font-bold font-display uppercase tracking-wider transition shadow-glow-gold"
        >
          {isLoading ? '処理中...' : '選択項目を復元'}
        </button>
      </div>
    </section>
  )
}
