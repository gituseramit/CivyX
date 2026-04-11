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

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions"
const groqWhisperEndpoint = "https://api.groq.com/openai/v1/audio/transcriptions"
const groqModel = "llama-3.3-70b-versatile"
const groqWhisperModel = "whisper-large-v3"

const classifierSystemPrompt = `You are a civic complaint classifier for Indian municipal services. Given a complaint text, return ONLY a valid JSON object with these exact fields:
{
  "category": "<one of: road, water, power, sanitation, drainage, streetlight, safety, corruption>",
  "severity": <integer 1-5>,
  "department": "<relevant department name in English>",
  "title": "<short 8-word max title for the complaint>",
  "summary": "<one sentence summary in English>"
}
Do not return anything else. No explanation. No markdown. Only the JSON object.`

const resolutionAnalyzerSystemPrompt = `You are a municipal auditor. Given a complaint and the officer's resolution notes, analyze the quality of the resolution. 
Return ONLY a valid JSON object with these exact fields:
{
  "summary": "<concise summary of the original complaint>",
  "quality_score": <int 0-100>,
  "quality_label": "<Poor / Average / Good / Excellent>",
  "sentiment": "<Frustrated / Neutral / Urgent / Distressed>",
  "gap_analysis": "<Compare what was complained about vs. what was resolved. Highlight unaddressed points.>",
  "suggested_followup": "<Next steps for authority or citizen>",
  "tags": ["<tag1>", "<tag2>"]
}
Do not return anything else. No explanation. No markdown. Only the JSON object.`

const dailyDigestSystemPrompt = `You are the CivyX Institutional Intelligence Engine. 
Provide a concise, high-impact operational briefing for a municipal officer.
Combine Hindi and English (Hinglish) to sound professional yet local.
Focus on: statistics of the day, critical alerts (water/roads), and a closing proactive strategy based on a hypothetical weather event (rainy/hot).
Limit to 3 short sentences. Be authoritative and encouraging.`

// AIClassification is the result of Groq's LLM classification.
type AIClassification struct {
	Category   string `json:"category"`
	Severity   int    `json:"severity"`
	Department string `json:"department"`
	Title      string `json:"title"`
	Summary    string `json:"summary"`
}

type AIResolutionReport struct {
	Summary           string   `json:"summary"`
	QualityScore      int      `json:"quality_score"`
	QualityLabel      string   `json:"quality_label"`
	Sentiment         string   `json:"sentiment"`
	GapAnalysis       string   `json:"gap_analysis"`
	SuggestedFollowup string   `json:"suggested_followup"`
	Tags              []string `json:"tags"`
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

// AnalyzeResolution generates an AI report based on the original complaint and resolution details.
func AnalyzeResolution(ctx context.Context, complaintText, resolutionNote string) (*AIResolutionReport, error) {
	if config.App.GroqAPIKey == "" {
		return &AIResolutionReport{
			Summary:           "Mock summary: " + complaintText[:30] + "...",
			QualityScore:      85,
			QualityLabel:      "Good",
			Sentiment:         "Neutral",
			GapAnalysis:       "AI Audit: Resolution appears matching with the provided dossier.",
			SuggestedFollowup: "Schedule follow-up inspection in 15 days.",
			Tags:              []string{"#first-time-fix", "#ai-verified"},
		}, nil
	}

	prompt := fmt.Sprintf("ORIGINAL COMPLAINT: %s\n\nOFFICER RESOLUTION NOTE: %s", complaintText, resolutionNote)

	payload := groqRequest{
		Model: groqModel,
		Messages: []groqMessage{
			{Role: "system", Content: resolutionAnalyzerSystemPrompt},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.2,
		MaxTokens:   512,
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
		return nil, err
	}
	defer resp.Body.Close()

	var gr groqResponse
	if err := json.NewDecoder(resp.Body).Decode(&gr); err != nil {
		return nil, err
	}

	if len(gr.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI")
	}

	var report AIResolutionReport
	if err := json.Unmarshal([]byte(gr.Choices[0].Message.Content), &report); err != nil {
		return nil, fmt.Errorf("failed to parse resolution report: %v", err)
	}

	return &report, nil
}

// TranscribeMedia uses Groq's Whisper API to transcribe audio.
func TranscribeMedia(ctx context.Context, audioData []byte, filename string) (string, error) {
	if config.App.GroqAPIKey == "" {
		return "[Mock Transcription] Resolution elaboration: All issues addressed on-site.", nil
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	_ = writer.WriteField("model", groqWhisperModel)

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(part, bytes.NewReader(audioData)); err != nil {
		return "", err
	}
	writer.Close()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, groqWhisperEndpoint, &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+config.App.GroqAPIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var res struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", err
	}

	return res.Text, nil
}

// GenerateDailyDigest creates a short Hinglish briefing for the officer.
func GenerateDailyDigest(ctx context.Context, stats string) (string, error) {
	if config.App.GroqAPIKey == "" {
		return "Aaj aapke ward mein 5 nayi shikayatein hain. 2 critical hain — ek water supply, ek road. Kal baarish ka khatra hai. Stay alert officer!", nil
	}

	payload := groqRequest{
		Model: groqModel,
		Messages: []groqMessage{
			{Role: "system", Content: dailyDigestSystemPrompt},
			{Role: "user", Content: "WARD STATS FOR TODAY: " + stats},
		},
		Temperature: 0.7,
		MaxTokens:   256,
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, groqEndpoint, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.App.GroqAPIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var gr groqResponse
	if err := json.NewDecoder(resp.Body).Decode(&gr); err != nil {
		return "", err
	}

	if len(gr.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	return gr.Choices[0].Message.Content, nil
}
