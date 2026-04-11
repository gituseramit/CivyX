package services

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
)

const uploadDir = "./uploads"

func init() {
	_ = os.MkdirAll(uploadDir, 0755)
}

// SaveFile saves a file from an io.Reader and returns the relative URL.
func SaveFile(r io.Reader, originalName string) (string, error) {
	ext := filepath.Ext(originalName)
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	path := filepath.Join(uploadDir, filename)

	f, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	if _, err := io.Copy(f, r); err != nil {
		return "", err
	}

	// Returning relative URL which will be served by Fiber static
	return "/uploads/" + filename, nil
}
