# FF14 設定バックアップツール 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wails v2 + Go + React + TypeScript を使い、FF14 設定ファイルを NAS へバックアップ・リストアするデスクトップアプリを構築する（Windows 専用）。

**Architecture:** Go バックエンドを `internal/` 以下の 4 パッケージ（config / backup / process / gamedata）に分割し、`app.go` が薄い委譲層として Wails に公開する。フロントエンドは Zustand ストアで 3 ペイン状態を一元管理する。

**Tech Stack:** Go 1.26, Wails v2 (latest), React 18, TypeScript, Tailwind CSS v3, Zustand, Vitest + Testing Library

---

## スペック補完メモ

- **`GetCharacters()` を追加**: spec.md に記載なしだが左ペインのキャラ一覧取得に必須。`gamedata` パッケージで実装。
- **センチネル値**: 「アカウント共通設定」行は `charID = "ACCOUNT"` で統一。
- Go テストは `t.TempDir()` でファイルシステムを隔離する。

---

## ファイルマップ

### Go バックエンド
| パス | 責務 |
|---|---|
| `main.go` | Wails エントリーポイント |
| `app.go` | Wails 公開メソッド（委譲のみ） |
| `internal/config/types.go` | LocalConfig / SharedConfig 型定義 |
| `internal/config/local.go` | local.json R/W |
| `internal/config/shared.go` | shared_config.json R/W |
| `internal/backup/types.go` | BackupMeta / Character 型定義 |
| `internal/backup/snapshot.go` | ファイルコピー処理 |
| `internal/backup/service.go` | CreateBackup / GetBackupList / RestoreBackup |
| `internal/process/check.go` | ffxiv_dx11.exe 検出 |
| `internal/gamedata/detect.go` | ゲームパス自動検出 |
| `internal/gamedata/characters.go` | FFXIV_CHR* スキャン + キャラ一覧構築 |

### React フロントエンド
| パス | 責務 |
|---|---|
| `frontend/src/constants/fileMapping.ts` | 論理名 ↔ 物理ファイル名テーブル |
| `frontend/src/store/useAppStore.ts` | Zustand グローバルストア |
| `frontend/src/components/Toast.tsx` | エラートースト通知 |
| `frontend/src/components/SetupModal.tsx` | 初期設定モーダル |
| `frontend/src/components/Header.tsx` | ヘッダー |
| `frontend/src/components/CharacterPane.tsx` | 左ペイン |
| `frontend/src/components/BackupPane.tsx` | 中ペイン |
| `frontend/src/components/RestorePane.tsx` | 右ペイン |
| `frontend/src/components/CreateBackupModal.tsx` | バックアップ作成モーダル |
| `frontend/src/App.tsx` | ルート / セットアップ判定 / レイアウト |

---

## Task 1: Wails v2 プロジェクト初期化

**Files:**
- Create: `main.go`
- Create: `go.mod`
- Create: `wails.json`
- Create: `frontend/` (React + TypeScript テンプレート)

- [ ] **Step 1: Wails CLI をインストール**

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
wails version
```

Expected: バージョン文字列が表示される（例: `Wails CLI v2.x.x`）

- [ ] **Step 2: 一時ディレクトリで初期化し、プロジェクトへコピー**

```bash
cd /tmp
wails init -n ffxiv-tmp -t react-ts
# ドキュメントを上書きしないよう選択的にコピー
cp /tmp/ffxiv-tmp/go.mod /Users/yuki/Projects/ffxiv-config-backup/
cp /tmp/ffxiv-tmp/go.sum /Users/yuki/Projects/ffxiv-config-backup/ 2>/dev/null || true
cp /tmp/ffxiv-tmp/wails.json /Users/yuki/Projects/ffxiv-config-backup/
cp -r /tmp/ffxiv-tmp/frontend /Users/yuki/Projects/ffxiv-config-backup/
cp /tmp/ffxiv-tmp/main.go /Users/yuki/Projects/ffxiv-config-backup/
cp /tmp/ffxiv-tmp/app.go /Users/yuki/Projects/ffxiv-config-backup/
rm -rf /tmp/ffxiv-tmp
```

- [ ] **Step 3: go.mod のモジュール名を確認・修正**

`go.mod` の1行目が以下になっていることを確認（違う場合は修正）:

```
module ffxiv-config-backup
```

- [ ] **Step 4: 動作確認**

```bash
cd /Users/yuki/Projects/ffxiv-config-backup
wails dev
```

Expected: ブラウザ or Wails ウィンドウが開き、デフォルトの「Hello World」画面が表示される

- [ ] **Step 5: コミット**

```bash
git add main.go app.go go.mod go.sum wails.json frontend/
git commit -m "feat: initialize Wails v2 project scaffold"
```

---

## Task 2: Tailwind CSS + Vitest セットアップ

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Modify: `frontend/src/style.css` または `index.css`

- [ ] **Step 1: 依存インストール**

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
npx tailwindcss init -p
```

- [ ] **Step 2: tailwind.config.js を設定**

```js
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 3: CSS に Tailwind ディレクティブを追加**

`frontend/src/style.css`（または既存の CSS ファイル）の先頭に追加:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: vite.config.ts に Vitest 設定を追加**

```ts
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 5: テストセットアップファイルを作成**

```ts
// frontend/src/test/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: package.json にテストスクリプトを追加**

`scripts` に以下を追加:

```json
"test": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 7: Tailwind が効いているか確認**

`frontend/src/App.tsx` の適当な要素に `className="text-blue-500"` を付け、`wails dev` でスタイルが適用されるか確認。

- [ ] **Step 8: コミット**

```bash
git add frontend/
git commit -m "feat: add Tailwind CSS and Vitest setup"
```

---

## Task 3: Go 型定義

**Files:**
- Create: `internal/config/types.go`
- Create: `internal/backup/types.go`

- [ ] **Step 1: config 型を作成**

```go
// internal/config/types.go
package config

type LocalConfig struct {
	BackupTargetDirectory string `json:"backup_target_directory"`
}

type SharedConfig struct {
	GameDataPath      string            `json:"game_data_path"`
	CharacterMappings map[string]string `json:"character_mappings"`
}
```

- [ ] **Step 2: backup 型を作成**

```go
// internal/backup/types.go
package backup

import "time"

type BackupMeta struct {
	BackupID            string    `json:"backup_id"`
	CreatedAt           time.Time `json:"created_at"`
	Name                string    `json:"name"`
	Memo                string    `json:"memo"`
	ContainsCommonMacro bool      `json:"contains_common_macro"`
	Characters          []string  `json:"characters"`
}

type Character struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
	IsAccount   bool   `json:"isAccount"`
	IsUnknown   bool   `json:"isUnknown"`
}
```

- [ ] **Step 3: コンパイル確認**

```bash
go build ./...
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add internal/
git commit -m "feat: add Go type definitions"
```

---

## Task 4: LocalService TDD

**Files:**
- Create: `internal/config/local.go`
- Create: `internal/config/local_test.go`

- [ ] **Step 1: テストを書く**

