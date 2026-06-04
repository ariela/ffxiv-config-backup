// internal/config/shared.go
package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

type SharedService struct {
	nasDir string
}

func NewSharedService(nasDir string) *SharedService {
	return &SharedService{nasDir: nasDir}
}

func (s *SharedService) configPath() string {
	return filepath.Join(s.nasDir, "shared_config.json")
}

func (s *SharedService) GetConfig() (SharedConfig, error) {
	data, err := os.ReadFile(s.configPath())
	if errors.Is(err, os.ErrNotExist) {
		return SharedConfig{CharacterMappings: map[string]string{}}, nil
	}
	if err != nil {
		return SharedConfig{}, err
	}
	var cfg SharedConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return SharedConfig{}, err
	}
	if cfg.CharacterMappings == nil {
		cfg.CharacterMappings = map[string]string{}
	}
	return cfg, nil
}

func (s *SharedService) save(cfg SharedConfig) error {
	if err := os.MkdirAll(s.nasDir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.configPath(), data, 0644)
}

func (s *SharedService) SetGameDataPath(path string) error {
	cfg, err := s.GetConfig()
	if err != nil {
		return err
	}
	cfg.GameDataPath = path
	return s.save(cfg)
}

func (s *SharedService) UpdateCharacterMapping(charID, name string) error {
	cfg, err := s.GetConfig()
	if err != nil {
		return err
	}
	cfg.CharacterMappings[charID] = name
	return s.save(cfg)
}
