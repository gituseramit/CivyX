package db

import (
	"context"
	"log"

	"civyx-backend/internal/config"

	"github.com/redis/go-redis/v9"
)

var Redis *redis.Client

func ConnectRedis() {
	opt, err := redis.ParseURL(config.App.RedisURL)
	if err != nil {
		log.Fatalf("[FATAL] Failed to parse Redis URL: %v", err)
	}

	Redis = redis.NewClient(opt)

	if err = Redis.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("[FATAL] Redis ping failed: %v", err)
	}

	log.Println("[INFO] Redis connected successfully")
}
