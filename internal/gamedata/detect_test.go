// internal/gamedata/detect_test.go
package gamedata

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDetectGamePathIn_Found(t *testing.T) {
	docs := t.TempDir()
	ffxivDir := filepath.Join(docs, "My Games", "FINAL FANTASY XIV - A Realm Reborn")
	if err := os.MkdirAll(ffxivDir, 0755); err != nil {
		t.Fatal(err)
	}

	got, err := detectGamePathIn(docs)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != ffxivDir {
		t.Errorf("got %q, want %q", got, ffxivDir)
	}
}

func TestDetectGamePathIn_NotFound(t *testing.T) {
	docs := t.TempDir()
	_, err := detectGamePathIn(docs)
	if err == nil {
		t.Error("expected error when FFXIV dir not found")
	}
}
