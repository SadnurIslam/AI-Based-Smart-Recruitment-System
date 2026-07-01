import nodemailer from "nodemailer";
import { Resend } from "resend";

type InviteMailInput = {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewTime?: string;
  meetingUrl?: string;
  message?: string;
};

type MailResult = {
  delivered: boolean;
  note: string;
};

function htmlTemplate(input: InviteMailInput) {
  const interviewTimeLine = input.interviewTime
    ? `<p style="margin: 8px 0;">Interview time: ${input.interviewTime}</p>`
    : "";
  const meetingLine = input.meetingUrl
    ? `<p style="margin: 8px 0;">Meeting link: <a href="${input.meetingUrl}" style="color: #0f766e;">${input.meetingUrl}</a></p>`
    : "";
  const optionalMessage = input.message
    ? `<p style=\"margin: 12px 0;\">${input.message}</p>`
    : "";

  return `
  <div style="font-family: Verdana, sans-serif; line-height: 1.5; color: #1e293b;">
    <h2 style="margin-bottom: 0;">Interview Invitation - ${input.companyName}</h2>
    <p style="margin-top: 4px; color: #475569;">Position: ${input.jobTitle}</p>
    <p>Dear ${input.candidateName},</p>
    <p>Congratulations. Based on our AI-powered screening, your profile is shortlisted for an interview round.</p>
    ${interviewTimeLine}
    ${meetingLine}
    ${optionalMessage}
    <p>Reply to this email to confirm your availability.</p>
    <p>Regards,<br/>Recruitment Team<br/>${input.companyName}</p>
  </div>
  `;
}

function plainTextTemplate(input: InviteMailInput) {
  const lines = [
    `Dear ${input.candidateName},`,
    "",
    `Congratulations. You have been shortlisted for ${input.jobTitle} at ${input.companyName}.`,
    input.interviewTime ? `Interview time: ${input.interviewTime}` : "",
    input.meetingUrl ? `Meeting link: ${input.meetingUrl}` : "",
    input.message || "",
    "",
    "Please reply to confirm your availability.",
    "",
    `Regards,`,
    `Recruitment Team`,
    `${input.companyName}`,
  ];

  return lines.filter(Boolean).join("\n");
}

export async function sendInterviewInvite(input: InviteMailInput): Promise<MailResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM?.trim();
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (resendApiKey && resendFrom) {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: resendFrom,
        to: input.to,
        subject: `Interview Invitation - ${input.jobTitle}`,
        html: htmlTemplate(input),
        text: plainTextTemplate(input),
      });

      return {
        delivered: true,
        note: "Interview invitation sent successfully via Resend.",
      };
    } catch (error) {
      return {
        delivered: false,
        note: `Resend delivery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  if (!gmailUser || !gmailPassword) {
    return {
      delivered: false,
      note: "Invite email simulated. Set GMAIL_USER and GMAIL_APP_PASSWORD to send real emails.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.sendMail({
      from: `DevSpark Recruitment <${gmailUser}>`,
      to: input.to,
      subject: `Interview Invitation - ${input.jobTitle}`,
      html: htmlTemplate(input),
      text: plainTextTemplate(input),
    });

    return {
      delivered: true,
      note: "Interview invitation sent successfully.",
    };
  } catch (error) {
    return {
      delivered: false,
      note: `Invite email simulated because SMTP delivery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Generic plain-text send, used by the MCP `send_email` tool so the interview
// scheduling copilot can deliver real emails when it runs in MCP mode. Falls
// back to a simulated result when Gmail credentials are not configured.
export async function sendRawEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<MailResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM?.trim();
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (resendApiKey && resendFrom) {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: resendFrom,
        to: input.to,
        subject: input.subject,
        text: input.text,
      });

      return { delivered: true, note: "Email sent via Resend." };
    } catch (error) {
      return {
        delivered: false,
        note: `Email simulated because Resend delivery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  if (!gmailUser || !gmailPassword) {
    return {
      delivered: false,
      note: "Email simulated (no GMAIL_USER / GMAIL_APP_PASSWORD configured).",
    };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    auth: { user: gmailUser, pass: gmailPassword },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.sendMail({
      from: `DevSpark Recruitment <${gmailUser}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });

    return { delivered: true, note: "Email sent via Gmail." };
  } catch (error) {
    return {
      delivered: false,
      note: `Email simulated because SMTP delivery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export function buildInterviewInviteMessage(input: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewTime: string;
  meetingUrl?: string;
  customMessage?: string;
}) {
  return [
    `Dear ${input.candidateName},`,
    "",
    `You are invited for the post of ${input.jobTitle} at ${input.companyName}.`,
    `Interview time: ${input.interviewTime}`,
    input.meetingUrl ? `Meeting link: ${input.meetingUrl}` : "",
    input.customMessage || "We look forward to speaking with you.",
    "",
    `Regards,`,
    `${input.companyName} Recruitment Team`,
  ]
    .filter(Boolean)
    .join("\n");
}
