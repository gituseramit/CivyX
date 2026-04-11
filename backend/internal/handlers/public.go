package handlers

import (
	"context"
	"fmt"
	"time"

	"civyx-backend/internal/db"
	"civyx-backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

// GetPublicFeed — GET /api/public/complaints
func GetPublicFeed(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Anonymized query: No user name, no exact description if too sensitive? 
	// We'll show title, category, status, and ward.
	query := `
		SELECT c.id, c.title, c.category, c.status, c.created_at, w.name AS ward_name
		FROM complaints c
		LEFT JOIN wards w ON w.id = c.ward_id
		WHERE c.duplicate_of IS NULL
		ORDER BY c.created_at DESC
		LIMIT 50`

	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch feed"})
	}
	defer rows.Close()

	type publicRow struct {
		ID        string    `json:"id"`
		Title     string    `json:"title"`
		Category  string    `json:"category"`
		Status    string    `json:"status"`
		CreatedAt time.Time `json:"created_at"`
		WardName  string    `json:"ward_name"`
	}

	var results []publicRow
	for rows.Next() {
		var r publicRow
		if err := rows.Scan(&r.ID, &r.Title, &r.Category, &r.Status, &r.CreatedAt, &r.WardName); err == nil {
			results = append(results, r)
		}
	}
	if results == nil { results = []publicRow{} }

	return c.JSON(results)
}

// GetLeaderboard — GET /api/public/leaderboard
func GetLeaderboard(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		SELECT u.name, 
		       COUNT(c.id) as total_handled,
		       COUNT(c.id) FILTER (WHERE c.status = 'resolved') as resolved_count,
		       AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at))/3600) FILTER (WHERE c.status = 'resolved') as avg_hours
		FROM users u
		JOIN complaints c ON c.status IN ('acknowledged', 'in_progress', 'resolved', 'escalated') 
		-- Ideally we link to who resolved it, but for now we aggregate by ward officers? 
		-- Simple logic: group by user names who are officers and have handled complaints.
		WHERE u.role = 'officer'
		GROUP BY u.name
		ORDER BY resolved_count DESC, avg_hours ASC
		LIMIT 10`

	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to calculate leaderboard"})
	}
	defer rows.Close()

	type leaderRow struct {
		Name          string   `json:"name"`
		TotalHandled  int      `json:"total_handled"`
		ResolvedCount int      `json:"resolved_count"`
		AvgHours      *float64 `json:"avg_hours"`
		Rate          float64  `json:"rate"`
	}

	var results []leaderRow
	for rows.Next() {
		var r leaderRow
		if err := rows.Scan(&r.Name, &r.TotalHandled, &r.ResolvedCount, &r.AvgHours); err == nil {
			if r.TotalHandled > 0 {
				r.Rate = float64(r.ResolvedCount) / float64(r.TotalHandled) * 100
			}
			results = append(results, r)
		}
	}
	if results == nil { results = []leaderRow{} }

	return c.JSON(results)
}

// GetPublicVerification — GET /api/public/verify/:id
func GetPublicVerification(c *fiber.Ctx) error {
	vID := c.Params("id")
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var o struct {
		Name           string
		VerificationID string
		Designation    *string
		Dept           *string
		EmpID          *string
	}

	err := db.Pool.QueryRow(ctx, 
		`SELECT name, verification_id, designation, department_name, employee_id 
		 FROM users 
		 WHERE verification_id = $1 AND verification_status = 'APPROVED'`,
		vID,
	).Scan(&o.Name, &o.VerificationID, &o.Designation, &o.Dept, &o.EmpID)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "verification token invalid or expired"})
	}

	return c.JSON(fiber.Map{
		"name":            o.Name,
		"verification_id": o.VerificationID,
		"designation":     o.Designation,
		"department":      o.Dept,
		"emp_id":          o.EmpID,
	})
}

// GetOfficerDigest — GET /api/officer/digest (Protected)
func GetOfficerDigest(c *fiber.Ctx) error {
	officerID := c.Locals("user_id").(string)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Fetch ward stats for this officer
	var statsStr string
	var wardName string
	err := db.Pool.QueryRow(ctx, `
		SELECT w.name, 
		       (SELECT COUNT(*) FROM complaints WHERE ward_id = u.ward_id AND status = 'submitted') as pending,
		       (SELECT COUNT(*) FROM complaints WHERE ward_id = u.ward_id AND (category = 'water' OR category = 'road') AND status != 'resolved') as critical
		FROM users u
		JOIN wards w ON w.id = u.ward_id
		WHERE u.id = $1`, officerID).Scan(&wardName, &statsStr, &statsStr) // Reusing var for simplicity in scan 
	
	// Better query to get actual counts
	var pending, critical int
	_ = db.Pool.QueryRow(ctx, `
		SELECT 
		   (SELECT COUNT(*) FROM complaints WHERE ward_id = u.ward_id AND status = 'submitted'),
		   (SELECT COUNT(*) FROM complaints WHERE ward_id = u.ward_id AND (category = 'water' OR category = 'road') AND status != 'resolved')
		FROM users u WHERE u.id = $1`, officerID).Scan(&pending, &critical)

	briefingStats := fmt.Sprintf("Ward: %s. Pending Today: %d. Critical (Water/Road): %d.", wardName, pending, critical)
	
	digest, err := services.GenerateDailyDigest(ctx, briefingStats)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "AI digest failed"})
	}

	return c.JSON(fiber.Map{
		"digest": digest,
		"stats": fiber.Map{
			"pending": pending,
			"critical": critical,
		},
	})
}
