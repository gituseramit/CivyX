package handlers

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
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

	// AI Similarity Check (Deduplication)
	var parentID *string
	var existingDuplicateCount int
	
	err = db.Pool.QueryRow(ctx,
		`SELECT id, duplicate_count FROM complaints 
		 WHERE ward_id = $1 AND category = $2 AND status != 'resolved' 
		   AND created_at > NOW() - INTERVAL '7 days'
		   AND similarity(description, $3) > 0.4
		 ORDER BY similarity(description, $3) DESC LIMIT 1`,
		input.WardID, category, complaintText,
	).Scan(&parentID, &existingDuplicateCount)

	duplicateMsg := ""
	if err == nil && parentID != nil {
		// We found a match! Increment duplicate count and severity of parent
		_, _ = db.Pool.Exec(ctx, 
			`UPDATE complaints SET 
			 duplicate_count = duplicate_count + 1,
			 severity = LEAST(5, severity + 1),
			 updated_at = NOW() 
			 WHERE id = $1`, *parentID,
		)
		duplicateMsg = fmt.Sprintf("%d other citizens also reported this in your sector.", existingDuplicateCount+1)
	}

	// Step 3: Insert complaint
	var complaintID string
	err = db.Pool.QueryRow(ctx,
		`INSERT INTO complaints
		 (user_id, ward_id, title, description, category, severity, department, lat, lng, ai_classified, duplicate_of)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, $11)
		 RETURNING id`,
		userID, input.WardID, title, complaintText, category, severity, department,
		input.Lat, input.Lng, aiClassified, parentID,
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
		"duplicate_info": duplicateMsg,
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
		       w.name AS ward_name, u.name AS user_name, c.is_escalated, c.duplicate_count
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
		IsEscalated  bool      `json:"is_escalated"`
		DuplicateCount int     `json:"duplicate_count"`
	}

	var complaints []complaintRow
	for rows.Next() {
		var row complaintRow
		if err := rows.Scan(
			&row.ID, &row.Title, &row.Category, &row.Severity, &row.Status,
			&row.Department, &row.Lat, &row.Lng, &row.AIClassified,
			&row.CreatedAt, &row.UpdatedAt, &row.WardName, &row.UserName,
			&row.IsEscalated, &row.DuplicateCount,
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

	// AI Report
	var aiReport struct {
		Summary           string   `json:"summary"`
		QualityScore      int      `json:"quality_score"`
		QualityLabel      string   `json:"quality_label"`
		Sentiment         string   `json:"sentiment"`
		GapAnalysis       string   `json:"gap_analysis"`
		SuggestedFollowup string   `json:"suggested_followup"`
		Tags              []string `json:"tags"`
	}
	_ = db.Pool.QueryRow(ctx,
		`SELECT summary, quality_score, sentiment, gap_analysis, suggested_followup, tags
		 FROM complaint_ai_reports WHERE complaint_id = $1`, id,
	).Scan(&aiReport.Summary, &aiReport.QualityScore, &aiReport.Sentiment, &aiReport.GapAnalysis, &aiReport.SuggestedFollowup, &aiReport.Tags)

	// Resolution Details
	var resDetails struct {
		PhotoURL         string   `json:"photo_url"`
		AudioURL         string   `json:"audio_url"`
		VideoURL         string   `json:"video_url"`
		Transcription    string   `json:"transcription"`
		Lat              *float64 `json:"lat"`
		Lng              *float64 `json:"lng"`
		MismatchFlag     bool     `json:"mismatch_flag"`
		ShareWithCitizen bool     `json:"share_with_citizen"`
	}
	_ = db.Pool.QueryRow(ctx,
		`SELECT photo_url, audio_url, video_url, transcription, lat, lng, mismatch_flag, share_with_citizen
		 FROM complaint_resolutions WHERE complaint_id = $1`, id,
	).Scan(&resDetails.PhotoURL, &resDetails.AudioURL, &resDetails.VideoURL, &resDetails.Transcription, &resDetails.Lat, &resDetails.Lng, &resDetails.MismatchFlag, &resDetails.ShareWithCitizen)

	return c.JSON(fiber.Map{
		"complaint":  complaint,
		"timeline":   timeline,
		"ai_report":  aiReport,
		"resolution": resDetails,
	})
}

// UpdateComplaintStatus — PATCH /api/complaints/:id/status (officer only)
func UpdateComplaintStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	officerID := c.Locals("user_id").(string)

	status := c.FormValue("status")
	note := c.FormValue("note")

	validStatuses := map[string]bool{
		"submitted": true, "acknowledged": true, "in_progress": true, "resolved": true,
	}
	if !validStatuses[status] {
		return c.Status(400).JSON(fiber.Map{"error": "invalid status"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// 1. Update status in DB
	tag, err := db.Pool.Exec(ctx,
		`UPDATE complaints SET status = $1, updated_at = NOW() WHERE id = $2`,
		status, id,
	)
	if err != nil || tag.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "complaint not found"})
	}

	// 2. Add to timeline
	_, _ = db.Pool.Exec(ctx,
		`INSERT INTO complaint_timeline (complaint_id, status, note, changed_by)
		 VALUES ($1, $2, $3, $4)`,
		id, status, note, officerID,
	)

	// 3. If RESOLVED, process resolution proof & AI report
	if status == "resolved" {
		transcription := c.FormValue("transcription")
		shareWithCitizen := c.FormValue("share_with_citizen") == "true"
		latStr := c.FormValue("lat")
		lngStr := c.FormValue("lng")
		mismatch := c.FormValue("mismatch_flag") == "true"

		var photoURL, audioURL, videoURL string

		// Handle Photo
		file, err := c.FormFile("photo")
		if err == nil {
			f, _ := file.Open()
			photoURL, _ = services.SaveFile(f, file.Filename)
			f.Close()
		}

		// Handle Audio
		audioFile, err := c.FormFile("audio")
		if err == nil {
			f, _ := audioFile.Open()
			audioURL, _ = services.SaveFile(f, audioFile.Filename)
			// Auto-transcribe if no manual transcription provided
			if transcription == "" {
				fb, _ := io.ReadAll(f)
				t, _ := services.TranscribeMedia(ctx, fb, audioFile.Filename)
				transcription = t
			}
			f.Close()
		}

		// Handle Video
		videoFile, err := c.FormFile("video")
		if err == nil {
			f, _ := videoFile.Open()
			videoURL, _ = services.SaveFile(f, videoFile.Filename)
			f.Close()
		}

		// Save Resolution Proof
		_, _ = db.Pool.Exec(ctx,
			`INSERT INTO complaint_resolutions 
			 (complaint_id, officer_id, photo_url, audio_url, video_url, transcription, lat, lng, mismatch_flag, share_with_citizen)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			id, officerID, photoURL, audioURL, videoURL, transcription, latStr, lngStr, mismatch, shareWithCitizen,
		)

		// Trigger AI Resolution Analysis
		var complaintDesc string
		_ = db.Pool.QueryRow(ctx, `SELECT description FROM complaints WHERE id = $1`, id).Scan(&complaintDesc)
		aiReport, err := services.AnalyzeResolution(ctx, complaintDesc, note+" "+transcription)
		if err == nil && aiReport != nil {
			_, _ = db.Pool.Exec(ctx,
				`INSERT INTO complaint_ai_reports 
				 (complaint_id, summary, quality_score, sentiment, gap_analysis, suggested_followup, tags)
				 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				id, aiReport.Summary, aiReport.QualityScore, aiReport.Sentiment, aiReport.GapAnalysis, aiReport.SuggestedFollowup, aiReport.Tags,
			)
		}
	}

	return c.JSON(fiber.Map{"message": "status updated", "status": status})
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
