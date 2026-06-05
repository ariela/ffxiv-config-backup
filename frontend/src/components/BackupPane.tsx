// frontend/src/components/BackupPane.tsx
import { useAppStore } from '../store/useAppStore'
import { CHARACTER_FILES } from '../constants/fileMapping'

export function BackupPane() {
  const characters = useAppStore((s) => s.characters)
  const selectedCharId = useAppStore((s) => s.selectedCharId)
  const backups = useAppStore((s) => s.backups)
  const selectedBackupId = useAppStore((s) => s.selectedBackupId)
  const selectBackup = useAppStore((s) => s.selectBackup)
  const toggleAllFiles = useAppStore((s) => s.toggleAllFiles)

  const selectedChar = characters.find((c) => c.id === selectedCharId)
  const filenames = CHARACTER_FILES.map((f) => f.filename)

  const handleSelect = (id: string) => {
    selectBackup(id)
    toggleAllFiles(filenames)
  }

  if (!selectedCharId) {
    return (
      <section className="w-1/3 bg-gray-900 border-r border-gray-800 flex items-center justify-center">
        <p className="text-gray-600 text-sm">キャラクターを選択してください</p>
      </section>
    )
  }

  return (
    <section className="w-1/3 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800 shrink-0 flex justify-between items-end">
        <h2 className="text-xs uppercase font-bold text-gray-500 tracking-widest">2. 復元元バックアップ選択</h2>
        <span className="text-xs text-blue-400">{selectedChar?.displayName}</span>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {backups.length === 0 && (
          <p className="text-gray-600 text-sm p-3">バックアップがありません</p>
        )}
        {backups.map((backup) => {
          const isSelected = backup.backup_id === selectedBackupId
          const date = new Date(backup.created_at).toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
          })
          return (
            <div
              key={backup.backup_id}
              onClick={() => handleSelect(backup.backup_id)}
              className={`p-3 rounded cursor-pointer transition ${
                isSelected
                  ? 'bg-blue-900/30 border-l-4 border-blue-500'
                  : 'bg-gray-800/40 hover:bg-gray-800 border-l-4 border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className={`text-sm font-medium ${isSelected ? 'text-gray-100 font-bold' : 'text-gray-300'}`}>
                  {backup.name}
                </div>
                <div className="text-xs text-gray-500 font-mono ml-2 shrink-0">{date}</div>
              </div>
              {backup.memo && (
                <p className="text-xs text-gray-500 line-clamp-2">{backup.memo}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
