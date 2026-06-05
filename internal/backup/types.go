package backup

import "time"

type BackupMeta struct {
	BackupID            string    `json:"backup_id"`
	CreatedAt           time.Time `json:"created_at"`
	Name                string    `json:"name"`
	Memo                string    `json:"memo"`
	ContainsCommonMacro bool      `json:"contains_common_macro"`
	Characters          []string  `json:"characters"`
}

type Character struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
	Initials    string `json:"initials"`
	IsAccount   bool   `json:"isAccount"`
	IsUnknown   bool   `json:"isUnknown"`
}
