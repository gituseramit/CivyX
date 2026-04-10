package handlers

import (
	"context"
	"time"

	"civyx-backend/internal/db"
	"civyx-backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

// ListWards — GET /api/wards
// Refreshes PWHS for all wards before returning.
func ListWards(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Refresh scores (non-blocking on error)
	_ = services.RefreshAllWardScores(ctx)

	rows, err := db.Pool.Query(ctx,
		`SELECT id, name, city, lat, lng, health_score, updated_at FROM wards ORDER BY name`,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch wards"})
	}
	defer rows.Close()

	type wardRow struct {
		ID          string    `json:"id"`
		Name        string    `json:"name"`
		City        string    `json:"city"`
		Lat         float64   `json:"lat"`
		Lng         float64   `json:"lng"`
		HealthScore int       `json:"health_score"`
		Color       string    `json:"color"`
		UpdatedAt   time.Time `json:"updated_at"`
	}

	var wards []wardRow
	for rows.Next() {
		var w wardRow
		if err := rows.Scan(&w.ID, &w.Name, &w.City, &w.Lat, &w.Lng, &w.HealthScore, &w.UpdatedAt); err != nil {
			continue
		}
		w.Color = services.HealthColor(w.HealthScore)
		wards = append(wards, w)
	}

	if wards == nil {
		wards = []wardRow{}
	}
	return c.JSON(wards)
}

// GetWardStats — GET /api/wards/:id/stats
func GetWardStats(c *fiber.Ctx) error {
	wardID := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Basic ward info
	var ward struct {
		ID          string  `json:"id"`
		Name        string  `json:"name"`
		City        string  `json:"city"`
		HealthScore int     `json:"health_score"`
		Color       string  `json:"color"`
	}
	err := db.Pool.QueryRow(ctx,
		`SELECT id, name, city, health_score FROM wards WHERE id = $1`, wardID,
	).Scan(&ward.ID, &ward.Name, &ward.City, &ward.HealthScore)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "ward not found"})
	}
	ward.Color = services.HealthColor(ward.HealthScore)

	// Complaint counts by status
	var total, resolved, inProgress, pending int
	_ = db.Pool.QueryRow(ctx,
		`SELECT
		   COUNT(*),
		   COUNT(*) FILTER (WHERE status='resolved'),
		   COUNT(*) FILTER (WHERE status='in_progress'),
		   COUNT(*) FILTER (WHERE status IN ('submitted','acknowledged'))
		 FROM complaints WHERE ward_id = $1`, wardID,
	).Scan(&total, &resolved, &inProgress, &pending)

	// Category breakdown
	catRows, err := db.Pool.Query(ctx,
		`SELECT category, COUNT(*) FROM complaints WHERE ward_id = $1 GROUP BY category ORDER BY COUNT(*) DESC`,
		wardID,
	)

	type catCount struct {
		Category string `json:"category"`
		Count    int    `json:"count"`
	}
	var categories []catCount
	if err == nil {
		defer catRows.Close()
		for catRows.Next() {
			var cc catCount
			_ = catRows.Scan(&cc.Category, &cc.Count)
			categories = append(categories, cc)
		}
	}
	if categories == nil {
		categories = []catCount{}
	}

	return c.JSON(fiber.Map{
		"ward":       ward,
		"total":      total,
		"resolved":   resolved,
		"in_progress": inProgress,
		"pending":    pending,
		"categories": categories,
	})
}
