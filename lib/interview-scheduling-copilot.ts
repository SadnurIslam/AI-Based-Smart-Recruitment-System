import { callMcpTool, isMcpConfigured, type McpToolCallResult } from "@/lib/mcp-client";
import { sendInterviewInvite } from "@/lib/mailer";

type CandidateForScheduling = {
  applicationId: string;
  name: string;
  email: string;
  aiScore: number;
};

type ScheduleInterviewsInput = {
  companyName: string;
  jobTitle: string;
  jobId: string;
  recruiterName: string;
  startDate: string;
  endDate: string;
  timezone: string;
  durationMinutes: number;
  customMessage?: string;
  candidates: CandidateForScheduling[];
};

export type ScheduledInterviewOutcome = {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  timezone: string;
  meetingUrl?: string;
  mcpEventId?: string;
  mcpTrace?: string;
  emailDelivered: boolean;
  emailNote: string;
};

export type ScheduleInterviewsResult = {
  mode: "mcp" | "fallback";
  notes: string[];
  outcomes: ScheduledInterviewOutcome[];
};

type Slot = {
  start: Date;
  end: Date;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }

  if (typeof value === "string") {
    const fromString = new Date(value);
    return Number.isNaN(fromString.getTime()) ? null : fromString;
  }

  return null;
}

function parsePotentialJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getSlotArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  const keys = ["slots", "availability", "freeSlots", "timeSlots", "items"];
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function slotFromUnknown(value: unknown, durationMinutes: number): Slot | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const start =
    parseDateValue(record.start) ||
    parseDateValue(record.startTime) ||
    parseDateValue(record.start_time) ||
    parseDateValue(record.from);

  const end =
    parseDateValue(record.end) ||
    parseDateValue(record.endTime) ||
    parseDateValue(record.end_time) ||
    parseDateValue(record.to);

  if (!start) {
    return null;
  }

  return {
    start,
    end: end ?? new Date(start.getTime() + durationMinutes * 60_000),
  };
}

function extractSlots(result: McpToolCallResult, durationMinutes: number): Slot[] {
  const fromStructured = getSlotArray(result.structuredContent)
    .map((item) => slotFromUnknown(item, durationMinutes))
    .filter((item): item is Slot => Boolean(item));

  if (fromStructured.length) {
    return fromStructured;
  }

  if (result.text) {
    const parsed = parsePotentialJson(result.text);
    const fromText = getSlotArray(parsed)
      .map((item) => slotFromUnknown(item, durationMinutes))
      .filter((item): item is Slot => Boolean(item));

    if (fromText.length) {
      return fromText;
    }
  }

  return [];
}

function extractEventData(result: McpToolCallResult) {
  const record = asRecord(result.structuredContent) ?? asRecord(parsePotentialJson(result.text));

  if (!record) {
    return {
      eventId: undefined,
      meetingUrl: undefined,
    };
  }

  const eventIdCandidates = [record.eventId, record.event_id, record.id];
  const meetingUrlCandidates = [
    record.meetingUrl,
    record.meeting_url,
    record.meetingLink,
    record.meetLink,
    record.hangoutLink,
    record.htmlLink,
    record.url,
  ];

  const eventId = eventIdCandidates.find((item): item is string => typeof item === "string");
  const meetingUrl = meetingUrlCandidates.find((item): item is string => typeof item === "string");

  return {
    eventId,
    meetingUrl,
  };
}

function createFallbackSlots(startDate: string, count: number, durationMinutes: number): Slot[] {
  const base = parseDateValue(`${startDate}T10:00:00`) ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
  const gapMinutes = 15;

  return Array.from({ length: count }, (_, index) => {
    const start = new Date(
      base.getTime() + index * (durationMinutes + gapMinutes) * 60_000
    );

    return {
      start,
      end: new Date(start.getTime() + durationMinutes * 60_000),
    };
  });
}

function formatInterviewTime(slot: Slot, timezone: string) {
  const start = slot.start.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  });

  const end = slot.end.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  });

  return `${start} - ${end} (${timezone})`;
}

function buildEmailBody(input: {
  candidateName: string;
  companyName: string;
  jobTitle: string;
  recruiterName: string;
  interviewTime: string;
  meetingUrl?: string;
  customMessage?: string;
}) {
  const meetingLine = input.meetingUrl
    ? `Meeting link: ${input.meetingUrl}`
    : "Meeting link will be shared by recruiter if needed.";

  return [
    `Dear ${input.candidateName},`,
    "",
    `Congratulations. You have been shortlisted for an interview at ${input.companyName}.`,
    `Position: ${input.jobTitle}`,
    `Interview schedule: ${input.interviewTime}`,
    meetingLine,
    "",
    input.customMessage || "Please reply to confirm your availability.",
    "",
    `Regards,`,
    `${input.recruiterName}`,
    `${input.companyName} Recruitment Team`,
  ].join("\n");
}