```go
// internal/config/local_test.go
package config

import (
	"path/filepath"
	"testing"
)

func TestLocalService_GetConfig_NoFile(t *testing.T) {
	dir := t.TempDir()
	svc := NewLocalService(dir)

	cfg, err := svc.GetConfig()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if cfg.BackupTargetDirectory != "" {
		t.Errorf("expected empty path, got %q", cfg.BackupTargetDirectory)
	}
}

func TestLocalService_SetAndGet(t *testing.T) {
	dir := t.TempDir()
	svc := NewLocalService(dir)

	err := svc.SetConfig(LocalConfig{BackupTargetDirectory: `\\NAS\Shared`})
	if err != nil {
		t.Fatalf("SetConfig error: %v", err)
	}

	cfg, err := svc.GetConfig()
	if err != nil {
		t.Fatalf("GetConfig error: %v", err)
	}
	if cfg.BackupTargetDirectory != `\\NAS\Shared` {
		t.Errorf("got %q, want %q", cfg.BackupTargetDirectory, `\\NAS\Shared`)
	}
}

func TestLocalService_TestPath_InvalidDir(t *testing.T) {
	svc := NewLocalService(t.TempDir())
	err := svc.TestPath(`C:\does\not\exist\xyz123`)
	if err == nil {
		t.Error("expected error for non-existent path")
	}
}

func TestLocalService_TestPath_ValidDir(t *testing.T) {
	dir := t.TempDir()
	nasDir := filepath.Join(dir, "nas")
	// nasDir を作成
	if err := mkdirAll(nasDir); err != nil {
		t.Fatal(err)
	}
	svc := NewLocalService(dir)
	if err := svc.TestPath(nasDir); err != nil {
		t.Errorf("expected no error for valid dir, got %v", err)
	}
}
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
go test ./internal/config/... -run TestLocalService -v
```

Expected: FAIL（`NewLocalService` 未定義）

- [ ] **Step 3: LocalService を実装**

```go
// internal/config/local.go
package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

type LocalService struct {
	configDir string
}

func NewLocalService(configDir string) *LocalService {
	return &LocalService{configDir: configDir}
}

// DefaultLocalService は %APPDATA%/FF14SyncTool を使う
func DefaultLocalService() *LocalService {
	appData := os.Getenv("APPDATA")
	if appData == "" {
		appData, _ = os.UserHomeDir()
	}
	return NewLocalService(filepath.Join(appData, "FF14SyncTool"))
}

func (s *LocalService) configPath() string {
	return filepath.Join(s.configDir, "local.json")
}

func (s *LocalService) GetConfig() (LocalConfig, error) {
	data, err := os.ReadFile(s.configPath())
	if errors.Is(err, os.ErrNotExist) {
		return LocalConfig{}, nil
	}
	if err != nil {
		return LocalConfig{}, err
	}
	var cfg LocalConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return LocalConfig{}, err
	}
	return cfg, nil
}

func (s *LocalService) SetConfig(cfg LocalConfig) error {
	if err := os.MkdirAll(s.configDir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.configPath(), data, 0644)
}

func (s *LocalService) TestPath(path string) error {
	testFile := filepath.Join(path, ".ff14sync_test")
	if err := os.WriteFile(testFile, []byte("ok"), 0644); err != nil {
		return errors.New("バックアップ先ディレクトリへの書き込みができません: " + err.Error())
	}
	return os.Remove(testFile)
}

// mkdirAll は os.MkdirAll のヘルパー（テスト用）
func mkdirAll(path string) error {
	return os.MkdirAll(path, 0755)
}
```

- [ ] **Step 4: テスト実行**

```bash
go test ./internal/config/... -run TestLocalService -v
```

Expected: すべて PASS

- [ ] **Step 5: コミット**

```bash
git add internal/config/
git commit -m "feat: add LocalService with local.json R/W and path test"
```

---

## Task 5: SharedService TDD

**Files:**
- Create: `internal/config/shared.go`
- Create: `internal/config/shared_test.go`

- [ ] **Step 1: テストを書く**

```go
// internal/config/shared_test.go
package config

import (
	"testing"
)

func TestSharedService_GetConfig_InitializesEmpty(t *testing.T) {
	dir := t.TempDir()
	svc := NewSharedService(dir)

	cfg, err := svc.GetConfig()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.GameDataPath != "" {
		t.Errorf("expected empty GameDataPath, got %q", cfg.GameDataPath)
	}
	if cfg.CharacterMappings == nil {
		t.Error("CharacterMappings should be initialized (not nil)")
	}
}

func TestSharedService_SetGameDataPath(t *testing.T) {
	dir := t.TempDir()
	svc := NewSharedService(dir)

	if err := svc.SetGameDataPath(`C:\Games\FFXIV`); err != nil {
		t.Fatalf("SetGameDataPath error: %v", err)
	}

	cfg, err := svc.GetConfig()
	if err != nil {
		t.Fatalf("GetConfig error: %v", err)
	}
	if cfg.GameDataPath != `C:\Games\FFXIV` {
		t.Errorf("got %q", cfg.GameDataPath)
	}
}

func TestSharedService_UpdateCharacterMapping(t *testing.T) {
	dir := t.TempDir()
	svc := NewSharedService(dir)

	if err := svc.UpdateCharacterMapping("FFXIV_CHR001", "Alice"); err != nil {
		t.Fatalf("UpdateCharacterMapping error: %v", err)
	}

	cfg, err := svc.GetConfig()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.CharacterMappings["FFXIV_CHR001"] != "Alice" {
		t.Errorf("expected Alice, got %q", cfg.CharacterMappings["FFXIV_CHR001"])
	}
}
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
go test ./internal/config/... -run TestSharedService -v
```

Expected: FAIL

- [ ] **Step 3: SharedService を実装**

```go
// internal/config/shared.go
package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

type SharedService struct {
	nasDir string
}

func NewSharedService(nasDir string) *SharedService {
	return &SharedService{nasDir: nasDir}
}

func (s *SharedService) configPath() string {
	return filepath.Join(s.nasDir, "shared_config.json")
}

func (s *SharedService) GetConfig() (SharedConfig, error) {
	data, err := os.ReadFile(s.configPath())
	if errors.Is(err, os.ErrNotExist) {
		return SharedConfig{CharacterMappings: map[string]string{}}, nil
	}
	if err != nil {
		return SharedConfig{}, err
	}
	var cfg SharedConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return SharedConfig{}, err
	}
	if cfg.CharacterMappings == nil {
		cfg.CharacterMappings = map[string]string{}
	}
	return cfg, nil
}

func (s *SharedService) save(cfg SharedConfig) error {
	if err := os.MkdirAll(s.nasDir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.configPath(), data, 0644)
}

func (s *SharedService) SetGameDataPath(path string) error {
	cfg, err := s.GetConfig()
	if err != nil {
		return err
	}
	cfg.GameDataPath = path
	return s.save(cfg)
}

func (s *SharedService) UpdateCharacterMapping(charID, name string) error {
	cfg, err := s.GetConfig()
	if err != nil {
		return err
	}
	cfg.CharacterMappings[charID] = name
	return s.save(cfg)
}
```

- [ ] **Step 4: テスト実行**

```bash
go test ./internal/config/... -v
```

Expected: すべて PASS

- [ ] **Step 5: コミット**

```bash
git add internal/config/shared.go internal/config/shared_test.go
git commit -m "feat: add SharedService with shared_config.json R/W"
```

---

## Task 6: DetectGamePath TDD

**Files:**
- Create: `internal/gamedata/detect.go`
- Create: `internal/gamedata/detect_test.go`

- [ ] **Step 1: テストを書く**

```go
// internal/gamedata/detect_test.go
package gamedata

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDetectGamePathIn_Found(t *testing.T) {
	docs := t.TempDir()
	ffxivDir := filepath.Join(docs, "My Games", "FINAL FANTASY XIV - A Realm Reborn")
	if err := os.MkdirAll(ffxivDir, 0755); err != nil {
		t.Fatal(err)
	}

	got, err := detectGamePathIn(docs)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != ffxivDir {
		t.Errorf("got %q, want %q", got, ffxivDir)
	}
}

func TestDetectGamePathIn_NotFound(t *testing.T) {
	docs := t.TempDir()
	_, err := detectGamePathIn(docs)
	if err == nil {
		t.Error("expected error when FFXIV dir not found")
	}
}
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
go test ./internal/gamedata/... -run TestDetectGamePath -v
```

