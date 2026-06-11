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

func (s *Service) GetBackupList(charID string) ([]BackupMeta, error) {
	entries, err := os.ReadDir(s.backupsDir)
	if errors.Is(err, os.ErrNotExist) {
		return []BackupMeta{}, nil
	}
	if err != nil {
		return nil, err
	}

	result := make([]BackupMeta, 0)
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
