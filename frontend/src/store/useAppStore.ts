// frontend/src/store/useAppStore.ts
import { create } from 'zustand'
import {
  GetLocalConfig as goGetLocalConfig,
  GetCharacters as goGetCharacters,
  GetBackupList as goGetBackupList,
  CreateBackup as goCreateBackup,
  RestoreBackup as goRestoreBackup,
  CheckGameProcess as goCheckGameProcess,
} from '../../wailsjs/go/main/App'

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
      const cfg = await goGetLocalConfig()
      set({ nasPath: cfg.backup_target_directory ?? '' })
      if (cfg.backup_target_directory) {
        const chars = await goGetCharacters()
        set({ characters: chars })
      }
    } catch (e: unknown) {
      set({ error: String(e) })
    }
  },

  selectCharacter: async (id: string) => {
    set({ selectedCharId: id, selectedBackupId: null, selectedFiles: new Set(), backups: [] })
    try {
      const backups = await goGetBackupList(id)
      set({ backups: backups ?? [] })
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
      await goCreateBackup(name, memo, charIDs, includeCommon)
      const { selectedCharId } = get()
      if (selectedCharId) {
        const backups = await goGetBackupList(selectedCharId)
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
      await goRestoreBackup(selectedBackupId, charID, Array.from(selectedFiles), includeCommon)
    } catch (e: unknown) {
      set({ error: String(e) })
    } finally {
      set({ isLoading: false })
    }
  },

  checkGameProcess: async () => {
    try {
      const running = await goCheckGameProcess()
      set({ isGameRunning: running })
    } catch {
      set({ isGameRunning: false })
    }
  },

  clearError: () => set({ error: null }),
}))
