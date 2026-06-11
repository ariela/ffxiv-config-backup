# FF14 設定同期・バックアップツール

FINAL FANTASY XIV の設定ファイルを NAS 等の共有ディレクトリへバックアップ・リストアするデスクトップアプリケーション。

パッチ更新前のバックアップや、複数 PC 間での設定同期を想定している。リストアは物理ファイル名（`COMMON.DAT` 等）ではなく「HUD レイアウト」「マクロ」といった論理名で選択でき、内部のマッピングテーブルで解決する。

> **対象プラットフォーム**: Windows（FF14 クライアントおよび `%APPDATA%` / `ffxiv_dx11.exe` に依存）。リリースビルドは `windows/amd64` を配布する。

## 特徴

- **フルスナップショット方式** — バックアップごとに対象ファイルを独立コピー。リストアが確実で、破損の影響が局所化される。
- **設定の二層分離** — バックアップ先パスをローカルに、ゲームデータパス・キャラ紐付けを共有側に保持し、Chicken-and-Egg 問題を回避。
- **起動中の上書き保護** — バックアップ/リストア前に `ffxiv_dx11.exe` の起動を検査し、実行中はデータ破損を防ぐためブロックする。
- **論理名ベースのリストア UI** — ユーザーに物理ファイル名を意識させない 3 ペイン構造。

## 技術スタック

| 領域 | 採用技術 |
|---|---|
| フレームワーク | [Wails v2](https://wails.io/) (v2.12.0) |
| バックエンド | Go 1.26 |
| フロントエンド | React 18 + TypeScript |
| 状態管理 | Zustand |
| スタイル | Tailwind CSS |
| ビルド/テスト | Vite 5 + Vitest 2 |
| ツール管理 | [mise](https://mise.jdx.dev/) |

## 必要環境

`.mise.toml` で以下を管理している。`mise install` で一括導入できる。

- Go 1.26
- Node.js 22
- Wails CLI v2.12.0
- golangci-lint

## セットアップ

```bash
# ツールチェーンの導入（mise 使用時）
mise install

# フロントエンド依存のインストール
cd frontend && npm install
```

## コマンド

```bash
# 開発サーバー起動（ホットリロード付き）
wails dev

# プロダクションビルド
wails build

# Go テスト
go test ./...

# Go 単一テスト
go test ./... -run TestName

# フロントエンドテスト
cd frontend && npm test
```

## アーキテクチャ

### 設定の二層構造

| 層 | パス | 内容 |
|---|---|---|
| ローカル設定 | `%APPDATA%/FF14SyncTool/local.json` | バックアップ先（NAS）パスのみ |
| 共有設定 | `<NASパス>/shared_config.json` | ゲームデータパス、キャラ紐付け |

ローカル設定が存在しない初回起動時は、初期セットアップ画面を強制表示する。

### バックアップデータ構造

```
<Backup_Directory_Path>/
├── shared_config.json
└── backups/
    └── 20260604_120000_UUID/
        ├── meta.json          # バックアップメタデータ（名称・メモ）
        ├── MACROSYS.dat       # アカウント共通マクロ
        └── FFXIV_CHR001/      # キャラ別データ（COMMON.DAT 等）
```

### Go バックエンド API（Wails 公開関数）

| 関数 | 概要 |
|---|---|
| `GetLocalConfig()` | NAS パスを返す。未設定時は空文字 |
| `SetBackupDirectory(path)` | NAS パスを保存し、接続確認と共有ディレクトリ初期化 |
| `GetSharedConfig()` | 共有設定（キャラ紐付け等）を返す |
| `UpdateCharacterMapping(charID, name)` | キャラ名称の紐付けを更新 |
| `CreateBackup(name, memo)` | フルスナップショットバックアップを作成 |
| `GetBackupList(charID)` | バックアップ一覧を降順で取得 |
| `RestoreBackup(backupID, charID, files, includeCommon)` | 指定ファイルをリストア |

### ディレクトリ構成

```
.
├── app.go            # Wails アプリ本体・公開 API
├── main.go           # エントリポイント
├── internal/
│   ├── config/       # ローカル/共有設定の読み書き
│   ├── gamedata/     # ゲームデータパス・キャラ検出
│   ├── backup/       # スナップショット作成・リストア
│   └── process/      # ffxiv_dx11.exe 起動チェック
└── frontend/         # React + TypeScript UI
```

詳細な設計根拠・検討経緯は [`docs/spec.md`](docs/spec.md)、UI モックアップは [`docs/uimock.html`](docs/uimock.html) を参照。
