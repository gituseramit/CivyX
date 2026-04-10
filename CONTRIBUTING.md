Contributing to CivyX AI
First off — thank you for taking the time to contribute. Every line of code, bug report, and suggestion helps build a platform that actually serves real citizens in India.
---
Table of Contents
Code of Conduct
How Can I Contribute?
Getting the Project Running Locally
Branch Naming Convention
Commit Message Style
Pull Request Process
Frontend Contribution Guidelines
Backend Contribution Guidelines
Adding a New AI Feature
Reporting Bugs
Suggesting Features
Project Structure Quick Reference
---
Code of Conduct
This project is built for civic good. All contributors are expected to:
Be respectful and constructive in all interactions
Welcome newcomers — this is an open project
Keep discussions focused on improving the platform
Not submit code that introduces security vulnerabilities, fake data, or misleading metrics
Any contributor violating these expectations will be removed from the project.
---
How Can I Contribute?
There are four ways to contribute, from easiest to most involved:
1. Report a bug — open an Issue with the `bug` label
2. Suggest a feature — open an Issue with the `enhancement` label
3. Fix a bug — pick an open Issue tagged `good first issue` and submit a PR
4. Build a feature — comment on an Issue to claim it, then submit a PR
If you want to work on something not in the Issues list, open an Issue first describing what you plan to build. This avoids duplicate work.
---
Getting the Project Running Locally
Step 1 — Clone and setup
```bash
git clone https://github.com/YOUR_USERNAME/CivyX-ai.git
cd CivyX-ai
cp .env.example .env
```
Step 2 — Get your free API keys
Key	Where to get it	Time
`GROQ_API_KEY`	console.groq.com	2 min
`SARVAM_API_KEY`	dashboard.sarvam.ai	3 min
Fill them into your `.env` file. Everything else is pre-configured for local dev.
Step 3 — Start the stack
```bash
docker-compose up --build
```
This starts: PostgreSQL + PostGIS, Redis, Go backend, Angular frontend, MinIO, Prometheus, Grafana.
Step 4 — Verify everything works
```bash
# Backend health check
curl http://localhost:8080/health

# Expected response:
# {"status":"ok","db":"connected","redis":"connected"}
```
Frontend should be live at `http://localhost:4200`.
Running backend only (without Docker)
```bash
cd backend
go mod tidy
go run cmd/server/main.go
```
Requires local PostgreSQL and Redis running. Set `DB_URL` and `REDIS_URL` in `.env` accordingly.
Running frontend only (without Docker)
```bash
cd frontend
npm install
ng serve
```
---
Branch Naming Convention
All branches must follow this pattern:
```
<type>/<short-description>
```
Type	When to use
`feat/`	New feature or page
`fix/`	Bug fix
`refactor/`	Code restructure with no behavior change
`docs/`	Documentation changes only
`test/`	Adding or fixing tests
`chore/`	Build scripts, deps, config changes
`style/`	CSS/UI-only changes
Examples:
```bash
feat/voice-recorder-component
fix/pwhs-calculation-negative-score
docs/update-api-reference
refactor/complaint-handler-clean-architecture
style/officer-dashboard-mobile-responsive
```
Rules:
Use lowercase only
Use hyphens, not underscores or spaces
Keep it short — max 5 words after the prefix
Never commit directly to `main` or `develop`
---
Commit Message Style
We follow the Conventional Commits specification.
Format
```
<type>(<scope>): <short summary>

[optional body — explain the why, not the what]

[optional footer — breaking changes, issue references]
```
Type values
Type	Meaning
`feat`	New feature
`fix`	Bug fix
`docs`	Docs only
`style`	Formatting, no logic change
`refactor`	Code change with no feature/fix
`test`	Tests added or fixed
`chore`	Build process, dependency updates
`perf`	Performance improvement
Scope values (for this project)
`auth` · `complaints` · `wards` · `pwhs` · `groq` · `sarvam` · `map` · `dashboard` · `ui` · `db` · `docker` · `docs`
Examples
```bash
# Good
feat(complaints): add voice recorder component with MediaRecorder API
fix(pwhs): prevent negative score when no complaints exist in ward
docs(api): add swagger annotations to ward endpoints
refactor(groq): extract classification prompt into constants file
chore(docker): upgrade postgres image to 16-3.4

# Bad — too vague
git commit -m "fixed bug"
git commit -m "updated stuff"
git commit -m "WIP"
```
Summary rules
Use imperative mood: "add" not "added", "fix" not "fixed"
Do not end with a period
Max 72 characters for the summary line
Reference issue numbers in the footer: `Closes #42`
---
Pull Request Process
Before opening a PR
[ ] Your branch is up to date with `develop`
[ ] All existing tests pass (`go test ./...` and `ng test`)
[ ] No console errors in the browser
[ ] Backend compiles with zero warnings (`go build ./...`)
[ ] You have tested the specific feature/fix manually
[ ] You have not committed your `.env` file or any API keys
Opening the PR
Push your branch to the remote:
```bash
   git push origin feat/your-feature-name
   ```
