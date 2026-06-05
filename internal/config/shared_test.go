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
