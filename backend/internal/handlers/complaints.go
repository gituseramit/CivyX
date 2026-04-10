package handlers

import (
	"context"
	"encoding/base64"
	"time"

	"civyx-backend/internal/db"
	"civyx-backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

type submitComplaintInput struct {
	Description string  `json:"description"` // typed text
	AudioBase64 string  `json:"audio_base64"` // base64 encoded audio (optional)
	AudioName   string  `json:"audio_name"`   // filename e.g. "recording.webm"
	WardID      string  `json:"ward_id"`
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
}

// SubmitComplaint — POST /api/complaints
func SubmitComplaint(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var input submitComplaintInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.WardID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "ward_id is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	// Step 1: STT if audio provided
	complaintText := input.Description
	if input.AudioBase64 != "" {
		audioBytes, err := base64.StdEncoding.DecodeString(input.AudioBase64)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid base64 audio data"})
		}
		filename := input.AudioName
		if filename == "" {
			filename = "recording.webm"
		}
		transcript, err := services.TranscribeAudio(ctx, audioBytes, filename)
		if err == nil && transcript != "" {
			complaintText = transcript
		}
	}

	if complaintText == "" && input.AudioBase64 != "" {
		complaintText = "[Audio Complaint] Please review the attached voice recording for details."
	}

	if complaintText == "" {
		return c.Status(400).JSON(fiber.Map{"error": "complaint text or audio is required"})
	}

	// Step 2: AI Classification
	classification, err := services.ClassifyComplaint(ctx, complaintText)

	// Defaults if AI fails
	category := "sanitation"
	severity := 3
	department := "Municipal Corporation"
	title := complaintText
	if len(title) > 200 {
		title = title[:200]
	}

	aiClassified := false
	if err == nil && classification != nil {
		category = classification.Category
		severity = classification.Severity
		department = classification.Department
		title = classification.Title
		aiClassified = true
	}

	// Step 3: Insert complaint
	var complaintID string
	err = db.Pool.QueryRow(ctx,
		`INSERT INTO complaints
		 (user_id, ward_id, title, description, category, severity, department, lat, lng, ai_classified)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		 RETURNING id`,
		userID, input.WardID, title, complaintText, category, severity, department,
		input.Lat, input.Lng, aiClassified,
	).Scan(&complaintID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to save complaint: " + err.Error()})
	}

	// Step 4: Insert initial timeline entry
	_, _ = db.Pool.Exec(ctx,
		`INSERT INTO complaint_timeline (complaint_id, status, note, changed_by)
		 VALUES ($1, 'submitted', 'Complaint submitted', $2)`,
		complaintID, userID,
	)

	response := fiber.Map{
		"id":           complaintID,
		"title":        title,
		"category":     category,
		"severity":     severity,
		"department":   department,
		"status":       "submitted",
		"ai_classified": aiClassified,
	}
	if classification != nil {
		response["summary"] = classification.Summary
	}

	return c.Status(201).JSON(response)
}

