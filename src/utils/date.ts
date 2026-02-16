import { addDays, addWeeks, addMonths, parseISO, isAfter, isBefore } from "date-fns";
import type { Event } from "@/types/database";

/**
 * Expand recurring events into individual occurrences within a date range.
 * Returns the original event + all generated occurrences (with composite IDs).
 */
export function expandRecurringEvents(
  events: Event[],
  startDate: Date,
  endDate: Date
): Event[] {
  const expanded: Event[] = [];

  for (const ev of events) {
    expanded.push(ev);
    if (!ev.recurrence) continue;

    const duration =
      new Date(ev.end_time).getTime() - new Date(ev.start_time).getTime();
    const recEnd = ev.recurrence_end ? parseISO(ev.recurrence_end) : endDate;
    let cursor = parseISO(ev.start_time);
    let safety = 0;

    while (safety++ < 500) {
      cursor =
        ev.recurrence === "daily"
          ? addDays(cursor, 1)
          : ev.recurrence === "weekly"
          ? addWeeks(cursor, 1)
          : addMonths(cursor, 1);

      if (isAfter(cursor, recEnd) || isAfter(cursor, endDate)) break;
      if (isBefore(cursor, startDate)) continue;

      expanded.push({
        ...ev,
        id: `${ev.id}_rec_${cursor.toISOString()}`,
        start_time: cursor.toISOString(),
        end_time: new Date(cursor.getTime() + duration).toISOString(),
      });
    }
  }

  return expanded;
}

/**
 * Strip the _rec_... suffix from a recurring ghost event ID to get the real DB ID.
 */
export function getRealEventId(id: string): string {
  return id.includes("_rec_") ? id.split("_rec_")[0] : id;
}
