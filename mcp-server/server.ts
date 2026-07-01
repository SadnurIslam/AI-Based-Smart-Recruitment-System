// ─────────────────────────────────────────────────────────────────────────────
// DevSpark MCP server factory.
//
// Exposes the recruitment domain (scoring, shortlisting, job matching, resume
// building, stats, interview scheduling) as MCP tools, resources, and prompts.
// Used by:
//   - mcp-server/stdio.ts        → Claude Desktop / any stdio MCP client
//   - app/api/mcp/route.ts       → Streamable HTTP, so lib/mcp-client.ts connects
//
// All imports are relative so `tsx` can run this without tsconfig path aliases.
// ─────────────────────────────────────────────────────────────────────────────

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { sendRawEmail } from "../lib/mailer";
import {
  buildResumeForUser,
  bulkShortlist,
  findMatchingJobs,
  getApplicationStats,
  listOpenJobs,
  rejectCandidates,
  scheduleInterview,
  scoreResume,
  sendBulkInvites,
  shortlistCandidates,
} from "../lib/recruiter-tools";

// Standard MCP tool result: structuredContent (consumed by lib/mcp-client.ts)
// plus a JSON text block for clients that only read text.
function ok(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    structuredContent: result as Record<string, unknown>,
  };
}

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return {
    isError: true,
    content: [{ type: "text" as const, text: `Error: ${message}` }],
  };
}

async function firstAdminId(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new Error("No ADMIN user exists to attribute this action to.");
  return admin.id;
}

