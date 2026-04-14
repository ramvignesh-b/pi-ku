const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const rtf = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatRelativeDate(input: Date | string | number) {
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
