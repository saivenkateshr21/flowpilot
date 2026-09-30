# FlowPilot AI

Backend-first productivity API built with Express, MongoDB/Mongoose, JWT, and Groq.

## Run

```powershell
cd backend
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default. Credentials live in `backend/.env`, which is ignored by Git.

## API groups

- Auth: register, login, me, refresh, logout, profile, change-password
- CRUD: `/api/tasks`, `/api/notes`, `/api/projects`, `/api/reminders`, `/api/events`, `/api/daily-plans`
- Task shortcuts: `PATCH /api/tasks/:id/status`, `PATCH /api/tasks/:id/priority`
- List endpoints support `page`, `limit`, `search`, `status`, `priority`, `category`, and `dueDate=today` where applicable
- `GET /api/dashboard`, `/api/analytics/productivity`, `/api/analytics/tasks`
- `GET /api/search?q=...` searches tasks, notes, projects, events, and reminders
- AI: chat, agent tools, task creation, planning, prioritization, summarization, productivity analysis
- AI conversations: `/api/ai/conversations`
- `GET /api/health` includes database status
- API documentation: `GET /api-docs` or `/api-docs/openapi.json`

Protected endpoints require `Authorization: Bearer <token>`.

Security includes Helmet, auth/AI rate limits, Mongoose validation, ownership-scoped queries, and role middleware for future admin routes. A reminder scheduler runs every minute after MongoDB connects and reports due reminders for a future notification provider.
