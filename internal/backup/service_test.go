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
	err := svc.CreateBackup("Empty", "", []string{"FFXIV_CHR001"}, false)
	if err == nil {
		t.Error("expected error when no files are copied")
	}
}
