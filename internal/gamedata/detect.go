// internal/gamedata/detect.go
package gamedata

import (
	"errors"
	"os"
	"path/filepath"
)

// DetectGamePath は %USERPROFILE%\Documents 以下の FFXIV フォルダを自動検出する。
func DetectGamePath() (string, error) {
	profile := os.Getenv("USERPROFILE")
	if profile == "" {
		// macOS/Linux 開発環境では HOME を使う
		profile = os.Getenv("HOME")
	}
	if profile == "" {
		return "", errors.New("USERPROFILE 環境変数が設定されていません")
	}
	docs := filepath.Join(profile, "Documents")
	return detectGamePathIn(docs)
}

func detectGamePathIn(docsDir string) (string, error) {
	candidate := filepath.Join(docsDir, "My Games", "FINAL FANTASY XIV - A Realm Reborn")
	if _, err := os.Stat(candidate); err == nil {
		return candidate, nil
	}
	return "", errors.New("FINAL FANTASY XIV のデータフォルダが見つかりませんでした。手動で入力してください。")
}
