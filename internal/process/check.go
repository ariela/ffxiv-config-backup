// internal/process/check.go
package process

import (
	"bytes"
	"os/exec"
	"strings"
)

const ffxivProcessName = "ffxiv_dx11.exe"

// CheckFFXIV は ffxiv_dx11.exe が起動中かどうかを返す。
func CheckFFXIV() (bool, error) {
	return IsProcessRunning(ffxivProcessName)
}

// IsProcessRunning は指定プロセス名が起動中かどうかを確認する。
// Windows では tasklist、macOS/Linux では ps で検出する。
func IsProcessRunning(name string) (bool, error) {
	var out []byte
	var err error

	// tasklist が使えれば Windows 環境（本番）
	out, err = exec.Command("tasklist", "/FI", "IMAGENAME eq "+name, "/NH").Output()
	if err == nil {
		return bytes.Contains(out, []byte(strings.ToLower(name))) ||
			bytes.Contains(out, []byte(name)), nil
	}

	// macOS/Linux 開発環境では ps で代替
	out, err = exec.Command("ps", "-A").Output()
	if err != nil {
		return false, nil
	}
	return bytes.Contains(out, []byte(name)), nil
}