Expected: FAIL

- [ ] **Step 3: 実装**

```go
// internal/gamedata/detect.go
package gamedata

import (
	"errors"
	"os"
	"path/filepath"
)

const ffxivSubPath = `My Games\FINAL FANTASY XIV - A Realm Reborn`

// DetectGamePath は %USERPROFILE%\Documents 以下の FFXIV フォルダを自動検出する。
// 見つからない場合は空文字とエラーを返す。
func DetectGamePath() (string, error) {
	profile := os.Getenv("USERPROFILE")
	if profile == "" {
		return "", errors.New("USERPROFILE 環境変数が設定されていません")
	}
	docs := filepath.Join(profile, "Documents")
	return detectGamePathIn(docs)
}

func detectGamePathIn(docsDir string) (string, error) {
	candidate := filepath.Join(docsDir, ffxivSubPath)
	if _, err := os.Stat(candidate); err == nil {
		return candidate, nil
	}
	return "", errors.New("FINAL FANTASY XIV のデータフォルダが見つかりませんでした。手動で入力してください。")
}
```

- [ ] **Step 4: テスト実行**

```bash
go test ./internal/gamedata/... -run TestDetectGamePath -v
```

Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add internal/gamedata/detect.go internal/gamedata/detect_test.go
git commit -m "feat: add game path auto-detection"
```

---

## Task 7: CheckGameProcess TDD

**Files:**
- Create: `internal/process/check.go`
- Create: `internal/process/check_test.go`

- [ ] **Step 1: テストを書く**

```go
// internal/process/check_test.go
package process

import "testing"

func TestIsProcessRunning_NotRunning(t *testing.T) {
	running, err := IsProcessRunning("this_app_does_not_exist_xyz.exe")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if running {
		t.Error("expected false for non-existent process")
	}
}
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
go test ./internal/process/... -v
```

Expected: FAIL

- [ ] **Step 3: 実装**

```go
// internal/process/check.go
package process

import (
	"bytes"
	"os/exec"
	"strings"
)

const ffxivProcessName = "ffxiv_dx11.exe"

// CheckFFXIV は ffxiv_dx11.exe が起動中かどうかを返す。
func CheckFFXIV() (bool, error) {
	return IsProcessRunning(ffxivProcessName)
}

// IsProcessRunning は指定プロセス名が起動中かどうかを Windows の tasklist で確認する。
func IsProcessRunning(name string) (bool, error) {
	out, err := exec.Command("tasklist", "/FI", "IMAGENAME eq "+name, "/NH").Output()
	if err != nil {
		// tasklist が見つからない環境（テスト環境等）は false を返す
		if _, ok := err.(*exec.Error); ok {
			return false, nil
		}
		return false, err
	}
	return bytes.Contains(out, []byte(strings.ToLower(name))) ||
		bytes.Contains(out, []byte(name)), nil
}
```

- [ ] **Step 4: テスト実行**

```bash
go test ./internal/process/... -v
```

Expected: PASS（tasklist が存在しない macOS/Linux 環境でも false を返し PASS）

- [ ] **Step 5: コミット**

```bash
git add internal/process/
git commit -m "feat: add FFXIV process detection"
```

---

## Task 8: GetCharacters TDD

**Files:**
- Create: `internal/gamedata/characters.go`
- Create: `internal/gamedata/characters_test.go`

- [ ] **Step 1: テストを書く**

```go
// internal/gamedata/characters_test.go
package gamedata

import (
	"os"
	"path/filepath"
	"testing"

	"ffxiv-config-backup/internal/backup"
)

func TestGetCharacters_ScansAndMerges(t *testing.T) {
	gameDir := t.TempDir()
	// キャラクターディレクトリを作成
	os.MkdirAll(filepath.Join(gameDir, "FFXIV_CHR001"), 0755)
	os.MkdirAll(filepath.Join(gameDir, "FFXIV_CHR002"), 0755)

	mappings := map[string]string{
		"FFXIV_CHR001": "Alice",
	}

	chars, err := GetCharacters(gameDir, mappings)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// ACCOUNT が先頭
	if chars[0].ID != "ACCOUNT" {
		t.Errorf("first entry should be ACCOUNT, got %q", chars[0].ID)
	}
	if !chars[0].IsAccount {
		t.Error("ACCOUNT entry should have IsAccount=true")
	}

	// CHR001 は名前あり
	chr001 := findChar(chars, "FFXIV_CHR001")
	if chr001 == nil {
		t.Fatal("FFXIV_CHR001 not found")
	}
	if chr001.DisplayName != "Alice" {
		t.Errorf("expected Alice, got %q", chr001.DisplayName)
	}
	if chr001.IsUnknown {
		t.Error("CHR001 should not be unknown")
	}

	// CHR002 は未登録
	chr002 := findChar(chars, "FFXIV_CHR002")
	if chr002 == nil {
		t.Fatal("FFXIV_CHR002 not found")
	}
	if !chr002.IsUnknown {
		t.Error("CHR002 should be unknown")
	}
}

func findChar(chars []backup.Character, id string) *backup.Character {
	for i := range chars {
		if chars[i].ID == id {
			return &chars[i]
		}
	}
	return nil
}
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
go test ./internal/gamedata/... -run TestGetCharacters -v
```

Expected: FAIL

- [ ] **Step 3: 実装**

```go
// internal/gamedata/characters.go
package gamedata

import (
	"os"
	"path/filepath"
	"strings"

	"ffxiv-config-backup/internal/backup"
)

// GetCharacters はゲームデータパスをスキャンし、ACCOUNT エントリ + キャラ一覧を返す。
func GetCharacters(gameDataPath string, mappings map[string]string) ([]backup.Character, error) {
	result := []backup.Character{
		{
			ID:          "ACCOUNT",
			DisplayName: "アカウント共通設定",
			IsAccount:   true,
		},
	}

	entries, err := os.ReadDir(gameDataPath)
	if err != nil {
		return result, nil // ゲームパスが存在しない場合は ACCOUNT のみ返す
	}

	for _, e := range entries {
		if !e.IsDir() || !strings.HasPrefix(e.Name(), "FFXIV_CHR") {
			continue
		}
		id := e.Name()
		displayName, known := mappings[id]
		chr := backup.Character{
			ID:        id,
			IsAccount: false,
			IsUnknown: !known,
		}
		if known {
			chr.DisplayName = displayName
		} else {
			chr.DisplayName = "未登録 (" + id + ")"
		}
		result = append(result, chr)
	}

	return result, nil
}
```

- [ ] **Step 4: `backup.Character` に `Initials` フィールドを追加（UI 用）**

`internal/backup/types.go` の `Character` 構造体に追加:

```go
type Character struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
	Initials    string `json:"initials"`   // アバター表示用（例: "AL"）
	IsAccount   bool   `json:"isAccount"`
	IsUnknown   bool   `json:"isUnknown"`
}
```

`characters.go` の `chr` 生成部分に `Initials` 生成を追加:

```go
if known && len(displayName) > 0 {
    runes := []rune(displayName)
    if len(runes) >= 2 {
        chr.Initials = string(runes[0:1]) + string(runes[1:2])
    } else {
        chr.Initials = string(runes[0:1])
    }
}
```

- [ ] **Step 5: テスト実行**

```bash
go test ./internal/gamedata/... -v
```

Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add internal/gamedata/ internal/backup/types.go
git commit -m "feat: add character scanning from game data directory"
```

---

## Task 9: backup.Snapshot TDD

**Files:**
- Create: `internal/backup/snapshot.go`
- Create: `internal/backup/snapshot_test.go`

- [ ] **Step 1: テストを書く**

