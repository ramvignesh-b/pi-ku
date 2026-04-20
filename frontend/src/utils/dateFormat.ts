const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeStyle: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
});

const rtf = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatRelativeDate(input: Date | string | number) {
  if (!input) return "";
  const date = new Date(input);
  const now = new Date();

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / dayMs,
  );

  const time = timeFormatter.format(date);

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === -1) return `Yesterday, ${time}`;
  if (diffDays > -7) return `${rtf.format(diffDays, "day")}, ${time}`;

  return dateTimeFormatter.format(date);
}

export function formateRelativeDateWithoutTime(input: Date | string | number) {
  if (!input) return "";
  const date = new Date(input);
  const now = new Date();

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / dayMs,
  );

  if (diffDays === 0) return `Today`;
  if (diffDays === -1) return `Yesterday`;
  if (diffDays > -7) return `${rtf.format(diffDays, "day")}`;

  return date.toDateString();
}

export function formatDate(input: Date | string | number) {
  if (!input) return "";
  const date = new Date(input);

  return dateFormatter.format(date);
}
