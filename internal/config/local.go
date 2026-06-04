// internal/config/local.go
package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

type LocalService struct {
	configDir string
}

func NewLocalService(configDir string) *LocalService {
	return &LocalService{configDir: configDir}
}

// DefaultLocalService は %APPDATA%/FF14SyncTool を使う
func DefaultLocalService() *LocalService {
	appData := os.Getenv("APPDATA")
	if appData == "" {
		appData, _ = os.UserHomeDir()
	}
	return NewLocalService(filepath.Join(appData, "FF14SyncTool"))
}

func (s *LocalService) configPath() string {
	return filepath.Join(s.configDir, "local.json")
}

func (s *LocalService) GetConfig() (LocalConfig, error) {
	data, err := os.ReadFile(s.configPath())
	if errors.Is(err, os.ErrNotExist) {
		return LocalConfig{}, nil
	}
	if err != nil {
		return LocalConfig{}, err
	}
	var cfg LocalConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return LocalConfig{}, err
	}
	return cfg, nil
}

func (s *LocalService) SetConfig(cfg LocalConfig) error {
	if err := os.MkdirAll(s.configDir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.configPath(), data, 0644)
}

func (s *LocalService) TestPath(path string) error {
	testFile := filepath.Join(path, ".ff14sync_test")
	if err := os.WriteFile(testFile, []byte("ok"), 0644); err != nil {
		return errors.New("バックアップ先ディレクトリへの書き込みができません: " + err.Error())
	}
	return os.Remove(testFile)
}

// mkdirAll は os.MkdirAll のヘルパー（テスト用）
func mkdirAll(path string) error {
	return os.MkdirAll(path, 0755)
}
