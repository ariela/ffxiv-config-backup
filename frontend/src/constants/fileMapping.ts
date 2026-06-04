// frontend/src/constants/fileMapping.ts
export type FileEntry = {
  logicalName: string
  filename: string
  scope: 'character' | 'account'
}

export const CHARACTER_FILES: FileEntry[] = [
  { logicalName: 'HUDレイアウト',          filename: 'COMMON.DAT',   scope: 'character' },
  { logicalName: 'ホットバー / XHB',        filename: 'HOTBAR.DAT',   scope: 'character' },
  { logicalName: 'キャラクター固有マクロ',   filename: 'MACRO.DAT',    scope: 'character' },
  { logicalName: 'コンフィグ全般',          filename: 'ADDON.DAT',    scope: 'character' },
  { logicalName: 'チャットログフィルター',   filename: 'LOGFLTR.DAT',  scope: 'character' },
  { logicalName: 'ポートレート / UI設定',   filename: 'UISAVE.DAT',   scope: 'character' },
  { logicalName: 'ギアセット',             filename: 'GS.DAT',       scope: 'character' },
  { logicalName: 'キーバインド',            filename: 'KEYBIND.DAT',  scope: 'character' },
  { logicalName: 'キーボード・マウス設定',   filename: 'CONTROL0.DAT', scope: 'character' },
  { logicalName: 'ゲームパッド設定',        filename: 'CONTROL1.DAT', scope: 'character' },
]

export const ACCOUNT_FILES: FileEntry[] = [
  { logicalName: 'アカウント共通マクロ', filename: 'MACROSYS.DAT', scope: 'account' },
]

export const ALL_CHARACTER_FILENAMES = CHARACTER_FILES.map((f) => f.filename)
