# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**FF14 設定同期・バックアップツール** — FINAL FANTASY XIV の設定ファイルを NAS 等の共有ディレクトリへバックアップ・リストアするデスクトップアプリ。

- **フレームワーク**: [Wails](https://wails.io/) (Go バックエンド + React/Vue/Svelte フロントエンド)
- **Go バージョン**: 1.26 (`mise` で管理)
- **フロントエンドスタイル**: Tailwind CSS

## コマンド

プロジェクトはまだ初期セットアップ段階。Wails プロジェクト生成後は以下が標準コマンドになる:

```bash
# 開発サーバー起動（ホットリロード付き）
wails dev

# プロダクションビルド
wails build

# Go テスト
go test ./...

# 単一テスト
go test ./... -run TestName
```

## アーキテクチャ

### 設定ファイルの二層構造

Chicken-and-Egg 問題を避けるため、設定を強制分離する:

| 層 | パス | 内容 |
|---|---|---|
| ローカル設定 | `%APPDATA%/FF14SyncTool/local.json` | NAS パスのみ |
| 共有設定 | `<NASパス>/shared_config.json` | ゲームデータパス、キャラ紐付け |

ローカル設定が存在しない場合（初回起動）は初期セットアップ画面を強制表示する。

### バックアップデータ構造

```
<Backup_Directory_Path>/
├── shared_config.json
└── backups/
    └── 20260604_120000_UUID/
        ├── meta.json          # バックアップメタデータ
        ├── MACROSYS.dat       # アカウント共通マクロ
        └── FFXIV_CHR001/     # キャラ別データ
```

バックアップ方式はフルスナップショット（差分不採用）。FF14 の設定ファイルは全キャラ合わせても数十 MB 程度のため容量問題は無視できる。

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

**重要**: `RestoreBackup` および `CreateBackup` の実行前に、必ず `ffxiv_dx11.exe` プロセスの起動チェックを行う。FF14 起動中の上書きはデータ破損リスクがある。

### フロントエンド UI（3 ペイン構造）

左 → 中 → 右の依存関係フロー:

- **左ペイン**: キャラクター選択（FFXIV_CHR\* + アカウント共通マクロ行）
- **中ペイン**: 選択キャラのバックアップ履歴一覧
- **右ペイン**: 選択バックアップの復元対象選択（論理名表示、チェックボックス）

リストアは物理ファイル名（`COMMON.DAT` 等）をユーザーに意識させず、論理名（「HUD レイアウト」「マクロ」等）でフロントエンド内のマッピングテーブルを通じて解決する。

## 設計上の決定事項

詳細な設計根拠・検討経緯は `docs/spec.md`、UI モックアップは `docs/uimock.html` を参照。
