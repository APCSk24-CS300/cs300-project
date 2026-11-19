const LANDING_TIME_ZONE = "Asia/Ho_Chi_Minh";

type DateParts = {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
};

function getParts(value: Date): DateParts | null {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LANDING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    day: get("day"),
    month: get("month"),
    year: get("year"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function toDate(parts: DateParts): string {
  return `${parts.day}/${parts.month}/${parts.year}`;
}

function toTime(parts: DateParts): string {
  return `${Number(parts.hour)}:${parts.minute}`;
}

export function formatActivityTime(start: Date, end: Date): string {
  const startParts = getParts(start);
  const endParts = getParts(end);

  if (!startParts || !endParts) {
    return "Invalid date";
  }

  const sameDay =
    startParts.day === endParts.day &&
    startParts.month === endParts.month &&
    startParts.year === endParts.year;

  if (sameDay) {
    return `${toDate(startParts)}, ${toTime(startParts)} - ${toTime(endParts)}`;
  }

  return `${toDate(startParts)} ${toTime(startParts)} - ${toDate(endParts)} ${toTime(endParts)}`;
}
