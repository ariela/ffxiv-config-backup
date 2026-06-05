package config

type LocalConfig struct {
	BackupTargetDirectory string `json:"backup_target_directory"`
}

type SharedConfig struct {
	GameDataPath      string            `json:"game_data_path"`
	CharacterMappings map[string]string `json:"character_mappings"`
}