// ListComplaints — GET /api/complaints?ward_id=&status=&category=
func ListComplaints(c *fiber.Ctx) error {
	wardID := c.Query("ward_id")
	status := c.Query("status")
	category := c.Query("category")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		SELECT c.id, c.title, c.category, c.severity, c.status, c.department,
		       c.lat, c.lng, c.ai_classified, c.created_at, c.updated_at,
		       w.name AS ward_name, u.name AS user_name
		FROM complaints c
		LEFT JOIN wards w ON w.id = c.ward_id
		LEFT JOIN users u ON u.id = c.user_id
		WHERE ($1::uuid IS NULL OR c.ward_id = $1::uuid)
		  AND ($2 = '' OR c.status = $2)
		  AND ($3 = '' OR c.category = $3)
		ORDER BY c.created_at DESC
		LIMIT 100`

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
		Lat          *float64  `json:"lat"`
		Lng          *float64  `json:"lng"`
		AIClassified bool      `json:"ai_classified"`
		CreatedAt    time.Time `json:"created_at"`
		UpdatedAt    time.Time `json:"updated_at"`
		WardName     *string   `json:"ward_name"`
		UserName     *string   `json:"user_name"`
	}

	var complaints []complaintRow
	for rows.Next() {
		var row complaintRow
		if err := rows.Scan(
			&row.ID, &row.Title, &row.Category, &row.Severity, &row.Status,
			&row.Department, &row.Lat, &row.Lng, &row.AIClassified,
			&row.CreatedAt, &row.UpdatedAt, &row.WardName, &row.UserName,
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

// GetComplaint — GET /api/complaints/:id
func GetComplaint(c *fiber.Ctx) error {
	id := c.Params("id")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var complaint struct {
		ID           string    `json:"id"`
		Title        string    `json:"title"`
		Description  string    `json:"description"`
		Category     string    `json:"category"`
		Severity     int       `json:"severity"`
		Status       string    `json:"status"`
		Department   string    `json:"department"`
		Lat          *float64  `json:"lat"`
		Lng          *float64  `json:"lng"`
		AIClassified bool      `json:"ai_classified"`
		WardID       string    `json:"ward_id"`
		UserID       string    `json:"user_id"`
		CreatedAt    time.Time `json:"created_at"`
		UpdatedAt    time.Time `json:"updated_at"`
	}

	err := db.Pool.QueryRow(ctx,
		`SELECT id, title, description, category, severity, status, department,
		 lat, lng, ai_classified, ward_id, user_id, created_at, updated_at
		 FROM complaints WHERE id = $1`, id,
	).Scan(
		&complaint.ID, &complaint.Title, &complaint.Description, &complaint.Category,
		&complaint.Severity, &complaint.Status, &complaint.Department,
		&complaint.Lat, &complaint.Lng, &complaint.AIClassified,
		&complaint.WardID, &complaint.UserID, &complaint.CreatedAt, &complaint.UpdatedAt,
	)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "complaint not found"})
	}

	// Timeline
	timelineRows, err := db.Pool.Query(ctx,
		`SELECT ct.status, ct.note, ct.changed_at, u.name
		 FROM complaint_timeline ct
		 LEFT JOIN users u ON u.id = ct.changed_by
		 WHERE ct.complaint_id = $1
		 ORDER BY ct.changed_at ASC`, id,
	)

	type timelineEntry struct {
		Status    string    `json:"status"`
		Note      *string   `json:"note"`
		ChangedAt time.Time `json:"changed_at"`
		ChangedBy *string   `json:"changed_by"`
	}

	var timeline []timelineEntry
	if err == nil {
		defer timelineRows.Close()
		for timelineRows.Next() {
			var e timelineEntry
			_ = timelineRows.Scan(&e.Status, &e.Note, &e.ChangedAt, &e.ChangedBy)
			timeline = append(timeline, e)
		}
	}
	if timeline == nil {
		timeline = []timelineEntry{}
	}

	return c.JSON(fiber.Map{"complaint": complaint, "timeline": timeline})
}

// UpdateComplaintStatus — PATCH /api/complaints/:id/status (officer only)
func UpdateComplaintStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	officerID := c.Locals("user_id").(string)

	var body struct {
		Status string `json:"status"`
		Note   string `json:"note"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	validStatuses := map[string]bool{
		"submitted": true, "acknowledged": true, "in_progress": true, "resolved": true,
	}
	if !validStatuses[body.Status] {
		return c.Status(400).JSON(fiber.Map{"error": "invalid status"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tag, err := db.Pool.Exec(ctx,
		`UPDATE complaints SET status = $1, updated_at = NOW() WHERE id = $2`,
		body.Status, id,
	)
	if err != nil || tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "complaint not found"})
	}

	var note *string
	if body.Note != "" {
		note = &body.Note
	}

	_, _ = db.Pool.Exec(ctx,
		`INSERT INTO complaint_timeline (complaint_id, status, note, changed_by)
		 VALUES ($1, $2, $3, $4)`,
		id, body.Status, note, officerID,
	)

	return c.JSON(fiber.Map{"message": "status updated", "status": body.Status})
}

// MyComplaints — GET /api/complaints/mine (citizen sees own complaints)
func MyComplaints(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := db.Pool.Query(ctx,
		`SELECT c.id, c.title, c.category, c.severity, c.status, c.department,
		        c.ai_classified, c.created_at, c.updated_at, w.name AS ward_name
		 FROM complaints c
		 LEFT JOIN wards w ON w.id = c.ward_id
		 WHERE c.user_id = $1
		 ORDER BY c.created_at DESC`, userID,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "database query failed"})
	}
	defer rows.Close()

	type row struct {
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
	}

	var results []row
	for rows.Next() {
		var r row
		if err := rows.Scan(
			&r.ID, &r.Title, &r.Category, &r.Severity, &r.Status, &r.Department,
			&r.AIClassified, &r.CreatedAt, &r.UpdatedAt, &r.WardName,
		); err != nil {
			continue
		}
		results = append(results, r)
	}
	if results == nil {
		results = []row{}
	}
	return c.JSON(results)
}
