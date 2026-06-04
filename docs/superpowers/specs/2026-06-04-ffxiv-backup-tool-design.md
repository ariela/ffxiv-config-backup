# FF14 設定バックアップツール — 実装スペック

Date: 2026-06-04

## 確定事項サマリー

| 項目 | 決定内容 |
|---|---|
| フレームワーク | Wails v2 (Go バックエンド + React + TypeScript + Tailwind CSS) |
| ターゲット OS | Windows のみ |
| 状態管理 | Zustand |
| バックアップ方式 | フルスナップショット（差分なし） |
| バックアップスコープ | 対象を選択可能（キャラ個別 / アカウント共通 / 組み合わせ自由） |
| ゲームパス検出 | 自動検出（失敗時は手動入力フォールバック） |
| バックアップ対象ファイル | キャラ別 10 種 + アカウント共通 1 種 |

---

## 1. プロジェクト構造

```
ffxiv-config-backup/
├── app.go                  # Wails App（薄いコーディネーター）
├── main.go
├── go.mod / go.sum
├── wails.json
├── internal/
│   ├── config/
│   │   ├── local.go        # local.json R/W（NASパスのみ）
│   │   └── shared.go       # shared_config.json R/W
│   ├── backup/
│   │   ├── service.go      # Create / List / Restore
│   │   ├── meta.go         # BackupMeta struct
│   │   └── snapshot.go     # ファイルコピー処理
│   ├── process/
│   │   └── check.go        # ffxiv_dx11.exe プロセス検出
│   └── gamedata/
│       └── detect.go       # ゲームデータパス自動検出
└── frontend/
    └── src/
        ├── App.tsx                 # ルート / セットアップ判定
        ├── components/
        │   ├── SetupModal.tsx      # 初期設定モーダル
        │   ├── CharacterPane.tsx   # 左ペイン
        │   ├── BackupPane.tsx      # 中ペイン
        │   ├── RestorePane.tsx     # 右ペイン
        │   ├── CreateBackupModal.tsx
        │   └── Header.tsx
        ├── store/
        │   └── useAppStore.ts      # Zustand グローバルストア
        ├── constants/
        │   └── fileMapping.ts      # 論理名 ↔ 物理ファイル名テーブル
        └── wailsjs/                # wails dev で自動生成
```

`app.go` はビジネスロジックを持たない。各 `internal/` サービスをフィールドに持ち、Wails 公開メソッドを委譲するだけ。

---

## 2. ファイルマッピング定数（fileMapping.ts）

```ts
export type FileEntry = {
  logicalName: string
  filename: string
  scope: "character" | "account"
}

export const CHARACTER_FILES: FileEntry[] = [
  { logicalName: "HUDレイアウト",             filename: "COMMON.DAT",   scope: "character" },
  { logicalName: "ホットバー / XHB",           filename: "HOTBAR.DAT",   scope: "character" },
  { logicalName: "キャラクター固有マクロ",      filename: "MACRO.DAT",    scope: "character" },
  { logicalName: "コンフィグ全般",             filename: "ADDON.DAT",    scope: "character" },
  { logicalName: "チャットログフィルター",      filename: "LOGFLTR.DAT",  scope: "character" },
  { logicalName: "ポートレート / UI設定",       filename: "UISAVE.DAT",   scope: "character" },
  { logicalName: "ギアセット",                 filename: "GS.DAT",       scope: "character" },
  { logicalName: "キーバインド",               filename: "KEYBIND.DAT",  scope: "character" },
  { logicalName: "キーボード・マウス設定",      filename: "CONTROL0.DAT", scope: "character" },
  { logicalName: "ゲームパッド設定",           filename: "CONTROL1.DAT", scope: "character" },
]

export const ACCOUNT_FILES: FileEntry[] = [
  { logicalName: "アカウント共通マクロ", filename: "MACROSYS.DAT", scope: "account" },
]
```

> **根拠:** CONTROL0.DAT はキーボード・マウス設定、CONTROL1.DAT はゲームパッド設定（xivdev/docs 確認済み）。右ペインではそれぞれ独立した行として表示する。

---

## 3. Wails 公開 API（app.go）

| 関数 | 引数 | 戻り値 | 概要 |
|---|---|---|---|
| `GetLocalConfig` | — | `(LocalConfig, error)` | NASパスを返す。未設定時は空文字 |
| `SetBackupDirectory` | `nasPath, gamePath string` | `error` | NASパス保存 + 接続確認 + shared_config.json 初期化 |
| `DetectGamePath` | — | `(string, error)` | `%DOCUMENTS%\My Games\FINAL FANTASY XIV - A Realm Reborn` を自動検出 |
| `GetSharedConfig` | — | `(SharedConfig, error)` | キャラ名マッピング・ゲームパスを返す |
| `UpdateCharacterMapping` | `charID, name string` | `error` | キャラ表示名を更新 |
| `CreateBackup` | `name, memo string, charIDs []string, includeCommon bool` | `error` | 指定対象のフルスナップショットを作成 |
| `GetBackupList` | `charID string` | `([]BackupMeta, error)` | charID を含むバックアップ一覧（降順）。`charID="ACCOUNT"` の場合は `contains_common_macro=true` のもののみ返す |
| `RestoreBackup` | `backupID, charID string, files []string, includeCommon bool` | `error` | 指定ファイルをリストア。実行前にプロセスチェック |
| `CheckGameProcess` | — | `(bool, error)` | ffxiv_dx11.exe 起動中なら true |

> `SetBackupDirectory` は spec.md 原案の `(path string)` から `(nasPath, gamePath string)` に拡張（セットアップ時にゲームパスを一緒に保存するため）。

---

## 4. Zustand ストア（useAppStore.ts）

