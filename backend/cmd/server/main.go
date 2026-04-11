package main

import (
	"log"

	"civyx-backend/internal/config"
	"civyx-backend/internal/db"
	"civyx-backend/internal/handlers"
	"civyx-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"context"
	"time"
)

func main() {
	// 1. Load config
	config.Load()

	// 2. Connect databases
	db.ConnectPostgres()
	db.ConnectRedis()

	// 2.5 Start Background Escalation Engine (Demo Mode: 5 mins)
	go startEscalationEngine()

	// 3. Setup Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "CivyX API",
		BodyLimit:    50 * 1024 * 1024, // 50 MB for officer media uploads
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		},
	})

	// 4. Global middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} ${method} ${path} ${latency}\n",
	}))
	app.Use(middleware.CORS())

	// 5. Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "app": "civyx-backend"})
	})

	// Static serving for media uploads
	app.Static("/uploads", "./uploads")

	// 6. API Routes
	api := app.Group("/api")

	// Auth routes
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Get("/me", middleware.Protected(), handlers.Me)

	// Complaint routes
	complaints := api.Group("/complaints")
	complaints.Post("/", middleware.Protected(), handlers.SubmitComplaint)
	complaints.Get("/mine", middleware.Protected(), handlers.MyComplaints)
	complaints.Get("/", handlers.ListComplaints)
	complaints.Get("/:id", handlers.GetComplaint)
	complaints.Patch("/:id/status", middleware.Protected(), middleware.RequireRole("officer"), handlers.UpdateComplaintStatus)

	// Ward routes
	wards := api.Group("/wards")
	wards.Get("/", handlers.ListWards)
	wards.Get("/:id/stats", handlers.GetWardStats)

	// Officer routes
	officer := api.Group("/officer", middleware.Protected(), middleware.RequireRole("officer"))
	officer.Get("/stats", handlers.OfficerDashboardStats)
	officer.Get("/complaints", handlers.OfficerListComplaints)
	officer.Get("/digest", handlers.GetOfficerDigest)

	// Admin Login — Public endpoint (credentials validated inside)
	api.Post("/admin/login", handlers.AdminLogin)

	// Admin Routes (New Command Center) — Protected
	adm := api.Group("/admin", middleware.Protected(), middleware.RequireAdminRole())
	adm.Get("/stats", handlers.GetAdminStats)
	adm.Get("/officers", handlers.ListOfficers)
	adm.Post("/officers/:id/verify", handlers.VerifyOfficer)
	adm.Get("/audit-logs", handlers.GetAuditLogs)
	adm.Get("/settings", handlers.GetSettings)
	adm.Post("/settings", handlers.UpdateSettings)

	// Public routes (no auth)
	public := api.Group("/public")
	public.Get("/feed", handlers.GetPublicFeed)
	public.Get("/leaderboard", handlers.GetLeaderboard)
	public.Get("/verify/:id", handlers.GetPublicVerification)

	// 7. Start server
	addr := ":" + config.App.Port
	log.Printf("[INFO] CivyX backend starting on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("[FATAL] Server error: %v", err)
	}
}

func startEscalationEngine() {
	log.Println("[INFO] Auto Escalation Engine initialized (Demo Threshold: 5m)")
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		ctx := context.Background()
		
		// Find complaints older than 5 mins in 'submitted' status
		query := `
			UPDATE complaints 
			SET status = 'escalated', is_escalated = TRUE, updated_at = NOW()
			WHERE status = 'submitted' 
			  AND created_at < NOW() - INTERVAL '5 minutes'
			RETURNING id`
		
		rows, err := db.Pool.Query(ctx, query)
		if err != nil {
			log.Printf("[ERROR] Escalation Engine failed: %v", err)
			continue
		}
		
		var escalatedIDs []string
		for rows.Next() {
			var id string
			if err := rows.Scan(&id); err == nil {
				escalatedIDs = append(escalatedIDs, id)
			}
		}
		rows.Close()

		for _, id := range escalatedIDs {
			log.Printf("[ACCOUNTABILITY] Complaint %s auto-escalated due to SLA breach.", id)
			_, _ = db.Pool.Exec(ctx, 
				`INSERT INTO complaint_timeline (complaint_id, status, note) 
				 VALUES ($1, 'escalated', 'Sovereign Auto-Escalation: 5m Response Window Breached')`, 
				id,
			)
		}
	}
}