```go
// internal/backup/snapshot_test.go
package backup

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSnapshot_CopyCharacter(t *testing.T) {
	src := t.TempDir()
	dst := t.TempDir()

	// ソースに FFXIV_CHR001/COMMON.DAT と HOTBAR.DAT を作成
	os.MkdirAll(filepath.Join(src, "FFXIV_CHR001"), 0755)
	os.WriteFile(filepath.Join(src, "FFXIV_CHR001", "COMMON.DAT"), []byte("hud"), 0644)
	os.WriteFile(filepath.Join(src, "FFXIV_CHR001", "HOTBAR.DAT"), []byte("hotbar"), 0644)

	snap := NewSnapshot(src, dst)
	count, err := snap.CopyCharacter("FFXIV_CHR001", []string{"COMMON.DAT", "HOTBAR.DAT", "MISSING.DAT"})
	if err != nil {
		t.Fatalf("CopyCharacter error: %v", err)
	}
	if count != 2 { // MISSING.DAT はスキップ
		t.Errorf("expected count 2, got %d", count)
	}

	data, err := os.ReadFile(filepath.Join(dst, "FFXIV_CHR001", "COMMON.DAT"))
	if err != nil {
		t.Fatalf("copied file not found: %v", err)
	}
	if string(data) != "hud" {
		t.Errorf("content mismatch: %q", data)
	}
}

func TestSnapshot_CopyCommon(t *testing.T) {
	src := t.TempDir()
	dst := t.TempDir()

	os.WriteFile(filepath.Join(src, "MACROSYS.DAT"), []byte("macro"), 0644)

	snap := NewSnapshot(src, dst)
	count, err := snap.CopyCommon()
	if err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Errorf("expected 1, got %d", count)
	}
}

func TestSnapshot_CopyCharacter_ZeroFiles(t *testing.T) {
	src := t.TempDir()
	dst := t.TempDir()
	os.MkdirAll(filepath.Join(src, "FFXIV_CHR001"), 0755)

	snap := NewSnapshot(src, dst)
	count, _ := snap.CopyCharacter("FFXIV_CHR001", []string{"MISSING.DAT"})
	if count != 0 {
		t.Errorf("expected 0, got %d", count)
	}
}
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
go test ./internal/backup/... -run TestSnapshot -v
```

Expected: FAIL

- [ ] **Step 3: 実装**

```go
// internal/backup/snapshot.go
package backup

import (
	"errors"
	"io"
	"os"
	"path/filepath"
)

const commonMacroFile = "MACROSYS.DAT"

// Snapshot はゲームデータディレクトリからバックアップ先へファイルをコピーする。
type Snapshot struct {
	srcDir string
	dstDir string
}

func NewSnapshot(srcDir, dstDir string) *Snapshot {
	return &Snapshot{srcDir: srcDir, dstDir: dstDir}
}

// CopyCharacter は指定キャラの指定ファイル群をコピーし、コピーできたファイル数を返す。
// 存在しないファイルはスキップする（エラーにしない）。
func (s *Snapshot) CopyCharacter(charID string, filenames []string) (int, error) {
	count := 0
	for _, name := range filenames {
		srcPath := filepath.Join(s.srcDir, charID, name)
		dstPath := filepath.Join(s.dstDir, charID, name)
		copied, err := copyFileIfExists(srcPath, dstPath)
		if err != nil {
			return count, err
		}
		if copied {
			count++
		}
	}
	return count, nil
}

// CopyCommon は MACROSYS.DAT をコピーし、コピーできたファイル数を返す。
func (s *Snapshot) CopyCommon() (int, error) {
	srcPath := filepath.Join(s.srcDir, commonMacroFile)
	dstPath := filepath.Join(s.dstDir, commonMacroFile)
	copied, err := copyFileIfExists(srcPath, dstPath)
	if err != nil {
		return 0, err
	}
	if copied {
		return 1, nil
	}
	return 0, nil
}

func copyFileIfExists(src, dst string) (bool, error) {
	if _, err := os.Stat(src); errors.Is(err, os.ErrNotExist) {
		return false, nil
	}
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return false, err
	}
	in, err := os.Open(src)
	if err != nil {
		return false, err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return false, err
	}
	defer out.Close()

	if _, err := io.Copy(out, in); err != nil {
		return false, err
	}
	return true, nil
}
```

- [ ] **Step 4: テスト実行**

```bash
go test ./internal/backup/... -run TestSnapshot -v
```

Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add internal/backup/snapshot.go internal/backup/snapshot_test.go
git commit -m "feat: add file snapshot copy logic"
```

---

## Task 10: backup.Service — CreateBackup TDD

**Files:**
- Create: `internal/backup/service.go`
- Create: `internal/backup/service_test.go`（CreateBackup 部分）

- [ ] **Step 1: テストを書く**

```go
// internal/backup/service_test.go
package backup

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func newTestService(t *testing.T) (*Service, string, string) {
	gameDir := t.TempDir()
	nasDir := t.TempDir()
	backupsDir := filepath.Join(nasDir, "backups")
	svc := NewService(gameDir, backupsDir)
	return svc, gameDir, backupsDir
}

func setupCharDir(t *testing.T, gameDir, charID string, files map[string][]byte) {
	t.Helper()
	dir := filepath.Join(gameDir, charID)
	os.MkdirAll(dir, 0755)
	for name, content := range files {
		os.WriteFile(filepath.Join(dir, name), content, 0644)
	}
}

func TestCreateBackup_CharacterOnly(t *testing.T) {
	svc, gameDir, backupsDir := newTestService(t)
	setupCharDir(t, gameDir, "FFXIV_CHR001", map[string][]byte{
		"COMMON.DAT": []byte("hud"),
	})

	err := svc.CreateBackup("Test", "memo", []string{"FFXIV_CHR001"}, false)
	if err != nil {
		t.Fatalf("CreateBackup error: %v", err)
	}

	entries, err := os.ReadDir(backupsDir)
	if err != nil || len(entries) != 1 {
		t.Fatalf("expected 1 backup dir, got %v", err)
	}

	metaData, err := os.ReadFile(filepath.Join(backupsDir, entries[0].Name(), "meta.json"))
	if err != nil {
		t.Fatalf("meta.json not found: %v", err)
	}
	var meta BackupMeta
	json.Unmarshal(metaData, &meta)

	if meta.Name != "Test" {
		t.Errorf("expected name Test, got %q", meta.Name)
	}
	if len(meta.Characters) != 1 || meta.Characters[0] != "FFXIV_CHR001" {
		t.Errorf("unexpected characters: %v", meta.Characters)
	}
	if meta.ContainsCommonMacro {
		t.Error("should not have common macro")
	}
}

func TestCreateBackup_WithCommon(t *testing.T) {
	svc, gameDir, backupsDir := newTestService(t)
	os.WriteFile(filepath.Join(gameDir, "MACROSYS.DAT"), []byte("macro"), 0644)

	err := svc.CreateBackup("WithCommon", "", []string{}, true)
	if err != nil {
		t.Fatalf("CreateBackup error: %v", err)
	}

	entries, _ := os.ReadDir(backupsDir)
	metaData, _ := os.ReadFile(filepath.Join(backupsDir, entries[0].Name(), "meta.json"))
	var meta BackupMeta
	json.Unmarshal(metaData, &meta)

	if !meta.ContainsCommonMacro {
		t.Error("should have common macro flag")
	}
}

func TestCreateBackup_NoFilesFound_Error(t *testing.T) {
	svc, _, _ := newTestService(t)
	// ゲームディレクトリにファイルなし
	err := svc.CreateBackup("Empty", "", []string{"FFXIV_CHR001"}, false)
	if err == nil {
		t.Error("expected error when no files are copied")
	}
}
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
go test ./internal/backup/... -run TestCreateBackup -v
```

Expected: FAIL

- [ ] **Step 3: service.go を作成（CreateBackup のみ）**

```go
// internal/backup/service.go
package backup

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

