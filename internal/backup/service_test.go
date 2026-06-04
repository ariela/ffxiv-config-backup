// internal/backup/service_test.go
package backup

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"
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

func TestGetBackupList_ByCharID(t *testing.T) {
	svc, gameDir, _ := newTestService(t)
	setupCharDir(t, gameDir, "FFXIV_CHR001", map[string][]byte{"COMMON.DAT": []byte("a")})
	setupCharDir(t, gameDir, "FFXIV_CHR002", map[string][]byte{"COMMON.DAT": []byte("b")})

	svc.CreateBackup("BackupA", "", []string{"FFXIV_CHR001"}, false)
	time.Sleep(time.Millisecond * 10)
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
