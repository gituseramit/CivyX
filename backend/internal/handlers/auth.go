package handlers

import (
	"context"
	"time"

	"civyx-backend/internal/config"
	"civyx-backend/internal/db"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type registerInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"` // "citizen" or "officer"
	WardID   string `json:"ward_id,omitempty"`
}

type loginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Register — POST /api/auth/register
func Register(c *fiber.Ctx) error {
	var input registerInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Name == "" || input.Email == "" || input.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name, email and password are required"})
	}
	if input.Role != "citizen" && input.Role != "officer" {
		input.Role = "citizen"
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to hash password"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var userID string
	var wardID *string
	if input.WardID != "" {
		wardID = &input.WardID
	}

	var status = "APPROVED"
	if input.Role == "officer" {
		status = "PENDING"
	}

	err = db.Pool.QueryRow(ctx,
		`INSERT INTO users (name, email, password_hash, role, ward_id, verification_status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
		input.Name, input.Email, string(hash), input.Role, wardID, status,
	).Scan(&userID)

	if err != nil {
		return c.Status(409).JSON(fiber.Map{"error": "email already registered"})
	}

	token, err := generateToken(userID, input.Email, input.Role, "")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to generate token"})
	}

	return c.Status(201).JSON(fiber.Map{
		"token": token,
		"user":  fiber.Map{"id": userID, "name": input.Name, "email": input.Email, "role": input.Role},
	})
}

// Login — POST /api/auth/login
func Login(c *fiber.Ctx) error {
	var input loginInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var (
		userID   string
		name     string
		role     string
		passhash string
		aRole    *string
		status   string
	)

	err := db.Pool.QueryRow(ctx,
		`SELECT id, name, role, password_hash, admin_role, verification_status FROM users WHERE email = $1`,
		input.Email,
	).Scan(&userID, &name, &role, &passhash, &aRole, &status)

	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
	}

	if role == "officer" && status == "PENDING" {
		return c.Status(403).JSON(fiber.Map{"error": "account pending government verification"})
	}

	if role == "officer" && status == "SUSPENDED" {
		return c.Status(403).JSON(fiber.Map{"error": "account suspended by administration"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passhash), []byte(input.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
	}

	adminRole := ""
	if aRole != nil {
		adminRole = *aRole
	}

	token, err := generateToken(userID, input.Email, role, adminRole)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to generate token"})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user":  fiber.Map{"id": userID, "name": name, "email": input.Email, "role": role, "admin_role": adminRole},
	})
}

// Me — GET /api/auth/me (JWT protected)
func Me(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var (
		name      string
		email     string
		role      string
		wardID    *string
		createdAt time.Time
	)

	err := db.Pool.QueryRow(ctx,
		`SELECT name, email, role, ward_id, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(&name, &email, &role, &wardID, &createdAt)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}

	return c.JSON(fiber.Map{
		"id":         userID,
		"name":       name,
		"email":      email,
		"role":       role,
		"ward_id":    wardID,
		"created_at": createdAt,
	})
}

// AdminLogin — POST /api/admin/login
func AdminLogin(c *fiber.Ctx) error {
	var input struct {
		AdminID  string `json:"admin_id"` // email
		Password string `json:"password"`
		OTP      string `json:"otp"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	// 1. Check if it's the Super Admin from Env
	if input.AdminID == config.App.AdminEmail && input.Password == config.App.AdminPassword {
		// Mock 2FA for Demo
		if input.OTP == "" {
			return c.Status(200).JSON(fiber.Map{"message": "2FA_REQUIRED", "otp_sent_to": input.AdminID})
		}
		if input.OTP != "123456" {
			return c.Status(401).JSON(fiber.Map{"error": "invalid 2FA code"})
		}

		token, _ := generateToken("SUPER_ADMIN_ID", input.AdminID, "admin", "super_admin")
		return c.JSON(fiber.Map{
			"token": token,
			"user":  fiber.Map{"id": "SUPER_ADMIN", "name": "Institutional Super Admin", "email": input.AdminID, "role": "admin", "admin_role": "super_admin"},
		})
	}

	// 2. Check Database for other admin roles
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var (
		userID    string
		name      string
		role      string
		adminRole string
		passhash  string
	)

	err := db.Pool.QueryRow(ctx,
		`SELECT id, name, role, admin_role, password_hash FROM users WHERE email = $1 AND role = 'admin'`,
		input.AdminID,
	).Scan(&userID, &name, &role, &adminRole, &passhash)

	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized admin portal access"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passhash), []byte(input.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
	}

	// Mock 2FA for other admins too
	if input.OTP != "123456" {
		return c.Status(200).JSON(fiber.Map{"message": "2FA_REQUIRED", "otp_sent_to": input.AdminID})
	}

	token, _ := generateToken(userID, input.AdminID, role, adminRole)
	return c.JSON(fiber.Map{
		"token": token,
		"user":  fiber.Map{"id": userID, "name": name, "email": input.AdminID, "role": role, "admin_role": adminRole},
	})
}

func generateToken(userID, email, role, adminRole string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":    userID,
		"email":      email,
		"role":       role,
		"admin_role": adminRole,
		"exp":        time.Now().Add(72 * time.Hour).Unix(),
		"iat":        time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.App.JWTSecret))
}