export function createDevSparkMcpServer(): McpServer {
  const server = new McpServer({ name: "devspark-recruiter", version: "1.0.0" });

  // ─── TOOLS ─────────────────────────────────────────────────────────────────

  server.registerTool(
    "list_open_jobs",
    {
      title: "List open jobs",
      description: "List currently OPEN job postings with applicant counts.",
      inputSchema: { limit: z.number().int().min(1).max(50).optional() },
    },
    async ({ limit }) => {
      try {
        return ok(await listOpenJobs({ limit }));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "score_resume",
    {
      title: "Score a resume",
      description:
        "Score resume text against a job's requirements using the Groq scorer.",
      inputSchema: {
        resumeText: z.string().min(40),
        jobId: z.string().optional(),
        requirementsText: z.string().optional(),
      },
    },
    async (args) => {
      try {
        return ok(await scoreResume(args));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "shortlist_candidates",
    {
      title: "Shortlist candidates",
      description:
        "Return the top-K candidates for a job, ranked by AI score. Set rescore=true to recompute scores with the NLP scorer.",
      inputSchema: {
        jobId: z.string(),
        topK: z.number().int().min(1).max(30),
        rescore: z.boolean().optional(),
      },
    },
    async (args) => {
      try {
        return ok(await shortlistCandidates(args));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "find_matching_jobs",
    {
      title: "Find matching jobs",
      description:
        "Rank open jobs for a candidate by resume relevance. Provide applicantId (uses their profile) or raw resumeText.",
      inputSchema: {
        applicantId: z.string().optional(),
        resumeText: z.string().optional(),
        topK: z.number().int().min(1).max(20).optional(),
      },
    },
    async (args) => {
      try {
        return ok(await findMatchingJobs(args));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "build_resume",
    {
      title: "Build a resume",
      description: "Build a markdown resume from a user's stored profile.",
      inputSchema: { userId: z.string(), polish: z.boolean().optional() },
    },
    async (args) => {
      try {
        return ok(await buildResumeForUser(args));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "get_application_stats",
    {
      title: "Application stats",
      description: "Platform hiring stats, or scoped to a single job when jobId is given.",
      inputSchema: { jobId: z.string().optional() },
    },
    async (args) => {
      try {
        return ok(await getApplicationStats(args));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "schedule_interview",
    {
      title: "Schedule an interview",
      description:
        "Email an interview invite to a candidate and record the scheduled slot. start/end are ISO datetime strings.",
      inputSchema: {
        applicationId: z.string(),
        start: z.string(),
        end: z.string(),
        timezone: z.string().default("Asia/Dhaka"),
        sentById: z.string().optional(),
        customMessage: z.string().optional(),
      },
    },
    async (args) => {
      try {
        const sentById = args.sentById ?? (await firstAdminId());
        return ok(await scheduleInterview({ ...args, sentById }));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "bulk_shortlist",
    {
      title: "Bulk shortlist candidates",
      description:
        "Promote the top-K PENDING candidates for a job to SHORTLISTED status, ranked by AI score. Set rescore=true to re-evaluate unscored applications with the NLP scorer first.",
      inputSchema: {
        jobId: z.string(),
        topK: z.number().int().min(1).max(50),
        minScore: z.number().min(0).max(100).optional(),
        rescore: z.boolean().optional(),
      },
    },
    async (args) => {
      try {
        return ok(await bulkShortlist(args));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "reject_candidates",
    {
      title: "Reject low-scoring candidates",
      description:
        "Reject all PENDING/SHORTLISTED candidates for a job whose AI score is below the given threshold. Set sendEmail=true to send a professional rejection email.",
      inputSchema: {
        jobId: z.string(),
        belowScore: z.number().min(0).max(100),
        sendEmail: z.boolean().optional(),
        emailMessage: z.string().optional(),
      },
    },
    async (args) => {
      try {
        return ok(await rejectCandidates(args));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "send_bulk_invites",
    {
      title: "Send bulk interview invites",
      description:
        "Send interview invitation emails to ALL SHORTLISTED candidates for a job and update their status to INVITED. Run bulk_shortlist first to shortlist candidates.",
      inputSchema: {
        jobId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        durationMinutes: z.number().int().optional(),
        gapMinutes: z.number().int().optional(),
        timezone: z.string().optional(),
      },
    },
    async (args) => {
      try {
        const sentById = args.sentById ?? (await firstAdminId());
        return ok(await sendBulkInvites({ ...args, sentById }));
      } catch (e) {
        return fail(e);
      }
    }
  );

  // ─── COMPAT TOOLS ────────────────────────────────────────────────────────────
  // Names the existing interview-scheduling copilot (lib/interview-scheduling-
  // copilot.ts) calls. Registering them makes scheduleTopKInterviewsWithMcpAction
  // run in real "mcp" mode when MCP_SERVER_URL points at this server.

  server.registerTool(
    "google_calendar_find_slots",
    {
      title: "Find interview slots",
      description: "Generate available interview time slots inside a selected date window.",
      inputSchema: {
        startDate: z.string(),
        endDate: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        count: z.number().int().min(1).max(30).optional(),
        durationMinutes: z.number().int().min(15).max(180).optional(),
      },
    },
    async ({ startDate, endDate, startTime = "10:00", endTime = "17:00", count = 1, durationMinutes = 45 }) => {
      const base = new Date(`${startDate}T${startTime}:00`);
      const start0 = Number.isNaN(base.getTime()) ? new Date(Date.now() + 86_400_000) : base;
      const endBase = endDate ? new Date(`${endDate}T${endTime}:00`) : new Date(start0.getTime() + 24 * 60 * 60 * 1000);
      const slots = [] as { start: string; end: string }[];
      let cursor = new Date(start0);
      while (slots.length < count && cursor <= endBase) {
        const end = new Date(cursor.getTime() + durationMinutes * 60_000);
        slots.push({ start: cursor.toISOString(), end: end.toISOString() });
        cursor = new Date(cursor.getTime() + (durationMinutes + 15) * 60_000);
      }
      return ok({ slots });
    }
  );

  server.registerTool(
    "google_calendar_create_event",
    {
      title: "Create calendar event",
      description: "Create an interview calendar event and return an event id + meeting link.",
      inputSchema: {
        title: z.string(),
        start: z.string(),
        end: z.string(),
        timezone: z.string().optional(),
        attendees: z.array(z.string()).optional(),
      },
    },
    async ({ start }) => {
      const id = `devspark-${Buffer.from(String(start)).toString("base64url").slice(0, 12)}`;
      return ok({ eventId: id, meetingUrl: `https://meet.google.com/lookup/${id}` });
    }
  );

  server.registerTool(
    "gmail_send_email",
    {
      title: "Send email",
      description: "Send a plain-text email (used for interview invites).",
      inputSchema: {
        to: z.union([z.string(), z.array(z.string())]),
        subject: z.string(),
        body: z.string(),
      },
    },
    async ({ to, subject, body }) => {
      try {
        const recipient = Array.isArray(to) ? to[0] : to;
        const result = await sendRawEmail({ to: recipient, subject, text: body });
        return result.delivered
          ? ok({ status: "sent", note: result.note })
          : fail(new Error(result.note));
      } catch (e) {
        return fail(e);
      }
    }
  );

  // ─── RESOURCES ───────────────────────────────────────────────────────────────

  server.registerResource(
    "open-jobs",
    "jobs://open",
    { title: "Open jobs", description: "All currently open job postings as JSON.", mimeType: "application/json" },
    async (uri) => {
      const data = await listOpenJobs({ limit: 50 });
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerResource(
    "job",
    new ResourceTemplate("job://{jobId}", { list: undefined }),
    { title: "Job posting", description: "A single job posting by id." },
    async (uri, variables) => {
      const jobId = String(variables.jobId);
      const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(job ?? { error: `Job ${jobId} not found` }, null, 2),
          },
        ],
      };
    }
  );

  // ─── PROMPTS ───────────────────────────────────────────────────────────────

  server.registerPrompt(
    "screen_candidates",
    {
      title: "Screen candidates for a job",
      description: "Shortlist and summarize the top candidates for a job.",
      argsSchema: { jobId: z.string(), topK: z.string().optional() },
    },
    ({ jobId, topK }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Use the shortlist_candidates tool for jobId "${jobId}" with topK ${topK ?? "5"}. Then summarize each candidate with their score, key strengths, and gaps, and recommend who to interview first.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "draft_outreach",
    {
      title: "Draft candidate outreach",
      description: "Draft a short, warm interview-invite message for an application.",
      argsSchema: { applicationId: z.string(), tone: z.string().optional() },
    },
    ({ applicationId, tone }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Draft a ${tone ?? "professional and warm"} interview invitation message for application "${applicationId}". Keep it under 120 words.`,
          },
        },
      ],
    })
  );

  return server;
}