var allCharacterFiles = []string{
	"COMMON.DAT", "HOTBAR.DAT", "MACRO.DAT", "ADDON.DAT",
	"LOGFLTR.DAT", "UISAVE.DAT", "GS.DAT", "KEYBIND.DAT",
	"CONTROL0.DAT", "CONTROL1.DAT",
}

type Service struct {
	gameDir    string
	backupsDir string
}

func NewService(gameDir, backupsDir string) *Service {
	return &Service{gameDir: gameDir, backupsDir: backupsDir}
}

func (s *Service) CreateBackup(name, memo string, charIDs []string, includeCommon bool) error {
	now := time.Now()
	id := fmt.Sprintf("%s_%s", now.Format("20060102_150405"), uuid.New().String()[:8])
	dstDir := filepath.Join(s.backupsDir, id)

	snap := NewSnapshot(s.gameDir, dstDir)
	totalCopied := 0

	for _, charID := range charIDs {
		count, err := snap.CopyCharacter(charID, allCharacterFiles)
		if err != nil {
			return err
		}
		totalCopied += count
	}

	if includeCommon {
		count, err := snap.CopyCommon()
		if err != nil {
			return err
		}
		totalCopied += count
	}

	if totalCopied == 0 {
		return errors.New("バックアップ対象のファイルが1件も見つかりませんでした")
	}

	meta := BackupMeta{
		BackupID:            id,
		CreatedAt:           now,
		Name:                name,
		Memo:                memo,
		ContainsCommonMacro: includeCommon,
		Characters:          charIDs,
	}
	if err := os.MkdirAll(dstDir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dstDir, "meta.json"), data, 0644)
}
```

- [ ] **Step 4: uuid パッケージを追加**

```bash
go get github.com/google/uuid
```

- [ ] **Step 5: テスト実行**

```bash
go test ./internal/backup/... -run TestCreateBackup -v
```

Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add internal/backup/service.go internal/backup/service_test.go go.mod go.sum
git commit -m "feat: implement CreateBackup with full snapshot"
```

---

## Task 11: backup.Service — GetBackupList TDD

**Files:**
- Modify: `internal/backup/service.go`（GetBackupList を追加）
- Modify: `internal/backup/service_test.go`

- [ ] **Step 1: テストを追加**

`service_test.go` に以下を追加:

```go
func TestGetBackupList_ByCharID(t *testing.T) {
	svc, gameDir, _ := newTestService(t)
	setupCharDir(t, gameDir, "FFXIV_CHR001", map[string][]byte{"COMMON.DAT": []byte("a")})
	setupCharDir(t, gameDir, "FFXIV_CHR002", map[string][]byte{"COMMON.DAT": []byte("b")})

	svc.CreateBackup("BackupA", "", []string{"FFXIV_CHR001"}, false)
	svc.CreateBackup("BackupB", "", []string{"FFXIV_CHR001", "FFXIV_CHR002"}, false)

	list, err := svc.GetBackupList("FFXIV_CHR001")
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 2 {
		t.Errorf("expected 2 backups for CHR001, got %d", len(list))
	}
	// 降順確認（新しい方が先）
	if list[0].CreatedAt.Before(list[1].CreatedAt) {
		t.Error("expected descending order")
	}
}

func TestGetBackupList_AccountSentinel(t *testing.T) {
	svc, gameDir, _ := newTestService(t)
	os.WriteFile(filepath.Join(gameDir, "MACROSYS.DAT"), []byte("m"), 0644)
	setupCharDir(t, gameDir, "FFXIV_CHR001", map[string][]byte{"COMMON.DAT": []byte("c")})

	svc.CreateBackup("WithCommon", "", []string{"FFXIV_CHR001"}, true)
	svc.CreateBackup("CharOnly", "", []string{"FFXIV_CHR001"}, false)

	list, err := svc.GetBackupList("ACCOUNT")
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 1 {
		t.Errorf("expected 1 backup with common macro, got %d", len(list))
	}
	if list[0].Name != "WithCommon" {
		t.Errorf("unexpected backup: %q", list[0].Name)
	}
}
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
go test ./internal/backup/... -run TestGetBackupList -v
```

Expected: FAIL

- [ ] **Step 3: GetBackupList を service.go に追加**

```go
func (s *Service) GetBackupList(charID string) ([]BackupMeta, error) {
	entries, err := os.ReadDir(s.backupsDir)
	if errors.Is(err, os.ErrNotExist) {
		return []BackupMeta{}, nil
	}
	if err != nil {
		return nil, err
	}

	var result []BackupMeta
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		metaPath := filepath.Join(s.backupsDir, e.Name(), "meta.json")
		data, err := os.ReadFile(metaPath)
		if err != nil {
			continue // 破損したバックアップはスキップ
		}
		var meta BackupMeta
		if err := json.Unmarshal(data, &meta); err != nil {
			continue
		}
		if charID == "ACCOUNT" {
			if meta.ContainsCommonMacro {
				result = append(result, meta)
			}
		} else {
			if containsString(meta.Characters, charID) {
				result = append(result, meta)
			}
		}
	}

	// 降順ソート
	sortByCreatedAtDesc(result)
	return result, nil
}

func containsString(slice []string, s string) bool {
	for _, v := range slice {
		if v == s {
			return true
		}
	}
	return false
}

func sortByCreatedAtDesc(metas []BackupMeta) {
	for i := 1; i < len(metas); i++ {
		for j := i; j > 0 && metas[j].CreatedAt.After(metas[j-1].CreatedAt); j-- {
			metas[j], metas[j-1] = metas[j-1], metas[j]
		}
	}
}
```

- [ ] **Step 4: テスト実行**

```bash
go test ./internal/backup/... -run TestGetBackupList -v
```

Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add internal/backup/service.go internal/backup/service_test.go
git commit -m "feat: implement GetBackupList with ACCOUNT sentinel"
```

---

## Task 12: backup.Service — RestoreBackup TDD

**Files:**
- Modify: `internal/backup/service.go`
- Modify: `internal/backup/service_test.go`

- [ ] **Step 1: テストを追加**

```go
func TestRestoreBackup_RestoresFiles(t *testing.T) {
	svc, gameDir, _ := newTestService(t)
	setupCharDir(t, gameDir, "FFXIV_CHR001", map[string][]byte{
		"COMMON.DAT": []byte("original"),
	})

	// バックアップ作成
	svc.CreateBackup("Backup1", "", []string{"FFXIV_CHR001"}, false)
	list, _ := svc.GetBackupList("FFXIV_CHR001")
	backupID := list[0].BackupID

	// ゲームデータを書き換え
	os.WriteFile(filepath.Join(gameDir, "FFXIV_CHR001", "COMMON.DAT"), []byte("modified"), 0644)

	// リストア実行
	err := svc.RestoreBackup(backupID, "FFXIV_CHR001", []string{"COMMON.DAT"}, false)
	if err != nil {
		t.Fatalf("RestoreBackup error: %v", err)
	}

	data, _ := os.ReadFile(filepath.Join(gameDir, "FFXIV_CHR001", "COMMON.DAT"))
	if string(data) != "original" {
		t.Errorf("expected original content, got %q", data)
	}
}

