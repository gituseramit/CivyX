package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const openMeteoURL = "https://api.open-meteo.com/v1/forecast"

// RainfallRisk returns a risk score (0, 10, or 20) based on forecasted precipitation.
// 0 = low risk (<5mm), 10 = medium risk (5-20mm), 20 = high risk (>20mm).
func RainfallRisk(ctx context.Context, lat, lng float64) (int, error) {
	url := fmt.Sprintf(
		"%s?latitude=%.4f&longitude=%.4f&daily=precipitation_sum&forecast_days=3&timezone=Asia%%2FKolkata",
		openMeteoURL, lat, lng,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, fmt.Errorf("open-meteo request failed: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Daily struct {
			PrecipitationSum []float64 `json:"precipitation_sum"`
		} `json:"daily"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, fmt.Errorf("open-meteo decode error: %w", err)
	}

	// Sum next 3 days of precipitation
	var total float64
	for _, v := range result.Daily.PrecipitationSum {
		total += v
	}

	switch {
	case total > 20:
		return 20, nil
	case total >= 5:
		return 10, nil
	default:
		return 0, nil
	}
}
