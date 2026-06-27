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
- Database: Prisma + SQLite locally, PostgreSQL (Supabase) for production
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

For Supabase production, set `DATABASE_PROVIDER=postgresql` and use `DATABASE_URL` plus `DIRECT_URL` from the Supabase database connection settings.

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

Required for local development and production deployment:

- `DATABASE_PROVIDER=sqlite` for local or `DATABASE_PROVIDER=postgresql` for Supabase
- `DATABASE_URL=postgresql://...`
- `DIRECT_URL=postgresql://...`
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

## What You Need To Fill Manually

Use this as the deployment checklist when you set up Google login, Supabase, Gmail, and MCP.

### Database and Deployment

- `DATABASE_PROVIDER`: set to `sqlite` for local development, or `postgresql` for Supabase production.
- `DATABASE_URL`: copy the pooled database connection string from Supabase.
- `DIRECT_URL`: copy the direct database connection string from Supabase.
- `NEXTAUTH_URL`: set to your deployed app URL on Vercel, for example `https://your-app.vercel.app`.
- `NEXTAUTH_SECRET`: generate a long random secret yourself.

### Google Login

- `GOOGLE_CLIENT_ID`: get this from Google Cloud Console after creating an OAuth 2.0 client.
- `GOOGLE_CLIENT_SECRET`: get this from the same Google OAuth client.
- In Google Cloud Console, add authorized redirect URIs for NextAuth, usually `https://your-domain.com/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google` for local testing.

### Gmail Email Sending

- `GMAIL_USER`: your Gmail address that sends interview emails.
- `GMAIL_APP_PASSWORD`: the Gmail app password generated from your Google account, not your normal Gmail password.
- `CONTACT_RECIPIENT_EMAIL`: optional; where contact form messages should go. If blank, it falls back to `GMAIL_USER`.

### MCP Interview Scheduling

- `MCP_SERVER_URL`: the URL of your MCP server.
- `MCP_TRANSPORT`: set to `streamable-http` or `sse` depending on your server.
- `MCP_AUTH_TOKEN`: bearer token if your MCP server requires authorization.
- `MCP_API_KEY`: API key header if your MCP server expects one.
- `MCP_CALENDAR_FIND_SLOTS_TOOL`: tool name on your MCP server for finding calendar slots.
- `MCP_CALENDAR_CREATE_EVENT_TOOL`: tool name on your MCP server for creating calendar events.
- `MCP_GMAIL_SEND_EMAIL_TOOL`: tool name on your MCP server for sending emails.
- `MCP_DEFAULT_TIMEZONE`: your preferred timezone for interview scheduling.

If you are not using Google login or MCP yet, you can leave those values blank and the app will still run with manual login and fallback flows.

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
3. Create a Supabase PostgreSQL project
4. Set `DATABASE_PROVIDER=postgresql` in Vercel
5. Copy the Supabase pooled connection string into `DATABASE_URL`
6. Copy the direct connection string into `DIRECT_URL`
7. Set Vercel environment variables (`NEXTAUTH_*`, `GOOGLE_*`, `GMAIL_*`, `CONTACT_RECIPIENT_EMAIL`, `DATABASE_PROVIDER`, `DATABASE_URL`, `DIRECT_URL`)
8. Run `npm run db:deploy:pg` against the Supabase database before or during deployment

Note: local development stays on SQLite by default. Production uses the Postgres schema when `DATABASE_PROVIDER=postgresql` is set.

## MCP Feature Demo Steps

1. Configure MCP variables in `.env`.
2. Ensure your MCP server exposes calendar and gmail tools with names matching configured variables.
3. Log in as recruiter/admin.
4. Open recruiter dashboard and use `AI Interview Scheduling Copilot (MCP Calendar + Gmail)` per circular.
5. Check results in recruiter/admin banners and applicant dashboard interview slot column.
