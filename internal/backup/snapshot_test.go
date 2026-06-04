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
