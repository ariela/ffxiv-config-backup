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