export async function scheduleInterviewsWithCopilot(
  input: ScheduleInterviewsInput
): Promise<ScheduleInterviewsResult> {
  const notes: string[] = [];
  const mcpEnabled = isMcpConfigured();

  if (!input.candidates.length) {
    return {
      mode: mcpEnabled ? "mcp" : "fallback",
      notes: ["No candidates available for scheduling."],
      outcomes: [],
    };
  }

  const mode: ScheduleInterviewsResult["mode"] = mcpEnabled ? "mcp" : "fallback";

  const findSlotsTool =
    process.env.MCP_CALENDAR_FIND_SLOTS_TOOL?.trim() || "google_calendar_find_slots";
  const createEventTool =
    process.env.MCP_CALENDAR_CREATE_EVENT_TOOL?.trim() || "google_calendar_create_event";
  const sendEmailTool =
    process.env.MCP_GMAIL_SEND_EMAIL_TOOL?.trim() || "gmail_send_email";

  let slots = createFallbackSlots(input.startDate, input.candidates.length, input.durationMinutes);

  if (mcpEnabled) {
    try {
      const slotResult = await callMcpTool(findSlotsTool, {
        jobId: input.jobId,
        title: `${input.companyName} Interview Scheduling`,
        startDate: input.startDate,
        endDate: input.endDate,
        timezone: input.timezone,
        durationMinutes: input.durationMinutes,
        count: input.candidates.length,
      });

      const parsedSlots = extractSlots(slotResult, input.durationMinutes);
      if (parsedSlots.length) {
        slots = parsedSlots;
      } else {
        notes.push("Calendar MCP did not return parseable slots, fallback slots used.");
      }
    } catch (error) {
      notes.push(
        `Calendar slot discovery failed (${error instanceof Error ? error.message : "Unknown error"}).`
      );
    }
  }

  const outcomes: ScheduledInterviewOutcome[] = [];

  for (const [index, candidate] of input.candidates.entries()) {
    const slot = slots[index] ?? createFallbackSlots(input.startDate, 1, input.durationMinutes)[0];

    let mcpEventId: string | undefined;
    let meetingUrl: string | undefined;
    let mcpTrace = "";

    if (mcpEnabled) {
      try {
        const eventResult = await callMcpTool(createEventTool, {
          title: `${input.jobTitle} Interview - ${candidate.name}`,
          description: `AI scheduling copilot created this interview event for ${candidate.name}.`,
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          timezone: input.timezone,
          attendees: [candidate.email],
          conference: "google_meet",
        });

        const eventData = extractEventData(eventResult);
        mcpEventId = eventData.eventId;
        meetingUrl = eventData.meetingUrl;
        mcpTrace = eventResult.text.slice(0, 1800);
      } catch (error) {
        notes.push(
          `Calendar event creation failed for ${candidate.email} (${error instanceof Error ? error.message : "Unknown error"}).`
        );
      }
    }

    const interviewTime = formatInterviewTime(slot, input.timezone);
    const emailSubject = `Interview Scheduled - ${input.jobTitle} (${input.companyName})`;
    const emailBody = buildEmailBody({
      candidateName: candidate.name,
      companyName: input.companyName,
      jobTitle: input.jobTitle,
      recruiterName: input.recruiterName,
      interviewTime,
      meetingUrl,
      customMessage: input.customMessage,
    });

    let emailDelivered = false;
    let emailNote = "";

    if (mcpEnabled) {
      try {
        const emailResult = await callMcpTool(sendEmailTool, {
          to: [candidate.email],
          subject: emailSubject,
          body: emailBody,
        });

        emailDelivered = !emailResult.isError;
        emailNote =
          emailResult.text ||
          (emailResult.isError
            ? "MCP Gmail tool reported an error."
            : "Interview email sent via MCP Gmail tool.");
      } catch (error) {
        emailNote = `MCP Gmail tool failed (${error instanceof Error ? error.message : "Unknown error"}).`;
      }
    }

    if (!emailDelivered) {
      const fallbackMail = await sendInterviewInvite({
        to: candidate.email,
        candidateName: candidate.name,
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        message: `${emailBody}\n\n[Fallback mailer used]`,
      });

      emailDelivered = fallbackMail.delivered;
      emailNote = `${emailNote} ${fallbackMail.note}`.trim();
    }

    outcomes.push({
      applicationId: candidate.applicationId,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      scheduledStart: slot.start,
      scheduledEnd: slot.end,
      timezone: input.timezone,
      meetingUrl,
      mcpEventId,
      mcpTrace,
      emailDelivered,
      emailNote,
    });
  }

  return {
    mode,
    notes,
    outcomes,
  };
}
