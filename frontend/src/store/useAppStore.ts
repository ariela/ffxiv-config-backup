// frontend/src/store/useAppStore.ts
import { create } from 'zustand'

// Wails バインディング未生成のため、型をインライン定義
// wails dev 実行後に wailsjs/models.ts の型と統合する
export type BackupMeta = {
  backup_id: string
  created_at: string
  name: string
  memo: string
  contains_common_macro: boolean
  characters: string[]
}

export type Character = {
  id: string
  displayName: string
  initials: string
  isAccount: boolean
  isUnknown: boolean
}

export type LocalConfig = {
  backup_target_directory: string
}

// Go 関数のプレースホルダー（wails dev 後に wailsjs/go/main/App から import する）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wailsCall = async <T>(fn: () => Promise<T>): Promise<T> => fn()

// バインディングが生成されるまでの仮実装
const goGetLocalConfig = (): Promise<LocalConfig> =>
  Promise.resolve({ backup_target_directory: '' })
const goGetCharacters = (): Promise<Character[]> => Promise.resolve([])
const goGetBackupList = (_charID: string): Promise<BackupMeta[]> => Promise.resolve([])
const goCreateBackup = (
  _name: string,
  _memo: string,
  _charIDs: string[],
  _includeCommon: boolean
): Promise<void> => Promise.resolve()
const goRestoreBackup = (
  _backupID: string,
  _charID: string,
  _files: string[],
  _includeCommon: boolean
): Promise<void> => Promise.resolve()
const goCheckGameProcess = (): Promise<boolean> => Promise.resolve(false)

interface AppState {
  nasPath: string
  characters: Character[]
  selectedCharId: string | null
  backups: BackupMeta[]
  selectedBackupId: string | null
  selectedFiles: Set<string>
  isGameRunning: boolean
  isLoading: boolean
  error: string | null
}

interface AppActions {
  initApp: () => Promise<void>
  selectCharacter: (id: string) => Promise<void>
  selectBackup: (id: string) => void
  toggleFile: (filename: string) => void
  toggleAllFiles: (filenames: string[]) => void
  createBackup: (name: string, memo: string, charIDs: string[], includeCommon: boolean) => Promise<void>
  restoreBackup: (charID: string, includeCommon: boolean) => Promise<void>
  checkGameProcess: () => Promise<void>
  clearError: () => void
}

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  nasPath: '',
  characters: [],
  selectedCharId: null,
  backups: [],
  selectedBackupId: null,
  selectedFiles: new Set(),
  isGameRunning: false,
  isLoading: false,
  error: null,

  initApp: async () => {
    try {
      const cfg = await wailsCall(goGetLocalConfig)
      set({ nasPath: cfg.backup_target_directory ?? '' })
      if (cfg.backup_target_directory) {
        const chars = await wailsCall(goGetCharacters)
        set({ characters: chars })
      }
    } catch (e: unknown) {
      set({ error: String(e) })
    }
  },

  selectCharacter: async (id: string) => {
    set({ selectedCharId: id, selectedBackupId: null, selectedFiles: new Set(), backups: [] })
    try {
      const backups = await wailsCall(() => goGetBackupList(id))
      set({ backups })
    } catch (e: unknown) {
      set({ error: String(e) })
    }
  },

  selectBackup: (id: string) => {
    set({ selectedBackupId: id, selectedFiles: new Set() })
  },

  toggleFile: (filename: string) => {
    const files = new Set(get().selectedFiles)
    if (files.has(filename)) {
      files.delete(filename)
    } else {
      files.add(filename)
    }
    set({ selectedFiles: files })
  },

  toggleAllFiles: (filenames: string[]) => {
    const current = get().selectedFiles
    const allSelected = filenames.every((f) => current.has(f))
    if (allSelected) {
      set({ selectedFiles: new Set() })
    } else {
      set({ selectedFiles: new Set(filenames) })
    }
  },

  createBackup: async (name, memo, charIDs, includeCommon) => {
    set({ isLoading: true, error: null })
    try {
      await wailsCall(() => goCreateBackup(name, memo, charIDs, includeCommon))
      const { selectedCharId } = get()
      if (selectedCharId) {
        const backups = await wailsCall(() => goGetBackupList(selectedCharId))
        set({ backups })
      }
    } catch (e: unknown) {
      set({ error: String(e) })
    } finally {
      set({ isLoading: false })
    }
  },

  restoreBackup: async (charID: string, includeCommon: boolean) => {
    const { selectedBackupId, selectedFiles } = get()
    if (!selectedBackupId) return
    set({ isLoading: true, error: null })
    try {
      await wailsCall(() =>
        goRestoreBackup(selectedBackupId, charID, Array.from(selectedFiles), includeCommon)
      )
    } catch (e: unknown) {
      set({ error: String(e) })
    } finally {
      set({ isLoading: false })
    }
  },

  checkGameProcess: async () => {
    try {
      const running = await wailsCall(goCheckGameProcess)
      set({ isGameRunning: running })
    } catch {
      set({ isGameRunning: false })
    }
  },

  clearError: () => set({ error: null }),
}))
