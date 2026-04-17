function normalizeDate(input: Date | string | null | undefined) {
  if (!input) {
    return null;
  }

  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDate(input: Date | string | null | undefined) {
  const date = normalizeDate(input);
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function formatDateTime(
  input: Date | string | null | undefined,
  timezone?: string
) {
  const date = normalizeDate(input);
  if (!date) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(date);
}
