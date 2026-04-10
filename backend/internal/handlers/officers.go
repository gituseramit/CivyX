package handlers

import (
	"context"
	"time"

	"civyx-backend/internal/db"

	"github.com/gofiber/fiber/v2"
)

// OfficerDashboardStats — GET /api/officer/stats
// Returns aggregate counts for the officer dashboard header cards.
func OfficerDashboardStats(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var total, pending, inProgress, resolvedToday int

	err := db.Pool.QueryRow(ctx,
		`SELECT
		   COUNT(*),
		   COUNT(*) FILTER (WHERE status IN ('submitted','acknowledged')),
		   COUNT(*) FILTER (WHERE status = 'in_progress'),
		   COUNT(*) FILTER (WHERE status = 'resolved' AND updated_at >= CURRENT_DATE)
		 FROM complaints`,
	).Scan(&total, &pending, &inProgress, &resolvedToday)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch stats"})
	}

	return c.JSON(fiber.Map{
		"total":          total,
		"pending":        pending,
		"in_progress":    inProgress,
		"resolved_today": resolvedToday,
	})
}

// OfficerListComplaints — GET /api/officer/complaints?ward_id=&status=&category=
// Full complaint list for officer dashboard with all details.
func OfficerListComplaints(c *fiber.Ctx) error {
	wardID := c.Query("ward_id")
	status := c.Query("status")
	category := c.Query("category")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		SELECT c.id, c.title, c.category, c.severity, c.status,
		       c.department, c.ai_classified, c.created_at, c.updated_at,
		       w.name AS ward_name, u.name AS user_name, u.email AS user_email
		FROM complaints c
		LEFT JOIN wards w ON w.id = c.ward_id
		LEFT JOIN users u ON u.id = c.user_id
		WHERE ($1::uuid IS NULL OR c.ward_id = $1::uuid)
		  AND ($2 = '' OR c.status = $2)
		  AND ($3 = '' OR c.category = $3)
		ORDER BY
		  CASE c.severity WHEN 5 THEN 0 WHEN 4 THEN 1 WHEN 3 THEN 2 WHEN 2 THEN 3 ELSE 4 END,
		  c.created_at DESC
		LIMIT 200`

	var wardIDArg interface{}
	if wardID == "" {
		wardIDArg = nil
	} else {
		wardIDArg = wardID
	}

	rows, err := db.Pool.Query(ctx, query, wardIDArg, status, category)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "database query failed"})
	}
	defer rows.Close()

	type complaintRow struct {
		ID           string    `json:"id"`
		Title        string    `json:"title"`
		Category     string    `json:"category"`
		Severity     int       `json:"severity"`
		Status       string    `json:"status"`
		Department   string    `json:"department"`
		AIClassified bool      `json:"ai_classified"`
		CreatedAt    time.Time `json:"created_at"`
		UpdatedAt    time.Time `json:"updated_at"`
		WardName     *string   `json:"ward_name"`
		UserName     *string   `json:"user_name"`
		UserEmail    *string   `json:"user_email"`
	}

	var complaints []complaintRow
	for rows.Next() {
		var row complaintRow
		if err := rows.Scan(
			&row.ID, &row.Title, &row.Category, &row.Severity, &row.Status,
			&row.Department, &row.AIClassified, &row.CreatedAt, &row.UpdatedAt,
			&row.WardName, &row.UserName, &row.UserEmail,
		); err != nil {
			continue
		}
		complaints = append(complaints, row)
	}

	if complaints == nil {
		complaints = []complaintRow{}
	}
	return c.JSON(complaints)
}
