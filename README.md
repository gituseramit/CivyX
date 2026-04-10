CivyX AI
Apni Shikayat, Apni Awaaz
India's first AI-powered hyperlocal civic grievance platform for Tier-2/3 cities and rural Uttar Pradesh.
Voice complaints in Hindi. AI-classified. Officer-tracked. Ward health scored.
![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=flat-square&logo=angular)
![Go](https://img.shields.io/badge/Go-1.22-00ADD8?style=flat-square&logo=go)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_+_PostGIS-336791?style=flat-square&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
Live Demo · Documentation · API Reference · Report Bug · Request Feature
</div>
---
Table of Contents
About the Project
Problem Statement
Key Features
Tech Stack
Architecture
Getting Started
Prerequisites
Installation
Environment Variables
Running the App
API Reference
Database Schema
AI Pipeline
Ward Health Score Algorithm
Free APIs Used
Project Structure
Screenshots
Hackathon
Contributing
Team
License
---
About the Project
CivyX AI transforms how citizens in Uttar Pradesh report and track civic grievances. Instead of visiting a government office or filling a complex online form, a citizen speaks their complaint in Hindi, Awadhi, or Bhojpuri. The platform:
Transcribes the voice using Sarvam AI (22 Indian languages supported)
Classifies the complaint using Groq LLM — category, severity, department — in milliseconds
Routes it to the correct officer with a full digital paper trail
Scores every ward's civic health using a Predictive Ward Health Score (PWHS) combining complaint data + live weather risk
Holds officers accountable with a public resolution leaderboard
Everything runs on 100% free APIs — no credit card required for the full AI feature set.
---
Problem Statement
Pain Point	Current Reality in UP (2026)
Grievance black hole	IGRS logs 40,000+ complaints/day. 60%+ unresolved in 30 days.
Language barrier	75% rural residents cannot type a formal complaint in Hindi/English
Zero prediction	No system warns a ward officer before civic failure happens
No accountability	Road repair reports are paper-based. No verification of completion.
---
Key Features
Voice-first complaint submission — mic button, Hindi/Awadhi speech-to-text via Sarvam AI
AI classification — Groq Llama 3.3 70B auto-detects category, severity (1–5), and department
Predictive Ward Health Score (PWHS) — 0–100 composite civic risk metric per ward
Live Leaflet.js ward map — green/yellow/red markers updated in real-time
Officer accountability dashboard — complaint table, status pipeline, resolution metrics
Complaint timeline — every status change logged with officer name and timestamp
Anonymous mode — GPS blurred to ward centroid for women/vulnerable reporters
PWA support — works offline, syncs when connectivity returns
Prometheus + Grafana monitoring — live metrics dashboard
Single `docker-compose up` — entire stack running in one command
---
Tech Stack
Layer	Technology	Version
Frontend	Angular	17+
UI Components	Angular Material + Tailwind CSS	Latest
Map	Leaflet.js	1.9+
Charts	Chart.js	4+
Backend	Go + Fiber v3	Go 1.22
Database	PostgreSQL + PostGIS	16
Cache	Redis	7
AI — Speech to Text	Sarvam AI (Saaras v3)	Latest
AI — LLM	Groq (Llama 3.3 70B)	Latest
AI — Vision	Gemini 2.5 Flash (optional)	Latest
Weather	Open-Meteo	Free
Maps/Geocoding	OpenStreetMap + Nominatim	Free
Auth	JWT (RS256)	—
Object Storage	MinIO (S3-compatible)	Latest
Monitoring	Prometheus + Grafana	Latest
Deployment	Docker Compose + Railway + Vercel	—
---
Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   CITIZEN / OFFICER (Browser)                │
│                  Angular 17  ·  Leaflet.js                   │
└───────────────────────────┬─────────────────────────────────┘
                            │  HTTP / WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                  GO FIBER v3 BACKEND  :8080                   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Auth    │  │Complaint │  │  Ward    │  │   PWHS     │  │
│  │  Handler │  │ Handler  │  │ Handler  │  │  Compute   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       └─────────────┴─────────────┴───────────────┘         │
│                           │                                   │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │         Services: Groq · Sarvam · Open-Meteo           │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
   ┌──────▼──────┐                      ┌───────▼──────┐
   │ PostgreSQL  │                      │   Redis 7    │
   │ + PostGIS   │                      │ Cache/Queue  │
   └─────────────┘                      └──────────────┘
```
---
Getting Started
Prerequisites
Make sure you have these installed:
```bash
node --version    # v20+ required
go version        # go1.22+ required
docker --version  # Docker Desktop or Engine
git --version
```
Installation
```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/CivyX-ai.git
cd CivyX-ai

# 2. Copy environment file
cp .env.example .env

# 3. Fill in your API keys (see Environment Variables section below)
nano .env
```
Environment Variables
Open `.env` and fill in the following:
```env
# ── Database ──────────────────────────────────────────────
DB_URL=postgres://CivyX:CivyX123@postgres:5432/CivyX

# ── Redis ─────────────────────────────────────────────────
REDIS_URL=redis://redis:6379

# ── Auth ──────────────────────────────────────────────────
JWT_SECRET=your_random_32_character_string_here_change_this

# ── AI APIs (required) ────────────────────────────────────
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Get free key: https://console.groq.com (no credit card)

SARVAM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Get free key: https://dashboard.sarvam.ai (₹1000 free credits)

# ── AI APIs (optional — vision module) ───────────────────
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxx
# Get free key: https://aistudio.google.com (no credit card)

# ── Storage ───────────────────────────────────────────────
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=CivyX
MINIO_SECRET_KEY=CivyX123
MINIO_BUCKET=complaints

# ── Server ────────────────────────────────────────────────
PORT=8080
ENV=development
```
> **Get your free API keys before running:**
> - Groq: [console.groq.com](https://console.groq.com) — no credit card, instant
> - Sarvam AI: [dashboard.sarvam.ai](https://dashboard.sarvam.ai) — ₹1000 free credits on signup
Running the App
```bash
# Start entire stack with one command
docker-compose up --build

# Services available at:
# ┌─────────────────────────────────────────────┐
# │  Angular Frontend  →  http://localhost:4200  │
# │  Go API Backend    →  http://localhost:8080  │
# │  Swagger UI        →  http://localhost:8080/swagger/index.html │
# │  Grafana           →  http://localhost:3000  │
# │  MinIO Console     →  http://localhost:9001  │
# └─────────────────────────────────────────────┘
```
Demo credentials (auto-seeded):
Role	Email	Password
Citizen	`citizen@CivyX.in`	`Test@1234`
Officer	`officer@CivyX.in`	`Test@1234`
---
API Reference
All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.
Auth
Method	Endpoint	Auth	Description
`POST`	`/api/auth/register`	None	Register new user
`POST`	`/api/auth/login`	None	Login, returns JWT
`GET`	`/api/auth/me`	JWT	Current user profile
Complaints
Method	Endpoint	Auth	Description
`POST`	`/api/complaints`	JWT	Submit complaint (voice or text)
`GET`	`/api/complaints`	JWT	List complaints (filterable)
`GET`	`/api/complaints/:id`	JWT	Single complaint + timeline
`PATCH`	`/api/complaints/:id/status`	JWT (officer)	Update status
Submit complaint body:
```json
{
  "audio_base64": "UklGRiQAAABXQVZFZm10...",
  "ward_id": "a1b2c3d4-e5f6-...",
  "lat": 26.8553,
  "lng": 81.0036
}
```
Wards
Method	Endpoint	Auth	Description
`GET`	`/api/wards`	None	All wards with health scores
`GET`	`/api/wards/:id/stats`	None	Ward stats + category breakdown
Full API documentation available at `/swagger/index.html` when the backend is running.
---
Database Schema
```sql
-- 4 core tables

users (id, name, email, password_hash, role, ward_id, created_at)

wards (id, name, city, lat, lng, geojson, health_score, updated_at)

complaints (
  id, user_id, ward_id, title, description,
  category,   -- road | water | power | sanitation | drainage | streetlight | safety | corruption
  severity,   -- 1 (low) to 5 (critical)
  status,     -- submitted → acknowledged → in_progress → resolved
  department, lat, lng, ai_classified, created_at, updated_at
)

complaint_timeline (id, complaint_id, status, note, changed_by, changed_at)
```
---
AI Pipeline
```
Voice Input (WebM/Opus audio)
        │
        ▼
Sarvam AI — Saaras v3 STT
(Hindi/22 Indian languages)
        │
        ▼ transcript text
        │
Groq — Llama 3.3 70B
(structured JSON output mode)
        │
        ▼
{
  category: "road",
  severity: 3,
  department: "PWD — Roads",
  title: "Road pothole near Sector 14",
  summary: "Large pothole causing traffic disruption"
}
        │
        ▼
Saved to PostgreSQL
Ward PWHS recomputed
Response returned to client
```
Groq system prompt (complaint classifier):
```
You are a civic complaint classifier for Indian municipal services.
Return ONLY a valid JSON object. No markdown. No explanation.
Fields: category, severity (1-5), department, title (max 8 words), summary (1 sentence).
```
---
Ward Health Score Algorithm
```
score = 100

- subtract  (unresolved_complaints / total_complaints) × 40   [max −40]
- subtract  min(open_complaint_count × 2, 30)                  [max −30]
- subtract  rainfall_risk_points                               [0 / −10 / −20]
            based on Open-Meteo 7-day precipitation:
            < 20mm → 0pts | 20–60mm → −10pts | > 60mm → −20pts

score = max(0, round(score))

Color mapping:
  80–100 → Green  "Swasth"   (Healthy)
  50–79  → Amber  "Khatara"  (At Risk)
  0–49   → Red    "Sankat"   (Critical)
```
Computed on every `GET /api/wards` call and cached in Redis for 6 hours.
---
Free APIs Used
Service	Purpose	Free Limit	Sign Up
Sarvam AI	Hindi STT (22 languages)	₹1,000 credits (~33hr audio)	dashboard.sarvam.ai
Groq	LLM classification	1,000 req/day, no CC	console.groq.com
Gemini 2.5 Flash	Vision + fallback LLM	1,500 req/day, no CC	aistudio.google.com
Open-Meteo	Weather/rainfall forecast	10,000 calls/day	No key needed
OpenStreetMap	Map tiles + geocoding	Unlimited	No key needed
Railway.app	Backend hosting	$5 free/month	railway.app
Vercel	Frontend hosting	Unlimited	vercel.com
Grafana Cloud	Monitoring	10K metrics free	grafana.com
Total cost to run this project: ₹0
---
Project Structure
```
CivyX-ai/
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── handlers/
│   │   │   ├── auth.go
│   │   │   ├── complaints.go
│   │   │   ├── wards.go
│   │   │   └── officers.go
│   │   └── services/
│   │       ├── groq.go
│   │       ├── sarvam.go
│   │       ├── weather.go
│   │       └── pwhs.go
│   ├── migrations/
│   │   └── 001_init.sql
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/app/
│   │   ├── core/services/
│   │   │   ├── auth.service.ts
│   │   │   ├── complaint.service.ts
│   │   │   ├── ward.service.ts
│   │   │   └── voice.service.ts
│   │   ├── shared/components/
│   │   │   └── navbar.component.ts
│   │   └── pages/
│   │       ├── home/
│   │       ├── landing/
│   │       ├── login/
│   │       ├── submit-complaint/
│   │       ├── ward-map/
│   │       ├── my-complaints/
│   │       └── officer-dashboard/
│   └── angular.json
│
├── docs/
│   └── CivyX_AI_Documentation.pdf
├── docker-compose.yml
├── README.md
└── CONTRIBUTING.md
```
---
Live Demo
> 🔗 Frontend: `https://CivyX-ai.vercel.app`
> 🔗 Backend API: `https://CivyX-api.railway.app`
> 🔗 Swagger Docs: `https://CivyX-api.railway.app/swagger/index.html`
Demo credentials: citizen@CivyX.in / Test@1234
---
Hackathon
This project was built for Hackathon 2026 at United College of Engineering and Research, Prayagraj.
Theme: Social Impact & Civic Tech
Bonuses achieved:
Bonus	Status
Deployment	✅ Railway + Vercel + Docker Compose
UI/UX Creativity	✅ Glassmorphism dark theme + voice-first interface
Data Monitoring & Security	✅ Prometheus + Grafana + JWT + rate limiting
AI Implementation	✅ Sarvam STT + Groq LLM + PWHS weather intelligence
Documentation	✅ This README + PDF docs + Swagger + Storybook
Production-Level Practices	✅ Clean Architecture + migrations + health checks
Innovative Mechanism	✅ First ward-level civic risk score in India
---
Contributing
We welcome contributions! Please read CONTRIBUTING.md for guidelines on how to get started, branch naming, commit style, and the pull request process.
---
License
Distributed under the MIT License. See LICENSE for more information.
---
<div align="center">
Built with purpose in Prayagraj, Uttar Pradesh 🇮🇳
"Har Shikayat Ek Awaaz. Har Awaaz Ek Badlav."
</div>