func TestRestoreBackup_InvalidID(t *testing.T) {
	svc, _, _ := newTestService(t)
	err := svc.RestoreBackup("nonexistent_id", "FFXIV_CHR001", []string{"COMMON.DAT"}, false)
	if err == nil {
		t.Error("expected error for invalid backup ID")
	}
}
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
go test ./internal/backup/... -run TestRestoreBackup -v
```

Expected: FAIL

- [ ] **Step 3: RestoreBackup を service.go に追加**

```go
func (s *Service) RestoreBackup(backupID, charID string, files []string, includeCommon bool) error {
	backupDir := filepath.Join(s.backupsDir, backupID)
	if _, err := os.Stat(backupDir); errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("バックアップ '%s' が見つかりません", backupID)
	}

	snap := NewSnapshot(backupDir, s.gameDir)

	if charID != "ACCOUNT" && len(files) > 0 {
		if _, err := snap.CopyCharacter(charID, files); err != nil {
			return err
		}
	}

	if includeCommon {
		if _, err := snap.CopyCommon(); err != nil {
			return err
		}
	}

	return nil
}
```

- [ ] **Step 4: テスト実行（全 backup テスト）**

```bash
go test ./internal/backup/... -v
```

Expected: すべて PASS

- [ ] **Step 5: コミット**

```bash
git add internal/backup/service.go internal/backup/service_test.go
git commit -m "feat: implement RestoreBackup"
```

---

## Task 13: app.go — Wails 公開 API 組み立て

**Files:**
- Modify: `app.go`（Wails テンプレートの初期実装を置き換え）

- [ ] **Step 1: app.go を置き換え**

```go
// app.go
package main

import (
	"context"

	"ffxiv-config-backup/internal/backup"
	"ffxiv-config-backup/internal/config"
	"ffxiv-config-backup/internal/gamedata"
	"ffxiv-config-backup/internal/process"
)

type App struct {
	ctx    context.Context
	local  *config.LocalService
	shared *config.SharedService
	backup *backup.Service
}

func NewApp() *App {
	return &App{local: config.DefaultLocalService()}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	cfg, err := a.local.GetConfig()
	if err != nil || cfg.BackupTargetDirectory == "" {
		return
	}
	a.shared = config.NewSharedService(cfg.BackupTargetDirectory)
	sharedCfg, err := a.shared.GetConfig()
	if err != nil {
		return
	}
	a.backup = backup.NewService(sharedCfg.GameDataPath, cfg.BackupTargetDirectory)
}

// GetLocalConfig は NASパスを返す。未設定なら空文字。
func (a *App) GetLocalConfig() (config.LocalConfig, error) {
	return a.local.GetConfig()
}

// DetectGamePath はゲームデータパスを自動検出する。
func (a *App) DetectGamePath() (string, error) {
	return gamedata.DetectGamePath()
}

// SetBackupDirectory は NASパスとゲームパスを保存し、shared_config.json を初期化する。
func (a *App) SetBackupDirectory(nasPath, gamePath string) error {
	if err := a.local.TestPath(nasPath); err != nil {
		return err
	}
	if err := a.local.SetConfig(config.LocalConfig{BackupTargetDirectory: nasPath}); err != nil {
		return err
	}
	a.shared = config.NewSharedService(nasPath)
	if err := a.shared.SetGameDataPath(gamePath); err != nil {
		return err
	}
	a.backup = backup.NewService(gamePath, nasPath)
	return nil
}

// GetSharedConfig は共有設定を返す。
func (a *App) GetSharedConfig() (config.SharedConfig, error) {
	if a.shared == nil {
		return config.SharedConfig{}, nil
	}
	return a.shared.GetConfig()
}

// GetCharacters はゲームパスをスキャンしてキャラ一覧を返す。
func (a *App) GetCharacters() ([]backup.Character, error) {
	if a.shared == nil {
		return []backup.Character{}, nil
	}
	cfg, err := a.shared.GetConfig()
	if err != nil {
		return nil, err
	}
	return gamedata.GetCharacters(cfg.GameDataPath, cfg.CharacterMappings)
}

// UpdateCharacterMapping はキャラクター表示名を更新する。
func (a *App) UpdateCharacterMapping(charID, name string) error {
	if a.shared == nil {
		return nil
	}
	return a.shared.UpdateCharacterMapping(charID, name)
}

// CreateBackup は指定対象のフルスナップショットを作成する。
func (a *App) CreateBackup(name, memo string, charIDs []string, includeCommon bool) error {
	if a.backup == nil {
		return nil
	}
	running, err := process.CheckFFXIV()
	if err == nil && running {
		return errFFXIVRunning()
	}
	return a.backup.CreateBackup(name, memo, charIDs, includeCommon)
}

// GetBackupList は指定 charID（"ACCOUNT" または FFXIV_CHR*）のバックアップ一覧を返す。
func (a *App) GetBackupList(charID string) ([]backup.BackupMeta, error) {
	if a.backup == nil {
		return []backup.BackupMeta{}, nil
	}
	return a.backup.GetBackupList(charID)
}

// RestoreBackup は指定ファイルをリストアする。
func (a *App) RestoreBackup(backupID, charID string, files []string, includeCommon bool) error {
	if a.backup == nil {
		return nil
	}
	running, err := process.CheckFFXIV()
	if err == nil && running {
		return errFFXIVRunning()
	}
	return a.backup.RestoreBackup(backupID, charID, files, includeCommon)
}

// CheckGameProcess は FF14 が起動中かどうかを返す。
func (a *App) CheckGameProcess() (bool, error) {
	return process.CheckFFXIV()
}

import "errors"

func errFFXIVRunning() error {
	return errors.New("FF14クライアントが起動中です。ゲームを終了してから実行してください。")
}
```

> **注意**: `import "errors"` はファイル先頭の import ブロックに移動すること。

- [ ] **Step 2: ビルド確認**

```bash
go build ./...
```

Expected: エラーなし

- [ ] **Step 3: wails dev で Wails バインディング自動生成を確認**

```bash
wails dev
```

Expected: `frontend/wailsjs/go/main/app.js` と `frontend/wailsjs/models.ts` が生成される

- [ ] **Step 4: コミット**

```bash
git add app.go
git commit -m "feat: wire all Go services into Wails App"
```

---

## Task 14: fileMapping.ts

**Files:**
- Create: `frontend/src/constants/fileMapping.ts`

- [ ] **Step 1: 定数ファイルを作成**

```ts
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
```

- [ ] **Step 2: テストを書く**

```ts
// frontend/src/constants/fileMapping.test.ts
import { describe, it, expect } from 'vitest'
import { CHARACTER_FILES, ACCOUNT_FILES, ALL_CHARACTER_FILENAMES } from './fileMapping'

describe('fileMapping', () => {
  it('CHARACTER_FILES has 10 entries', () => {
    expect(CHARACTER_FILES).toHaveLength(10)
  })
  it('ACCOUNT_FILES has 1 entry', () => {
    expect(ACCOUNT_FILES).toHaveLength(1)
    expect(ACCOUNT_FILES[0].filename).toBe('MACROSYS.DAT')
  })
  it('ALL_CHARACTER_FILENAMES includes CONTROL0 and CONTROL1 separately', () => {
    expect(ALL_CHARACTER_FILENAMES).toContain('CONTROL0.DAT')
    expect(ALL_CHARACTER_FILENAMES).toContain('CONTROL1.DAT')
  })
})
```

- [ ] **Step 3: テスト実行**

```bash
cd frontend && npm test -- --run
```

Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add frontend/src/constants/
git commit -m "feat: add file mapping constants"
```

---

## Task 15: useAppStore.ts

**Files:**
- Create: `frontend/src/store/useAppStore.ts`

- [ ] **Step 1: Zustand をインストール**

```bash
cd frontend && npm install zustand
```

- [ ] **Step 2: ストアを作成**

