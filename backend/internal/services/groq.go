package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"civyx-backend/internal/config"
)

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions"
const groqModel = "llama-3.3-70b-versatile"

const classifierSystemPrompt = `You are a civic complaint classifier for Indian municipal services. Given a complaint text, return ONLY a valid JSON object with these exact fields:
{
  "category": "<one of: road, water, power, sanitation, drainage, streetlight, safety, corruption>",
  "severity": <integer 1-5>,
  "department": "<relevant department name in English>",
  "title": "<short 8-word max title for the complaint>",
  "summary": "<one sentence summary in English>"
}
Do not return anything else. No explanation. No markdown. Only the JSON object.`

// AIClassification is the result of Groq's LLM classification.
type AIClassification struct {
	Category   string `json:"category"`
	Severity   int    `json:"severity"`
	Department string `json:"department"`
	Title      string `json:"title"`
	Summary    string `json:"summary"`
}

type groqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type groqRequest struct {
	Model       string        `json:"model"`
	Messages    []groqMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
	MaxTokens   int           `json:"max_tokens"`
}

type groqChoice struct {
	Message groqMessage `json:"message"`
}

type groqResponse struct {
	Choices []groqChoice `json:"choices"`
}

// ClassifyComplaint sends the complaint text to Groq and returns structured classification.
func ClassifyComplaint(ctx context.Context, text string) (*AIClassification, error) {
	if config.App.GroqAPIKey == "" {
		return &AIClassification{
			Category:   "sanitation",
			Severity:   3,
			Department: "Health & Sanitation Dept",
			Title:      "Civic Issue Report",
			Summary:    "Automated classification fallback for civic complaint.",
		}, nil
	}

	payload := groqRequest{
		Model: groqModel,
		Messages: []groqMessage{
			{Role: "system", Content: classifierSystemPrompt},
			{Role: "user", Content: text},
		},
		Temperature: 0.1,
		MaxTokens:   256,
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, groqEndpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.App.GroqAPIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("groq request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("groq error %d: %s", resp.StatusCode, string(b))
	}

	var gr groqResponse
	if err := json.NewDecoder(resp.Body).Decode(&gr); err != nil {
		return nil, fmt.Errorf("groq decode error: %w", err)
	}

	if len(gr.Choices) == 0 {
		return nil, fmt.Errorf("groq returned no choices")
	}

	var classification AIClassification
	if err := json.Unmarshal([]byte(gr.Choices[0].Message.Content), &classification); err != nil {
		return nil, fmt.Errorf("failed to parse AI JSON: %w (raw: %s)", err, gr.Choices[0].Message.Content)
	}

	return &classification, nil
}
