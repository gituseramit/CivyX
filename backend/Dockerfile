# ---- Build stage ----
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install build deps
RUN apk add --no-cache git

# Copy source (needed before tidy so it can resolve all imports)
COPY go.mod ./
COPY . .

# Generate go.sum and download all dependencies
RUN go mod tidy && go mod download

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o civyx-server ./cmd/server

# ---- Runtime stage ----
FROM alpine:3.20

WORKDIR /app

# CA certs for HTTPS calls to external APIs
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/civyx-server .

EXPOSE 8080

ENTRYPOINT ["./civyx-server"]