Open a PR against the `develop` branch (never directly to `main`)
Fill in the PR template completely:
What does this PR do?
What issue does it close? (`Closes #XX`)
How was it tested?
Screenshots (for UI changes)
Add at least one reviewer
PR review criteria
PRs will be reviewed for:
Correctness — does it do what it says it does?
Code style — follows the patterns already in the codebase
Security — no hardcoded secrets, no SQL injection risks, no XSS vectors
Performance — no N+1 queries, no blocking operations on the main goroutine
Tests — critical logic should have at least one test
Merge policy
PRs require 1 approval before merging
The author should not merge their own PR (unless working solo)
Squash merge to `develop` — keep history clean
`main` is only updated from `develop` via a release PR
---
Frontend Contribution Guidelines
Component rules
All components must be standalone (Angular 17 standalone component pattern)
Use `OnPush` change detection strategy for all components
Use Angular Signals (`signal()`, `computed()`) for local state — not `BehaviorSubject`
Every component file must export one default component
File naming
```
feature-name.component.ts       ← component class + template + styles (inline)
feature-name.service.ts         ← service
feature-name.guard.ts           ← route guard
```
CSS rules
Use Tailwind utility classes for layout and spacing
Use Angular Material components for forms, buttons, chips, dialogs
Do not write custom CSS for things Tailwind already covers
All colors must come from the design token system — no hardcoded hex values in templates
Design tokens (use these, do not override)
```scss
// Primary
--color-primary: #C1440E

// Status colors
--color-success: #4ade80
--color-warning: #fbbf24
--color-danger:  #f87171
--color-info:    #38bdf8

// Status pill classes (pre-built, use these)
.status-submitted    { background: #f1f5f9; color: #475569; }
.status-acknowledged { background: #FAEEDA; color: #633806; }
.status-in_progress  { background: #E6F1FB; color: #0C447C; }
.status-resolved     { background: #EAF3DE; color: #27500A; }
```
Service rules
All HTTP calls must go through a service — never call `HttpClient` directly from a component
Services must handle errors and return typed Observables
Auth token must be injected via `AuthService.getToken()` — never read from localStorage directly in components
---
Backend Contribution Guidelines
Architecture rules
The backend follows Clean Architecture. Each layer must only depend on the layer below it:
```
Handlers → Services → DB / External APIs
```
Handlers (`/internal/handlers`) — parse HTTP request, call service, return HTTP response
Services (`/internal/services`) — business logic, AI API calls, PWHS computation
DB (`/internal/db`) — database queries only, no business logic
Never write a database query inside a handler directly. Always go through a service or a dedicated DB function.
Go code style
Run `gofmt` before every commit — no exceptions
Run `go vet ./...` — fix all warnings
Export only what is needed — keep internal things unexported
Use `context.Context` as the first parameter in all functions that do I/O
Handle all errors — never use `_` to discard an error from a function that can fail
Adding a new endpoint
Add route in `cmd/server/main.go`
Create handler function in the appropriate file under `/internal/handlers/`
Add business logic in `/internal/services/`
Add Swagger annotation comments above the handler function:
```go
// @Summary      Submit a complaint
// @Description  Accepts voice audio or text, runs AI classification, saves to DB
// @Tags         complaints
// @Accept       json
// @Produce      json
// @Param        body body ComplaintRequest true "Complaint payload"
// @Success      201 {object} ComplaintResponse
// @Failure      400 {object} ErrorResponse
// @Router       /complaints [post]
func CreateComplaint(c *fiber.Ctx) error {
```
Re-run `swag init` to regenerate Swagger docs
Database changes
All schema changes must be in a new migration file: `migrations/00X_description.sql`
Never modify an existing migration file that has already been merged
Test your migration runs cleanly with: `golang-migrate -path migrations -database $DB_URL up`
---
Adding a New AI Feature
The AI pipeline lives in `/internal/services/`. To add a new AI capability:
Create a new file: `/internal/services/yourfeature.go`
Define a struct for the API client with an API key field
Add the API key to `.env.example` with a descriptive comment
Add the key to `/internal/config/config.go`
Write the HTTP call using Go's standard `net/http` — no SDKs, keep dependencies minimal
The function must accept a `context.Context` as first argument for timeout handling
Add a timeout: no AI call should wait more than 10 seconds
Document which free tier you are using and its rate limits in a comment at the top of the file
Example pattern:
```go
// GroqService calls Groq's OpenAI-compatible API.
// Free tier: 1,000 requests/day, no credit card required.
// Sign up: https://console.groq.com
type GroqService struct {
    APIKey string
    Client *http.Client
}

func (g *GroqService) ClassifyComplaint(ctx context.Context, text string) (*ClassificationResult, error) {
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()
    // ...
}
```
---
Reporting Bugs
Open an Issue and use the Bug Report template. Include:
What happened — describe what you did and what went wrong
Expected behavior — what should have happened
Steps to reproduce — numbered list, as specific as possible
Environment — OS, browser, Docker version, Node version
Logs — paste relevant output from `docker-compose logs backend` or browser console
Screenshots — if it's a UI bug
Do not open an Issue for questions. Use the Discussions tab instead.
---
Suggesting Features
Open an Issue with the Feature Request template. Include:
Problem — what pain point does this solve?
Proposed solution — how would you implement it?
Alternatives considered — what else did you think about?
Affected components — frontend, backend, AI pipeline, database?
Good feature requests describe the problem first, not just the solution.
---
Project Structure Quick Reference
```
CivyX-ai/
├── backend/
│   ├── cmd/server/main.go          ← entry point, route registration
│   ├── internal/
│   │   ├── config/config.go        ← env var loading
│   │   ├── db/postgres.go          ← pgx pool
│   │   ├── db/redis.go             ← redis client
│   │   ├── middleware/             ← JWT, CORS, rate limit
│   │   ├── handlers/               ← HTTP handlers (thin layer)
│   │   └── services/               ← business logic + AI calls
│   ├── migrations/                 ← numbered SQL migration files
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   └── src/app/
│       ├── core/services/          ← all Angular services
│       ├── shared/components/      ← reusable components
│       ├── pages/                  ← one folder per route
│       ├── guards/                 ← auth + officer guards
│       ├── app.routes.ts           ← route definitions
│       └── app.config.ts           ← providers
│
├── docs/                           ← PDF documentation
├── docker-compose.yml
├── .env.example
├── README.md
└── CONTRIBUTING.md                 ← you are here
```
---
Questions?
Open a Discussion on GitHub — not an Issue. Issues are for bugs and feature requests only.
If you are stuck setting up locally, paste your `docker-compose logs` output in the Discussion and someone from the team will help.
---
Thank you for contributing to CivyX AI. Every improvement you make helps a citizen in Uttar Pradesh get their voice heard.
"Har Awaaz Ek Badlav."
