// internal/backup/snapshot.go
package backup

import (
	"errors"
	"io"
	"os"
	"path/filepath"
)

const commonMacroFile = "MACROSYS.DAT"

type Snapshot struct {
	srcDir string
	dstDir string
}

func NewSnapshot(srcDir, dstDir string) *Snapshot {
	return &Snapshot{srcDir: srcDir, dstDir: dstDir}
}

// CopyCharacter は指定キャラの指定ファイル群をコピーし、コピーできたファイル数を返す。
// 存在しないファイルはスキップする。
func (s *Snapshot) CopyCharacter(charID string, filenames []string) (int, error) {
	count := 0
	for _, name := range filenames {
		srcPath := filepath.Join(s.srcDir, charID, name)
		dstPath := filepath.Join(s.dstDir, charID, name)
		copied, err := copyFileIfExists(srcPath, dstPath)
		if err != nil {
			return count, err
		}
		if copied {
			count++
		}
	}
	return count, nil
}

// CopyCommon は MACROSYS.DAT をコピーし、コピーできたファイル数を返す。
func (s *Snapshot) CopyCommon() (int, error) {
	srcPath := filepath.Join(s.srcDir, commonMacroFile)
	dstPath := filepath.Join(s.dstDir, commonMacroFile)
	copied, err := copyFileIfExists(srcPath, dstPath)
	if err != nil {
		return 0, err
	}
	if copied {
		return 1, nil
	}
	return 0, nil
}

func copyFileIfExists(src, dst string) (bool, error) {
	if _, err := os.Stat(src); errors.Is(err, os.ErrNotExist) {
		return false, nil
	}
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return false, err
	}
	in, err := os.Open(src)
	if err != nil {
		return false, err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return false, err
	}
	defer out.Close()

	if _, err := io.Copy(out, in); err != nil {
		return false, err
	}
	return true, nil
}
