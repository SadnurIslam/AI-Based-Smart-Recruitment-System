import nodemailer from "nodemailer";

type InviteMailInput = {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  message?: string;
};

type MailResult = {
  delivered: boolean;
  note: string;
};

function htmlTemplate(input: InviteMailInput) {
  const optionalMessage = input.message
    ? `<p style=\"margin: 12px 0;\">${input.message}</p>`
    : "";

  return `
  <div style="font-family: Verdana, sans-serif; line-height: 1.5; color: #1e293b;">
    <h2 style="margin-bottom: 0;">Interview Invitation - ${input.companyName}</h2>
    <p style="margin-top: 4px; color: #475569;">Position: ${input.jobTitle}</p>
    <p>Dear ${input.candidateName},</p>
    <p>Congratulations. Based on our AI-powered screening, your profile is shortlisted for an interview round.</p>
    ${optionalMessage}
    <p>Reply to this email to confirm your availability.</p>
    <p>Regards,<br/>Recruitment Team<br/>${input.companyName}</p>
  </div>
  `;
}

export async function sendInterviewInvite(input: InviteMailInput): Promise<MailResult> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    return {
      delivered: false,
      note: "Invite email simulated. Set GMAIL_USER and GMAIL_APP_PASSWORD to send real emails.",
    };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  await transporter.sendMail({
    from: `DevSpark Recruitment <${gmailUser}>`,
    to: input.to,
    subject: `Interview Invitation - ${input.jobTitle}`,
    html: htmlTemplate(input),
  });

  return {
    delivered: true,
    note: "Interview invitation sent successfully.",
  };
}

// Generic plain-text send, used by the MCP `send_email` tool so the interview
// scheduling copilot can deliver real emails when it runs in MCP mode. Falls
// back to a simulated result when Gmail credentials are not configured.
export async function sendRawEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<MailResult> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    return {
      delivered: false,
      note: "Email simulated (no GMAIL_USER / GMAIL_APP_PASSWORD configured).",
    };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPassword },
  });

  await transporter.sendMail({
    from: `DevSpark Recruitment <${gmailUser}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });

  return { delivered: true, note: "Email sent via Gmail." };
}
