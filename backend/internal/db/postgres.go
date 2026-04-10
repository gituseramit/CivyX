package db

import (
	"context"
	"log"

	"civyx-backend/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func ConnectPostgres() {
	var err error
	Pool, err = pgxpool.New(context.Background(), config.App.DBURL)
	if err != nil {
		log.Fatalf("[FATAL] Failed to connect to PostgreSQL: %v", err)
	}

	if err = Pool.Ping(context.Background()); err != nil {
		log.Fatalf("[FATAL] PostgreSQL ping failed: %v", err)
	}

	log.Println("[INFO] PostgreSQL connected successfully")
}
