package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"civyx-backend/internal/config"
)

const sarvamSTTEndpoint = "https://api.sarvam.ai/speech-to-text"

// TranscribeAudio sends a WAV/WebM audio file (as bytes) to Sarvam AI and returns the transcript.
func TranscribeAudio(ctx context.Context, audioData []byte, filename string) (string, error) {
	if config.App.SarvamAPIKey == "" {
		return "[Mock Transcription] Voice complaint regarding civic issue at selected location.", nil
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	// model field
	_ = writer.WriteField("model", "saaras:v3")
	_ = writer.WriteField("language_code", "hi-IN")
	_ = writer.WriteField("with_timestamps", "false")

	// file field
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err := io.Copy(part, bytes.NewReader(audioData)); err != nil {
		return "", fmt.Errorf("failed to write audio data: %w", err)
	}
	writer.Close()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, sarvamSTTEndpoint, &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("api-subscription-key", config.App.SarvamAPIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("sarvam request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("sarvam error %d: %s", resp.StatusCode, string(b))
	}

	var result struct {
		Transcript string `json:"transcript"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("sarvam decode error: %w", err)
	}

	return result.Transcript, nil
}
