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
	if err := mkdirAll(nasDir); err != nil {
		t.Fatal(err)
	}
	svc := NewLocalService(dir)
	if err := svc.TestPath(nasDir); err != nil {
		t.Errorf("expected no error for valid dir, got %v", err)
	}
}
