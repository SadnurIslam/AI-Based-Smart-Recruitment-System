# DevSpark AI Smart Recruitment System

Full-stack university project built with Next.js App Router, Prisma, NextAuth, and Tailwind CSS.

The system helps DevSpark hire faster by:

- Publishing recruitment circulars for multiple roles
- Allowing applicants to register and maintain profile data
- Supporting CV apply with upload/paste or AI resume builder
- Calculating AI matching score for each application
- Letting recruiter/admin select top-k candidates
- Sending interview invitations using Gmail SMTP
- Auto-scheduling top-k interviews using MCP Calendar and MCP Gmail tools

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS v4
- Backend: Next.js Server Actions + API Routes
- Database: Prisma + SQLite (local demo)
- Auth: NextAuth (credentials + Google OAuth)
- AI matching: custom semantic + keyword scoring engine
- Email: Nodemailer (Gmail app password)
- MCP integration: @modelcontextprotocol/sdk client with Streamable HTTP or SSE transport

## Main Features Implemented

1. Public Pages
- Home, About Company, Careers, Contact, Jobs list, Job details

2. Authentication
- Manual account creation and login (email/password)
- Gmail login via Google OAuth (when credentials are configured)

3. Applicant Flow
- Applicant dashboard with profile completion and application tracking
- Profile update page
- AI resume builder from profile data
- Apply with:
	- AI-generated resume draft
	- Uploaded text CV file (.txt/.md)
	- Pasted CV text

4. Recruiter/Admin Flow
- Create and publish circulars
- View applications with AI score
- Select top-k candidates
- Send interview invitation emails
- AI Interview Scheduling Copilot (MCP): find slots, create calendar events, and send schedule emails

5. Admin Analytics
- User, job, application, invite metrics
- Top AI-scored applicants view
- Scheduled interview analytics and MCP scheduling feedback

## AI Scoring Logic (Project Scope)

Current scoring combines:

- Semantic cosine similarity between CV and requirement text
- Requirement keyword coverage ratio
- Resume structure bonus

Final score is normalized to a 0-100 range and stored per application.

## Project Structure (Important)

- app/actions/recruitment.ts: all main recruitment server actions
- app/dashboard/*: role-based dashboards
- app/jobs/*: circular listing + apply flow
- lib/ai-scoring.ts: AI score engine
- lib/resume-builder.ts: profile-to-resume generator
- lib/mailer.ts: Gmail invitation sender
- lib/mcp-client.ts: generic MCP client helper
- lib/interview-scheduling-copilot.ts: MCP interview scheduling orchestration
- prisma/schema.prisma: full DB schema
- prisma/seed.ts: demo users/jobs/applications seed

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Setup environment

```bash
copy .env.example .env
```

Update `.env` values as needed.

3. Create DB + run migrations + seed

```bash
npm run db:migrate -- --name init
```

4. Start development server

```bash
npm run dev
```

Open `http://localhost:3000`

## Demo Accounts (Seeded)

- Admin: `admin@devspark.com` / `Admin@123`
- Recruiter: `recruiter@devspark.com` / `Recruit@123`
- Applicant: `applicant@example.com` / `Applicant@123`

## Environment Variables

Required for local:

- `DATABASE_URL=file:./dev.db`
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET=your-random-secret`

Optional for Gmail OAuth login:

- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`

Optional for interview email delivery:

- `GMAIL_USER=your-gmail@gmail.com`
- `GMAIL_APP_PASSWORD=your-gmail-app-password`

If Gmail SMTP is not configured, invite sending is simulated and still logged in DB.

Optional for MCP interview scheduling copilot:

- `MCP_SERVER_URL=https://your-mcp-server-url`
- `MCP_TRANSPORT=streamable-http` (or `sse`)
- `MCP_AUTH_TOKEN=...` (if your MCP server requires bearer auth)
- `MCP_API_KEY=...` (if your MCP server uses API key header)
- `MCP_CALENDAR_FIND_SLOTS_TOOL=google_calendar_find_slots`
- `MCP_CALENDAR_CREATE_EVENT_TOOL=google_calendar_create_event`
- `MCP_GMAIL_SEND_EMAIL_TOOL=gmail_send_email`
- `MCP_DEFAULT_TIMEZONE=Asia/Dhaka`

When MCP is configured, recruiter/admin dashboard can schedule top-k interviews automatically.
If MCP tools fail, the flow falls back to local scheduling logic and SMTP invitation fallback.

## Scripts

- `npm run dev`: run development server
- `npm run build`: production build check
- `npm run lint`: eslint check
- `npm run db:migrate`: run prisma migrations
- `npm run db:seed`: seed demo data
- `npm run db:studio`: open prisma studio

## Deploy to Vercel (Free)

Recommended steps:

1. Push this project to GitHub
2. Import project in Vercel
3. Use managed Postgres for production (Neon/Supabase free tier)
4. Update Prisma datasource in `prisma/schema.prisma` for Postgres
5. Set Vercel environment variables (`NEXTAUTH_*`, `GOOGLE_*`, `GMAIL_*`, `DATABASE_URL`)
6. Run migration in production database

Note: SQLite is suitable for local demo; Postgres is recommended for hosted deployment.

## MCP Feature Demo Steps

1. Configure MCP variables in `.env`.
2. Ensure your MCP server exposes calendar and gmail tools with names matching configured variables.
3. Log in as recruiter/admin.
4. Open recruiter dashboard and use `AI Interview Scheduling Copilot (MCP Calendar + Gmail)` per circular.
5. Check results in recruiter/admin banners and applicant dashboard interview slot column.
