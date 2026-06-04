// internal/process/check_test.go
package process

import "testing"

func TestIsProcessRunning_NotRunning(t *testing.T) {
	running, err := IsProcessRunning("this_app_does_not_exist_xyz.exe")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if running {
		t.Error("expected false for non-existent process")
	}
}