```ts
// frontend/src/store/useAppStore.ts
import { create } from 'zustand'
import { GetLocalConfig, GetCharacters, GetBackupList, CreateBackup, RestoreBackup, CheckGameProcess } from '../../wailsjs/go/main/App'
// Wails v2 は Go の型を名前空間付きで生成する。
// `wails dev` 実行後に frontend/wailsjs/models.ts を確認し、
// 以下の import を実際の生成型名に合わせて修正すること。
// 例: `import { backup } from '../../wailsjs/models'` → `type BackupMeta = backup.BackupMeta`
import type { backup } from '../../wailsjs/models'

type BackupMeta = backup.BackupMeta
type Character = backup.Character

interface AppState {
  // 設定
  nasPath: string
  // キャラ一覧
  characters: Character[]
  selectedCharId: string | null
  // バックアップ一覧
  backups: BackupMeta[]
  selectedBackupId: string | null
  // リストア選択
  selectedFiles: Set<string>
  // プロセス状態
  isGameRunning: boolean
  // ローディング
  isLoading: boolean
  // エラー
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
      const cfg = await GetLocalConfig()
      set({ nasPath: cfg.backup_target_directory ?? '' })
      if (cfg.backup_target_directory) {
        const chars = await GetCharacters()
        set({ characters: chars })
      }
    } catch (e: unknown) {
      set({ error: String(e) })
    }
  },

  selectCharacter: async (id: string) => {
    set({ selectedCharId: id, selectedBackupId: null, selectedFiles: new Set(), backups: [] })
    try {
      const backups = await GetBackupList(id)
      set({ backups })
    } catch (e: unknown) {
      set({ error: String(e) })
    }
  },

  selectBackup: (id: string) => {
    // バックアップ選択時は全ファイルを選択状態にする（右ペイン初期化）
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
      await CreateBackup(name, memo, charIDs, includeCommon)
      const { selectedCharId } = get()
      if (selectedCharId) {
        const backups = await GetBackupList(selectedCharId)
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
      await RestoreBackup(selectedBackupId, charID, Array.from(selectedFiles), includeCommon)
    } catch (e: unknown) {
      set({ error: String(e) })
    } finally {
      set({ isLoading: false })
    }
  },

  checkGameProcess: async () => {
    try {
      const running = await CheckGameProcess()
      set({ isGameRunning: running })
    } catch {
      set({ isGameRunning: false })
    }
  },

  clearError: () => set({ error: null }),
}))
```

> **注意**: `wailsjs/models.ts` は `wails dev` 実行後に型が確定する。型名（`backupBackupMeta` 等）はビルド後に実際の生成物で確認すること。

- [ ] **Step 3: コミット**

```bash
git add frontend/src/store/ frontend/package.json frontend/package-lock.json
git commit -m "feat: add Zustand app store"
```

---

## Task 16: Toast コンポーネント

**Files:**
- Create: `frontend/src/components/Toast.tsx`

- [ ] **Step 1: Toast を作成**

```tsx
// frontend/src/components/Toast.tsx
import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function Toast() {
  const error = useAppStore((s) => s.error)
  const clearError = useAppStore((s) => s.clearError)

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(clearError, 5000)
    return () => clearTimeout(timer)
  }, [error, clearError])

  if (!error) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-red-900 border border-red-700 text-red-200 rounded-lg shadow-xl p-4 flex items-start gap-3">
      <span className="text-red-400 shrink-0 mt-0.5">✕</span>
      <div>
        <p className="font-bold text-sm text-red-300">エラー</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
      <button onClick={clearError} className="ml-auto text-red-500 hover:text-red-300 shrink-0">✕</button>
    </div>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add frontend/src/components/Toast.tsx
git commit -m "feat: add Toast error notification component"
```

---

## Task 17: SetupModal

**Files:**
- Create: `frontend/src/components/SetupModal.tsx`

- [ ] **Step 1: SetupModal を作成**

```tsx
// frontend/src/components/SetupModal.tsx
import { useState, useEffect } from 'react'
import { DetectGamePath, SetBackupDirectory } from '../../wailsjs/go/main/App'
import { useAppStore } from '../store/useAppStore'

interface Props {
  onComplete: () => void
}

export function SetupModal({ onComplete }: Props) {
  const [nasPath, setNasPath] = useState('')
  const [gamePath, setGamePath] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const setError = useAppStore((s) => s.error)

  useEffect(() => {
    DetectGamePath()
      .then((p) => setGamePath(p))
      .catch(() => {}) // 検出失敗は無視（手動入力へ）
  }, [])

  const canSave = nasPath.trim() !== '' && gamePath.trim() !== ''

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await SetBackupDirectory(nasPath, gamePath)
      setTestResult({ ok: true, message: '接続テスト成功: 書き込み権限を確認しました。' })
    } catch (e: unknown) {
      setTestResult({ ok: false, message: String(e) })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await SetBackupDirectory(nasPath, gamePath)
      onComplete()
    } catch (e: unknown) {
      setTestResult({ ok: false, message: String(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[550px] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 bg-gray-950">
          <h2 className="text-lg font-bold text-gray-100">初期セットアップ: バックアップ先の指定</h2>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-300">
            共有ディレクトリとゲームデータパスを指定してください。
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              共有ディレクトリパス <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nasPath}
              onChange={(e) => setNasPath(e.target.value)}
              placeholder={String.raw`\\NAS\Shared\FF14_Backups`}
              className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-gray-200 text-sm font-mono focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              ゲームデータパス <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={gamePath}
              onChange={(e) => setGamePath(e.target.value)}
              placeholder={String.raw`C:\Users\...\My Games\FINAL FANTASY XIV - A Realm Reborn`}
              className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-gray-200 text-sm font-mono focus:border-blue-500 outline-none"
            />
            {gamePath === '' && (
              <p className="text-xs text-yellow-400 mt-1">
                自動検出できませんでした。手動で入力してください。
              </p>
            )}
          </div>
          {testResult && (
            <div
              className={`p-3 rounded flex items-start text-xs ${
                testResult.ok
                  ? 'bg-green-900/20 border border-green-800/50 text-green-400'
                  : 'bg-red-900/20 border border-red-800/50 text-red-400'
              }`}
            >
              {testResult.message}
            </div>
          )}
          <button
            onClick={handleTest}
            disabled={!canSave || testing}
            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-40"
          >
            {testing ? '確認中...' : '接続テスト'}
          </button>
        </div>
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded font-bold transition"
          >
            {saving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add frontend/src/components/SetupModal.tsx
git commit -m "feat: add SetupModal component"
```

---

## Task 18: Header

**Files:**
- Create: `frontend/src/components/Header.tsx`

- [ ] **Step 1: Header を作成**

```tsx
// frontend/src/components/Header.tsx
import { useAppStore } from '../store/useAppStore'

interface Props {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: Props) {
  const nasPath = useAppStore((s) => s.nasPath)

  return (
    <header className="bg-gray-950 border-b border-gray-800 px-6 py-3 flex justify-between items-center shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
        <h1 className="text-lg font-bold tracking-wider text-gray-100">FFXIV Backup Configurator</h1>
      </div>
      <div className="flex items-center space-x-4 text-sm">
        {nasPath && (
          <span className="text-green-400 flex items-center gap-1">
            <span>✓</span>
            <span className="font-mono text-xs truncate max-w-[240px]">{nasPath}</span>
          </span>
        )}
        <button
          onClick={onSettingsClick}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-1.5 rounded text-sm transition"
        >
          設定
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add frontend/src/components/Header.tsx
git commit -m "feat: add Header component"
```

---

## Task 19: CharacterPane（左ペイン）

**Files:**
- Create: `frontend/src/components/CharacterPane.tsx`

- [ ] **Step 1: CharacterPane を作成**

