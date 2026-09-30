const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const pad = (value) => String(value).padStart(2, "0");

const parseClock = (value) => {
  const match = String(value).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toLowerCase();
  if (minutes > 59 || hours > 23 || (meridiem && hours > 12) || (!meridiem && hours < 0)) return null;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (meridiem === "pm" && hours !== 12) hours += 12;
  return { hours, minutes };
};

const datePhrase = (value) => {
  const match = String(value).toLowerCase().match(/\b(today|tomorrow|next\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday))\b/);
  return match?.[1] || null;
};

const resolveDate = (phrase, reference) => {
  const date = new Date(reference);
  date.setHours(0, 0, 0, 0);
  if (phrase === "tomorrow") {
    date.setDate(date.getDate() + 1);
    return date;
  }
  if (phrase === "today") return date;
  const weekday = phrase.replace(/^next\s+/, "");
  const target = weekdays.indexOf(weekday);
  if (target < 0) return null;
  let days = (target - date.getDay() + 7) % 7;
  if (phrase.startsWith("next ") && days === 0) days = 7;
  date.setDate(date.getDate() + days);
  return date;
};

const iso = (date) => date.toISOString();

const normalizeDateOnly = (value, reference = new Date()) => {
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const phrase = datePhrase(text);
  const date = phrase ? resolveDate(phrase, reference) : null;
  return date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : value;
};

const normalizeDateTime = (value, reference = new Date()) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime()) && /\d{4}-\d{2}-\d{2}/.test(String(value))) return direct.toISOString();
  const text = String(value).trim();
  const phrase = datePhrase(text);
  const clockMatch = text.match(/(?:at|from)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i) || text.match(/^(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)$/i);
  const dateMatch = text.match(/^(\d{4}-\d{2}-\d{2})\s+at\s+(.+)$/i);
  if (dateMatch) {
    const date = new Date(`${dateMatch[1]}T00:00:00`);
    const clock = parseClock(dateMatch[2]);
    if (!Number.isNaN(date.getTime()) && clock) {
      date.setHours(clock.hours, clock.minutes, 0, 0);
      return iso(date);
    }
  }
  if (phrase && !clockMatch) {
    const date = resolveDate(phrase, reference);
    if (date) return iso(date);
  }
  if (!clockMatch) return value;
  const date = phrase ? resolveDate(phrase, reference) : new Date(reference);
  const clock = parseClock(clockMatch[1]);
  if (!date || !clock) return value;
  date.setHours(clock.hours, clock.minutes, 0, 0);
  return iso(date);
};

const normalizeToolArgs = (name, input = {}) => {
  const args = { ...input };
  if (name === "createTask" && args.dueDate) args.dueDate = normalizeDateTime(args.dueDate);
  if (name === "createReminder" && args.remindAt) args.remindAt = normalizeDateTime(args.remindAt);
  if (name === "createProject" && args.deadline) args.deadline = normalizeDateTime(args.deadline);
  if (name === "createDailyPlan" && args.date) args.date = normalizeDateTime(args.date);
  if (name === "createEvent") {
    const range = String(args.startTime || "").match(/^(.*)\s+from\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+to\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)$/i);
    if (range) {
      args.startTime = normalizeDateTime(`${range[1]} at ${range[2]}`);
      args.endTime = normalizeDateTime(`${range[1]} at ${range[3]}`);
    } else {
      args.startTime = normalizeDateTime(args.startTime);
      args.endTime = normalizeDateTime(args.endTime, args.startTime ? new Date(args.startTime) : new Date());
    }
  }
  return args;
};

module.exports = { normalizeDateTime, normalizeDateOnly, normalizeToolArgs };
