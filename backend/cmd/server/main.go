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
)

func main() {
	// 1. Load config
	config.Load()

	// 2. Connect databases
	db.ConnectPostgres()
	db.ConnectRedis()

	// 3. Setup Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "CivyX API",
		BodyLimit:    10 * 1024 * 1024, // 10 MB for audio uploads
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

	// Officer routes (officer role required)
	officer := api.Group("/officer", middleware.Protected(), middleware.RequireRole("officer"))
	officer.Get("/stats", handlers.OfficerDashboardStats)
	officer.Get("/complaints", handlers.OfficerListComplaints)

	// 7. Start server
	addr := ":" + config.App.Port
	log.Printf("[INFO] CivyX backend starting on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("[FATAL] Server error: %v", err)
	}
}
