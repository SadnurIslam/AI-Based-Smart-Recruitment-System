import type { UserProfile } from "@prisma/client";

type ResumeBuilderInput = {
  user: {
    name?: string | null;
    email?: string | null;
  };
  profile: UserProfile;
};

function toLines(raw: string | null | undefined) {
  if (!raw) {
    return [];
  }

  return raw
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function list(lines: string[]) {
  if (!lines.length) {
    return "- Not provided yet";
  }

  return lines.map((line) => `- ${line}`).join("\n");
}

function smartSummary(profile: UserProfile) {
  if (profile.summary && profile.summary.trim().length > 0) {
    return profile.summary.trim();
  }

  const skills = toLines(profile.skills).slice(0, 4).join(", ");
  const headline = profile.headline?.trim() || "Aspiring software professional";

  if (skills) {
    return `${headline} with practical experience in ${skills}. Focused on delivering measurable outcomes in collaborative environments.`;
  }

  return `${headline} passionate about continuous learning and delivering reliable software solutions.`;
}

export function buildResumeFromProfile({ user, profile }: ResumeBuilderInput) {
  const name = user.name || "Candidate";
  const contactBits = [user.email, profile.phone, profile.location]
    .filter(Boolean)
    .join(" | ");

  return [
    `# ${name}`,
    contactBits,
    "",
    "## Professional Summary",
    smartSummary(profile),
    "",
    "## Core Skills",
    list(toLines(profile.skills)),
    "",
    "## Experience Highlights",
    list(toLines(profile.experience)),
    "",
    "## Education",
    list(toLines(profile.education)),
    "",
    "## Projects",
    list(toLines(profile.projects)),
    "",
    "## Certifications",
    list(toLines(profile.certifications)),
    "",
    "## Profiles",
    list([profile.linkedin, profile.github].filter(Boolean) as string[]),
  ].join("\n");
}
