package services

import (
	"context"
	"fmt"
	"math"

	"civyx-backend/internal/db"
)

// WardStats holds complaint counts needed for PWHS computation.
type WardStats struct {
	WardID    string
	Lat       float64
	Lng       float64
	Total     int
	Unresolved int
	Open      int
}

// ComputePWHS calculates the Predictive Ward Health Score (0–100).
// Formula:
//   score = 100
//   - (unresolved / total) * 40
//   - min(open * 2, 30)
//   - rainfall_risk (0, 10, or 20)
//   score = max(0, round(score))
func ComputePWHS(ctx context.Context, stats WardStats) (int, error) {
	score := 100.0

	if stats.Total > 0 {
		unresolvedRatio := float64(stats.Unresolved) / float64(stats.Total)
		score -= unresolvedRatio * 40
	}

	openPenalty := math.Min(float64(stats.Open)*2, 30)
	score -= openPenalty

	rainfall, err := RainfallRisk(ctx, stats.Lat, stats.Lng)
	if err != nil {
		// Non-fatal; default to 0 risk if weather API fails
		rainfall = 0
	}
	score -= float64(rainfall)

	final := int(math.Max(0, math.Round(score)))
	return final, nil
}

// RefreshAllWardScores fetches stats for every ward and updates health_score in DB.
func RefreshAllWardScores(ctx context.Context) error {
	rows, err := db.Pool.Query(ctx, `
		SELECT
			w.id,
			w.lat,
			w.lng,
			COUNT(c.id) AS total,
			COUNT(c.id) FILTER (WHERE c.status != 'resolved') AS unresolved,
			COUNT(c.id) FILTER (WHERE c.status IN ('submitted','acknowledged')) AS open
		FROM wards w
		LEFT JOIN complaints c ON c.ward_id = w.id
		GROUP BY w.id, w.lat, w.lng
	`)
	if err != nil {
		return fmt.Errorf("failed to query ward stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var s WardStats
		if err := rows.Scan(&s.WardID, &s.Lat, &s.Lng, &s.Total, &s.Unresolved, &s.Open); err != nil {
			continue
		}

		score, err := ComputePWHS(ctx, s)
		if err != nil {
			continue
		}

		_, _ = db.Pool.Exec(ctx,
			`UPDATE wards SET health_score = $1, updated_at = NOW() WHERE id = $2`,
			score, s.WardID,
		)
	}

	return nil
}

// HealthColor returns the color category for a given health score.
func HealthColor(score int) string {
	switch {
	case score >= 80:
		return "green"
	case score >= 50:
		return "yellow"
	default:
		return "red"
	}
}
