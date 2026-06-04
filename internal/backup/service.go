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
