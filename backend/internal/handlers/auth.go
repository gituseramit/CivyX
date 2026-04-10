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

	err = db.Pool.QueryRow(ctx,
		`INSERT INTO users (name, email, password_hash, role, ward_id) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
		input.Name, input.Email, string(hash), input.Role, wardID,
	).Scan(&userID)

	if err != nil {
		return c.Status(409).JSON(fiber.Map{"error": "email already registered"})
	}

	token, err := generateToken(userID, input.Email, input.Role)
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
	)

	err := db.Pool.QueryRow(ctx,
		`SELECT id, name, role, password_hash FROM users WHERE email = $1`,
		input.Email,
	).Scan(&userID, &name, &role, &passhash)

	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passhash), []byte(input.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
	}

	token, err := generateToken(userID, input.Email, role)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to generate token"})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user":  fiber.Map{"id": userID, "name": name, "email": input.Email, "role": role},
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

func generateToken(userID, email, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"role":    role,
		"exp":     time.Now().Add(72 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.App.JWTSecret))
}