```tsx
// frontend/src/components/CharacterPane.tsx
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { UpdateCharacterMapping } from '../../wailsjs/go/main/App'

interface Props {
  onCreateBackup: () => void
}

export function CharacterPane({ onCreateBackup }: Props) {
  const characters = useAppStore((s) => s.characters)
  const selectedCharId = useAppStore((s) => s.selectedCharId)
  const selectCharacter = useAppStore((s) => s.selectCharacter)
  const isLoading = useAppStore((s) => s.isLoading)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleEditStart = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditName(currentName)
  }

  const handleEditSave = async (id: string) => {
    await UpdateCharacterMapping(id, editName)
    setEditingId(null)
  }

  return (
    <section className="w-1/4 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800 shrink-0">
        <h2 className="text-xs uppercase font-bold text-gray-500 tracking-widest">1. 対象キャラクター選択</h2>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {characters.map((chr) => {
          const isSelected = chr.id === selectedCharId
          return (
            <div
              key={chr.id}
              onClick={() => selectCharacter(chr.id)}
              className={`p-3 rounded cursor-pointer flex items-center justify-between group transition ${
                isSelected
                  ? 'bg-blue-900/40 border border-blue-700/50'
                  : 'bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {chr.isAccount ? (
                  <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-blue-800 text-blue-200' : chr.isUnknown ? 'border border-dashed border-gray-600 text-gray-500' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {chr.isUnknown ? '?' : (chr.initials || chr.id.slice(-2))}
                  </div>
                )}
                <div>
                  {editingId === chr.id ? (
                    <input
                      className="bg-gray-900 border border-blue-500 rounded px-1 text-sm text-gray-100 w-28"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleEditSave(chr.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditSave(chr.id)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className={`text-sm font-medium ${isSelected ? 'text-blue-300 font-bold' : chr.isUnknown ? 'text-gray-400 italic' : 'text-gray-200'}`}>
                        {chr.displayName}
                      </div>
                      {!chr.isAccount && (
                        <div className="text-xs text-gray-500 font-mono">{chr.id.slice(0, 12)}...</div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!chr.isAccount && (
                <button
                  className={`text-xs transition opacity-0 group-hover:opacity-100 ${
                    chr.isUnknown ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={(e) => handleEditStart(chr.id, chr.isUnknown ? '' : chr.displayName, e)}
                >
                  {chr.isUnknown ? '登録' : '✎'}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <div className="p-4 border-t border-gray-800 shrink-0">
        <button
          onClick={onCreateBackup}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-2 rounded text-sm font-bold transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          新規バックアップ作成
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add frontend/src/components/CharacterPane.tsx
git commit -m "feat: add CharacterPane (left pane)"
```

---

## Task 20: BackupPane（中ペイン）

**Files:**
- Create: `frontend/src/components/BackupPane.tsx`

- [ ] **Step 1: BackupPane を作成**

```tsx
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
    toggleAllFiles(filenames) // 全選択で初期化
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
```

- [ ] **Step 2: コミット**

```bash
git add frontend/src/components/BackupPane.tsx
git commit -m "feat: add BackupPane (middle pane)"
```

---

## Task 21: RestorePane（右ペイン）

**Files:**
- Create: `frontend/src/components/RestorePane.tsx`

- [ ] **Step 1: RestorePane を作成**

```tsx
// frontend/src/components/RestorePane.tsx
import { useEffect } from 'react'
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
        <div className="flex gap-3">
          <button
            onClick={handleRestore}
            disabled={isGameRunning || isLoading || selectedFiles.size === 0}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded font-bold transition"
          >
            {isLoading ? '処理中...' : '選択項目を復元'}
          </button>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add frontend/src/components/RestorePane.tsx
git commit -m "feat: add RestorePane (right pane)"
```

---

## Task 22: CreateBackupModal

**Files:**
- Create: `frontend/src/components/CreateBackupModal.tsx`

- [ ] **Step 1: CreateBackupModal を作成**

```tsx
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
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition"
          >
            {isLoading ? '作成中...' : '作成'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add frontend/src/components/CreateBackupModal.tsx
git commit -m "feat: add CreateBackupModal component"
```

---

## Task 23: App.tsx — ルート組み立て

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: App.tsx を置き換え**

```tsx
// frontend/src/App.tsx
import { useEffect, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import { SetupModal } from './components/SetupModal'
import { Header } from './components/Header'
import { CharacterPane } from './components/CharacterPane'
import { BackupPane } from './components/BackupPane'
import { RestorePane } from './components/RestorePane'
import { CreateBackupModal } from './components/CreateBackupModal'
import { Toast } from './components/Toast'

export default function App() {
  const nasPath = useAppStore((s) => s.nasPath)
  const initApp = useAppStore((s) => s.initApp)
  const checkGameProcess = useAppStore((s) => s.checkGameProcess)
  const [showSetup, setShowSetup] = useState(false)
  const [showCreateBackup, setShowCreateBackup] = useState(false)

  useEffect(() => {
    initApp().then(() => {
      const { nasPath } = useAppStore.getState()
      if (!nasPath) setShowSetup(true)
    })
    checkGameProcess()
  }, [initApp, checkGameProcess])

  const handleSetupComplete = async () => {
    setShowSetup(false)
    await initApp()
  }

  return (
    <div className="bg-gray-900 text-gray-200 h-screen w-screen overflow-hidden flex flex-col font-sans">
      {showSetup && <SetupModal onComplete={handleSetupComplete} />}
      {showCreateBackup && <CreateBackupModal onClose={() => setShowCreateBackup(false)} />}

      <Header onSettingsClick={() => setShowSetup(true)} />

      <main className="flex-1 flex overflow-hidden">
        <CharacterPane onCreateBackup={() => setShowCreateBackup(true)} />
        <BackupPane />
        <RestorePane />
      </main>

      <Toast />
    </div>
  )
}
```

- [ ] **Step 2: main.tsx の確認**

Wails テンプレートの `frontend/src/main.tsx` が以下になっていることを確認:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: ビルド確認**

```bash
cd /Users/yuki/Projects/ffxiv-config-backup
wails dev
```

Expected: アプリが起動し、SetupModal が表示される（ローカル設定未作成のため）

- [ ] **Step 4: コミット**

```bash
git add frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat: assemble root App with setup guard and 3-pane layout"
```

---

## Task 24: 手動統合テスト

**目的:** ゴールデンパス（初回セットアップ → バックアップ作成 → リストア）を実際に動作確認する。

- [ ] **Step 1: wails build で Windows バイナリを生成**

```bash
wails build
```

Expected: `build/bin/ffxiv-config-backup.exe` が生成される

- [ ] **Step 2: 動作確認チェックリスト（Windows 環境で実行）**

```
□ 初回起動: SetupModal が表示される
□ NAS パス入力 + 接続テスト: 成功メッセージが表示される
□ ゲームパス: 自動検出 or 手動入力できる
□ 設定を保存: メイン画面に遷移する
□ 左ペイン: FFXIV_CHR* が一覧表示される
□ キャラ選択: 中ペインが更新される
□ 新規バックアップ作成: モーダルが開き、対象選択・名前入力できる
□ バックアップ作成: 中ペインに表示される
□ バックアップ選択: 右ペインに全ファイルがチェック済みで表示される
□ リストア実行（FF14 未起動時）: 処理が完了しファイルが復元される
□ FF14 起動中のリストア: エラーメッセージが表示され、ボタンが disabled になる
□ ヘッダーの「設定」ボタン: SetupModal が再表示される
□ キャラ名編集（✎ボタン）: 名前が更新される
```

- [ ] **Step 3: 問題があればバグ修正コミット**

```bash
git add -A
git commit -m "fix: <具体的な修正内容>"
```

---

## 参照

- `docs/spec.md` — アーキテクチャ設計書
- `docs/superpowers/specs/2026-06-04-ffxiv-backup-tool-design.md` — 実装スペック
- `docs/uimock.html` — UI モックアップ
