package handlers

import (
	"context"
	"time"
	"civyx-backend/internal/db"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// GetAdminStats — GET /api/admin/stats
func GetAdminStats(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var (
		totalCitizens    int
		totalOfficers    int
		pendingOfficers  int
		totalComplaints  int
		solvedToday      int
		escalatedCount   int
	)

	db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE role = 'citizen'").Scan(&totalCitizens)
	db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE role = 'officer'").Scan(&totalOfficers)
	db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE role = 'officer' AND verification_status = 'PENDING'").Scan(&pendingOfficers)
	db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM complaints").Scan(&totalComplaints)
	db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM complaints WHERE status = 'resolved' AND updated_at > NOW() - INTERVAL '24 hours'").Scan(&solvedToday)
	db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM complaints WHERE is_escalated = true").Scan(&escalatedCount)

	return c.JSON(fiber.Map{
		"citizens":         totalCitizens,
		"officers":         totalOfficers,
		"pending_officers": pendingOfficers,
		"complaints":       totalComplaints,
		"solved_today":     solvedToday,
		"escalated":        escalatedCount,
	})
}

// ListOfficers — GET /api/admin/officers
func ListOfficers(c *fiber.Ctx) error {
	status := c.Query("status", "")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	type officerRow struct {
		ID        string    `json:"id"`
		Name      string    `json:"name"`
		Email     string    `json:"email"`
		Status    string    `json:"status"`
		EmpID     *string   `json:"emp_id"`
		Desig     *string   `json:"designation"`
		Dept      *string   `json:"department"`
		CreatedAt time.Time `json:"created_at"`
	}

	var rows interface {
		Next() bool
		Scan(dest ...any) error
		Close()
		Err() error
	}
	var err error

	baseQuery := `SELECT id, name, email, verification_status, employee_id, designation, department_name, created_at FROM users WHERE role = 'officer'`
	if status != "" {
		rows, err = db.Pool.Query(ctx, baseQuery+" AND verification_status = $1 ORDER BY created_at DESC", status)
	} else {
		rows, err = db.Pool.Query(ctx, baseQuery+" ORDER BY created_at DESC")
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch officers"})
	}
	defer rows.Close()

	var officers []officerRow
	for rows.Next() {
		var o officerRow
		if err := rows.Scan(&o.ID, &o.Name, &o.Email, &o.Status, &o.EmpID, &o.Desig, &o.Dept, &o.CreatedAt); err != nil {
			continue
		}
		officers = append(officers, o)
	}
	if officers == nil {
		officers = []officerRow{}
	}

	return c.JSON(officers)
}

// VerifyOfficer — POST /api/admin/officers/:id/verify
func VerifyOfficer(c *fiber.Ctx) error {
	officerID := c.Params("id")
	var input struct {
		Action string `json:"action"` // APPROVE, REJECT, SUSPEND
		Reason string `json:"reason"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	status := "APPROVED"
	vID := ""
	if input.Action == "REJECT" {
		status = "REJECTED"
	} else if input.Action == "SUSPEND" {
		status = "SUSPENDED"
	} else {
		// Generate Verification ID: GOI-VER-YYYY-MM-RANDOM
		vID = "GOI-VER-" + time.Now().Format("2006-01") + "-" + uuid.New().String()[:5]
	}

	_, err := db.Pool.Exec(ctx,
		`UPDATE users SET verification_status = $1, verification_id = $2, verified_at = $3, rejection_reason = $4 WHERE id = $5 AND role = 'officer'`,
		status, vID, time.Now(), input.Reason, officerID,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to update officer status"})
	}

	// Audit Log (skip for virtual Super Admin)
	adminID, _ := c.Locals("user_id").(string)
	if adminID != "SUPER_ADMIN_ID" && adminID != "" {
		db.Pool.Exec(ctx,
			`INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, new_value) VALUES ($1, $2, $3, $4, $5)`,
			adminID, "OFFICER_VERIFICATION", "officer", officerID, fiber.Map{"status": status, "v_id": vID},
		)
	}

	return c.JSON(fiber.Map{"status": "success", "verification_id": vID})
}

// GetAuditLogs — GET /api/admin/audit-logs
func GetAuditLogs(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := db.Pool.Query(ctx, `
		SELECT a.id, a.action, a.target_type, a.target_id, a.new_value, a.created_at, u.name as admin_name 
		FROM admin_audit_logs a
		JOIN users u ON a.admin_id = u.id
		ORDER BY a.created_at DESC LIMIT 100
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch audit logs"})
	}
	defer rows.Close()

	var logs []fiber.Map
	for rows.Next() {
		var l struct {
			ID         string
			Action     string
			TargetType string
			TargetID   *string
			NewValue   any
			CreatedAt  time.Time
			AdminName  string
		}
		rows.Scan(&l.ID, &l.Action, &l.TargetType, &l.TargetID, &l.NewValue, &l.CreatedAt, &l.AdminName)
		logs = append(logs, fiber.Map{
			"id":          l.ID,
			"action":      l.Action,
			"target_type": l.TargetType,
			"target_id":   l.TargetID,
			"new_value":   l.NewValue,
			"created_at":  l.CreatedAt,
			"admin_name":  l.AdminName,
		})
	}

	return c.JSON(logs)
}

// GetSettings — GET /api/admin/settings
func GetSettings(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := db.Pool.Query(ctx, "SELECT key, value FROM site_settings")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch settings"})
	}
	defer rows.Close()

	settings := make(map[string]interface{})
	for rows.Next() {
		var k string
		var v interface{}
		rows.Scan(&k, &v)
		settings[k] = v
	}

	// Default Fallbacks
	if _, ok := settings["categories"]; !ok {
		settings["categories"] = []string{"Sanitation", "Roads", "Electricity", "Water", "Public Safety"}
	}
	if _, ok := settings["allow_voice"]; !ok {
		settings["allow_voice"] = true
	}

	return c.JSON(settings)
}

// UpdateSettings — POST /api/admin/settings
func UpdateSettings(c *fiber.Ctx) error {
	var input map[string]interface{}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid format"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	adminID, _ := c.Locals("user_id").(string)

	for k, v := range input {
		_, err := db.Pool.Exec(ctx,
			`INSERT INTO site_settings (key, value, updated_by) VALUES ($1, $2, $3)
			 ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()`,
			k, v, adminID,
		)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "failed to commit strategic change: " + k})
		}
	}

	// Audit log (skip for virtual Super Admin)
	if adminID != "SUPER_ADMIN_ID" && adminID != "" {
		db.Pool.Exec(ctx,
			`INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, new_value) VALUES ($1, $2, $3, $4, $5)`,
			adminID, "UPDATE_SETTINGS", "setting", "global", input,
		)
	}

	return c.JSON(fiber.Map{"status": "success"})
}
