interface CalendarEvent {
  uid: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function generateIcsCalendar(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ReleaseFlow//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTART:${formatIcsDate(event.startDate)}`);
    lines.push(`DTEND:${formatIcsDate(event.endDate)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsCalendar(events: CalendarEvent[], filename = 'release-schedule.ics'): void {
  const content = generateIcsCalendar(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildReleaseCalendarEvents(
  releases: { id: string; title: string; artist?: string | null; estimatedReleaseDate?: unknown; targetReleaseDate?: unknown; status?: string; genre?: string | null }[],
): CalendarEvent[] {
  return releases.map((r) => {
    const date = r.estimatedReleaseDate || r.targetReleaseDate;
    const startDate = date
      ? (typeof date === 'object' && date !== null && 'toDate' in date
        ? (date as { toDate: () => Date }).toDate()
        : new Date(String(date)))
      : new Date();

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    return {
      uid: `releaseflow-${r.id}`,
      title: `${r.title}${r.artist ? ` - ${r.artist}` : ''}`,
      description: `Release: ${r.title}\nStatus: ${r.status || 'Unknown'}\nGenre: ${r.genre || 'N/A'}`,
      startDate,
      endDate,
      location: '',
    };
  });
}
