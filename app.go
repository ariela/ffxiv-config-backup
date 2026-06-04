package main

import (
	"context"
	"errors"

	"ffxiv-config-backup/internal/backup"
	"ffxiv-config-backup/internal/config"
	"ffxiv-config-backup/internal/gamedata"
	"ffxiv-config-backup/internal/process"
)

type App struct {
	ctx    context.Context
	local  *config.LocalService
	shared *config.SharedService
	backup *backup.Service
}

func NewApp() *App {
	return &App{local: config.DefaultLocalService()}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	cfg, err := a.local.GetConfig()
	if err != nil || cfg.BackupTargetDirectory == "" {
		return
	}
	a.shared = config.NewSharedService(cfg.BackupTargetDirectory)
	sharedCfg, err := a.shared.GetConfig()
	if err != nil {
		return
	}
	a.backup = backup.NewService(sharedCfg.GameDataPath, cfg.BackupTargetDirectory)
}

func (a *App) GetLocalConfig() (config.LocalConfig, error) {
	return a.local.GetConfig()
}

func (a *App) DetectGamePath() (string, error) {
	return gamedata.DetectGamePath()
}

func (a *App) SetBackupDirectory(nasPath, gamePath string) error {
	if err := a.local.TestPath(nasPath); err != nil {
		return err
	}
	if err := a.local.SetConfig(config.LocalConfig{BackupTargetDirectory: nasPath}); err != nil {
		return err
	}
	a.shared = config.NewSharedService(nasPath)
	if err := a.shared.SetGameDataPath(gamePath); err != nil {
		return err
	}
	a.backup = backup.NewService(gamePath, nasPath)
	return nil
}

func (a *App) GetSharedConfig() (config.SharedConfig, error) {
	if a.shared == nil {
		return config.SharedConfig{}, nil
	}
	return a.shared.GetConfig()
}

func (a *App) GetCharacters() ([]backup.Character, error) {
	if a.shared == nil {
		return []backup.Character{}, nil
	}
	cfg, err := a.shared.GetConfig()
	if err != nil {
		return nil, err
	}
	return gamedata.GetCharacters(cfg.GameDataPath, cfg.CharacterMappings)
}

func (a *App) UpdateCharacterMapping(charID, name string) error {
	if a.shared == nil {
		return nil
	}
	return a.shared.UpdateCharacterMapping(charID, name)
}

func (a *App) CreateBackup(name, memo string, charIDs []string, includeCommon bool) error {
	if a.backup == nil {
		return nil
	}
	running, err := process.CheckFFXIV()
	if err == nil && running {
		return errFFXIVRunning()
	}
	return a.backup.CreateBackup(name, memo, charIDs, includeCommon)
}

func (a *App) GetBackupList(charID string) ([]backup.BackupMeta, error) {
	if a.backup == nil {
		return []backup.BackupMeta{}, nil
	}
	return a.backup.GetBackupList(charID)
}

func (a *App) RestoreBackup(backupID, charID string, files []string, includeCommon bool) error {
	if a.backup == nil {
		return nil
	}
	running, err := process.CheckFFXIV()
	if err == nil && running {
		return errFFXIVRunning()
	}
	return a.backup.RestoreBackup(backupID, charID, files, includeCommon)
}

func (a *App) CheckGameProcess() (bool, error) {
	return process.CheckFFXIV()
}

func errFFXIVRunning() error {
	return errors.New("FF14クライアントが起動中です。ゲームを終了してから実行してください。")
}
