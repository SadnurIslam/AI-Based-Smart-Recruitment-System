# DevSpark — AI-Powered Recruitment Platform

> AI-powered recruitment platform built with **Next.js 16**, **React 19**, **Prisma**, **Supabase**, **NextAuth**, **Groq LLM API**, and **Model Context Protocol (MCP)**.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)
![Groq](https://img.shields.io/badge/Groq-LLM-orange)

## Table of Contents
- Overview
- Features
- AI Features
- Tech Stack
- Architecture
- Project Structure
- Installation
- Environment Variables
- Demo Accounts
- Deployment
- Roadmap

## Overview
DevSpark is a full-stack recruitment platform developed as a university capstone project. It automates recruitment by combining LLM-powered resume processing, AI applicant scoring, recruiter workflows, email notifications, and interview scheduling.

## Features

### Public
- Home, About, Careers, Contact
- Job listings and details

### Authentication
- Email/password login
- Google OAuth

### Applicant
- Profile management
- AI Resume Builder (Groq LLM)
- Apply using AI-generated resume, uploaded text CV, or pasted resume
- Application tracking

### Recruiter
- Create and publish job circulars
- View AI applicant scores
- Shortlist Top-K applicants
- Send interview invitations
- AI Interview Scheduling Copilot

### Admin
- Analytics dashboard
- User and job management
- AI recruitment insights

## AI Features

### AI Resume Builder
Generates ATS-friendly resumes from applicant profiles using the Groq API.

### AI Resume Analysis
Extracts and analyzes skills, education, projects, and experience from resumes.

### AI Applicant Matching
Compares resumes against job requirements using LLM-based semantic analysis and structured scoring.

### AI Interview Scheduling
Uses MCP Calendar and Gmail tools to schedule interviews automatically. Falls back to local scheduling when MCP is unavailable.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend | Next.js Server Actions, API Routes |
| Database | Prisma, SQLite, PostgreSQL (Supabase) |
| Authentication | NextAuth, Credentials, Google OAuth |
| AI | Groq API, LLM-powered resume generation & matching |
| Email | RESEND |
| Automation | MCP Calendar & Gmail |

## Architecture

```text
Applicant -> Resume -> Groq LLM -> AI Score -> Recruiter Dashboard
                                      |
                                      +-> Resume Builder
Recruiter -> MCP Calendar -> Gmail -> Interview Invitations
```

## Installation

```bash
git clone https://github.com/your-username/devspark.git
cd devspark
npm install
cp .env.example .env
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

## Environment Variables

Required:
- DATABASE_PROVIDER
- DATABASE_URL
- DIRECT_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- GROQ_API_KEY

Optional:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GMAIL_USER
- GMAIL_APP_PASSWORD
- CONTACT_RECIPIENT_EMAIL
- MCP_SERVER_URL
- MCP_TRANSPORT
- MCP_AUTH_TOKEN
- MCP_API_KEY
- MCP_CALENDAR_FIND_SLOTS_TOOL
- MCP_CALENDAR_CREATE_EVENT_TOOL
- MCP_GMAIL_SEND_EMAIL_TOOL
- MCP_DEFAULT_TIMEZONE

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@devspark.com | Admin@123 |
| Recruiter | recruiter@devspark.com | Recruit@123 |
| Applicant | applicant@example.com | Applicant@123 |

## Deployment
1. Push to GitHub.
2. Import into Vercel.
3. Create a Supabase PostgreSQL project.
4. Configure environment variables.
5. Run production migrations.
6. Deploy.

## Roadmap
- PDF resume parsing
- OCR support
- AI interview question generation
- Multi-company support
- Real-time notifications

## License
Developed as a university capstone project for educational purposes.
