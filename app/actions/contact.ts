"use server";

import nodemailer from "nodemailer";
import { redirect } from "next/navigation";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(4000),
});

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function sendContactEmail(input: z.infer<typeof contactSchema>) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL?.trim() || gmailUser;

  if (!gmailUser || !gmailPassword || !recipient) {
    return {
      delivered: false,
      note: "Contact form saved as a simulated submission because email delivery is not configured.",
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
    from: `DevSpark Contact <${gmailUser}>`,
    to: recipient,
    replyTo: input.email,
    subject: `New inquiry from ${input.name}`,
    html: `
      <div style="font-family: Verdana, sans-serif; line-height: 1.6; color: #1e293b;">
        <h2 style="margin-bottom: 8px;">New contact message from DevSpark website</h2>
        <p style="margin: 0 0 6px;"><strong>Name:</strong> ${input.name}</p>
        <p style="margin: 0 0 6px;"><strong>Email:</strong> ${input.email}</p>
        <p style="margin: 16px 0 8px;"><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${input.message}</p>
      </div>
    `,
  });

  return {
    delivered: true,
    note: "Message sent successfully.",
  };
}

export async function sendContactMessageAction(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: asString(formData.get("name")),
    email: asString(formData.get("email")),
    message: asString(formData.get("message")),
  });

  if (!parsed.success) {
    redirect("/contact?status=invalid");
  }

  const result = await sendContactEmail(parsed.data);

  if (result.delivered) {
    redirect("/contact?status=sent");
  }

  redirect("/contact?status=simulated");
}