```ts
// 状態
nasPath: string              // NASパス（空 = 未設定）
gamePath: string             // ゲームデータパス
characters: Character[]      // 左ペインリスト
selectedCharId: string | null
backups: BackupMeta[]        // 中ペインリスト
selectedBackupId: string | null
selectedFiles: Set<string>   // 右ペインチェックボックス（物理ファイル名）
isGameRunning: boolean
isLoading: boolean

// アクション
initApp()                          // 起動時: GetLocalConfig → 設定判定
selectCharacter(id: string)        // 左選択 → GetBackupList → backups 更新
selectBackup(id: string)           // 中選択 → selectedFiles を全選択で初期化
toggleFile(filename: string)       // 右チェック切り替え
createBackup(name, memo, charIDs, includeCommon)  // CreateBackup → backups 再取得
restoreBackup()                    // RestoreBackup(selectedBackupId, selectedCharId, ...)
checkGameProcess()                 // isGameRunning 更新
```

---

## 5. 起動フローと初期セットアップ

```
App 起動
  └─ GetLocalConfig()
       ├─ nasPath == "" → SetupModal 表示（強制）
       │     ├─ DetectGamePath() でゲームパスを自動入力
       │     ├─ 両フィールド入力後「設定を保存」
       │     └─ SetBackupDirectory(nasPath, gamePath) → shared_config.json 生成
       └─ nasPath あり → GetSharedConfig() → メイン画面表示
```

### SetupModal フィールド仕様

| フィールド | 必須 | 初期値 | 備考 |
|---|---|---|---|
| 共有ディレクトリパス | ✓ | 空 | 接続テストボタンあり |
| ゲームデータパス | ✓ | DetectGamePath() の結果 | 検出失敗時は空（手動入力必須） |

どちらかが空の場合は「設定を保存」ボタンを disabled にする。

---

## 6. バックアップ作成フロー（CreateBackupModal）

1. 左ペインの「新規バックアップ作成」ボタン押下
2. CreateBackupModal を表示
   - 名称（必須）、メモ（任意）
   - 対象チェックボックス（アカウント共通設定 + 検出済みキャラ一覧）
   - モーダルを開いた時点で左ペインの選択対象を自動チェック
3. 「作成」→ `CreateBackup(name, memo, charIDs, includeCommon)`
4. 成功: モーダル閉じる → `GetBackupList(selectedCharId)` で中ペイン更新
5. 失敗: トースト通知表示

### CreateBackup の内部動作

- 実行前に `ffxiv_dx11.exe` プロセスチェック（起動中はエラー返却）
- バックアップ ID: `YYYYMMDD_HHMMSS_<UUID>` 形式
- 対象: 指定 `FFXIV_CHR*` ディレクトリ内の全 10 ファイル + `includeCommon=true` の場合は `MACROSYS.DAT`
- 存在しないファイルはスキップ（エラーにしない）
- 全対象でコピーできたファイルが 0 件の場合はエラーを返す
- 失敗時のロールバックなし（中途半端なスナップショットは次回上書きで消える）

---

## 7. 3ペイン選択連鎖フロー

```
左ペイン（キャラ選択）
  → selectCharacter(id)  // アカウント共通選択時は id = "ACCOUNT"
  → GetBackupList(id) → backups 更新
  → selectedBackupId = null

中ペイン（バックアップ選択）
  → selectBackup(id)
  → selectedFiles = 全ファイル（全選択で初期化）

右ペイン（リストア対象選択）
  → toggleFile(filename) で個別チェック
  → 「選択項目を復元」
  → checkGameProcess() → isGameRunning=true なら disabled
  → RestoreBackup(selectedBackupId, selectedCharId, [...files], includeCommon)
```

---

## 8. エラーハンドリング方針

### Go バックエンド
- 各サービスメソッドは `(T, error)` を返す
- `app.go` は error をラップせずそのまま Wails に返す
- ユーザー向けメッセージは日本語で error に含める
  - 例: `errors.New("FF14が起動中です。終了後に実行してください。")`

### React フロントエンド
- Wails バインディングの Promise を `try/catch` で捕捉
- エラーはトースト通知（右下固定、Tailwind + useState 実装、外部ライブラリ不要）で表示
- 処理中は `isLoading: true` で全ボタンを disabled
- SetupModal 内のエラーはモーダル内インラインで表示

---

## 9. プロセスチェック仕様

- チェックタイミング: アプリ起動時・「選択項目を復元」押下時・「新規バックアップ作成」実行時
- ポーリングは行わない（都度確認方式）
- `isGameRunning=true` の場合: 復元ボタンを disabled にし、赤いドット + 警告テキストを表示（uimock.html 準拠）

---

## 10. データ構造（変更なし・spec.md より転記）

### local.json（%APPDATA%/FF14SyncTool/local.json）
```json
{ "backup_target_directory": "\\\\NAS\\Shared\\FF14_Backups" }
```

### shared_config.json（\<NASパス\>/shared_config.json）
```json
{
  "game_data_path": "C:\\Users\\...\\My Games\\FINAL FANTASY XIV - A Realm Reborn",
  "character_mappings": {
    "FFXIV_CHR001": "Alice (Main)",
    "FFXIV_CHR002": "Bob (Sub)"
  }
}
```

### meta.json（バックアップディレクトリ内）
```json
{
  "backup_id": "20260604_120000_UUID",
  "created_at": "2026-06-04T12:00:00Z",
  "name": "パッチ7.0直前バックアップ",
  "memo": "HUDレイアウト大幅変更前。念のため保存。",
  "contains_common_macro": true,
  "characters": ["FFXIV_CHR001", "FFXIV_CHR002"]
}
```

---

## 参照

- `docs/spec.md` — アーキテクチャ設計書（前提検証・データ構造・API原案）
- `docs/uimock.html` — UIモックアップ
