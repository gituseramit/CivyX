package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	DBURL            string
	RedisURL         string
	JWTSecret        string
	GroqAPIKey       string
	SarvamAPIKey     string
	GoogleMapsAPIKey string
	AdminEmail       string
	AdminPassword    string
}

var App Config

func Load() {
	// Load .env if present (won't fail in Docker where env vars are injected)
	_ = godotenv.Load()

	App = Config{
		Port:             getEnv("PORT", "8080"),
		DBURL:            getEnv("DB_URL", "postgres://gramvaani:gramvaani123@localhost:5432/gramvaani"),
		RedisURL:         getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:        getEnv("JWT_SECRET", "change_this_secret_in_production"),
		GroqAPIKey:       getEnv("GROQ_API_KEY", ""),
		SarvamAPIKey:     getEnv("SARVAM_API_KEY", ""),
		GoogleMapsAPIKey: getEnv("GOOGLE_MAPS_API_KEY", ""),
		AdminEmail:       getEnv("ADMIN_EMAIL", "superadmin@civyx.gov.in"),
		AdminPassword:    getEnv("ADMIN_PASSWORD", "SuperSecureAdmin2026!"),
	}

	if App.GroqAPIKey == "" {
		log.Println("[WARN] GROQ_API_KEY is not set. AI classification will be skipped.")
	}
	if App.SarvamAPIKey == "" {
		log.Println("[WARN] SARVAM_API_KEY is not set. Voice-to-text will be skipped.")
	}
	if App.GoogleMapsAPIKey == "" {
		log.Println("[WARN] GOOGLE_MAPS_API_KEY is not set. Map features may be limited.")
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}