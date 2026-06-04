// internal/gamedata/characters.go
package gamedata

import (
	"os"
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
			// Initials 生成（先頭 2 文字）
			runes := []rune(displayName)
			if len(runes) >= 2 {
				chr.Initials = string(runes[0:2])
			} else if len(runes) == 1 {
				chr.Initials = string(runes[0:1])
			}
		} else {
			chr.DisplayName = "未登録 (" + id + ")"
		}
		result = append(result, chr)
	}

	return result, nil
}
