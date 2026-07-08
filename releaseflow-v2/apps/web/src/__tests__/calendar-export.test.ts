import { describe, it, expect } from 'vitest';
import { generateIcsCalendar, buildReleaseCalendarEvents } from '@/lib/calendar-export';

describe('CalendarExport — ICS generation', () => {
  it('generates valid ICS header', () => {
    const ics = generateIcsCalendar([]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//ReleaseFlow//Schedule//EN');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('includes VEVENT for each event', () => {
    const events = [
      { uid: 'test-1', title: 'Event 1', description: 'Desc 1', startDate: new Date('2026-06-15'), endDate: new Date('2026-06-16') },
    ];
    const ics = generateIcsCalendar(events);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:test-1');
    expect(ics).toContain('SUMMARY:Event 1');
    expect(ics).toContain('DESCRIPTION:Desc 1');
    expect(ics).toContain('END:VEVENT');
  });

  it('handles multiple events', () => {
    const events = [
      { uid: 'test-1', title: 'Event 1', description: '', startDate: new Date('2026-06-15'), endDate: new Date('2026-06-16') },
      { uid: 'test-2', title: 'Event 2', description: '', startDate: new Date('2026-06-20'), endDate: new Date('2026-06-21') },
    ];
    const ics = generateIcsCalendar(events);
    const vevents = ics.match(/BEGIN:VEVENT/g);
    expect(vevents).toHaveLength(2);
  });

  it('includes DTSTART and DTEND', () => {
    const events = [
      { uid: 'test-1', title: 'Event', description: '', startDate: new Date('2026-06-15T10:00:00'), endDate: new Date('2026-06-16T10:00:00') },
    ];
    const ics = generateIcsCalendar(events);
    expect(ics).toContain('DTSTART:20260615');
    expect(ics).toContain('DTEND:20260616');
  });

  it('escapes special characters in summary', () => {
    const events = [
      { uid: 'test-1', title: 'Test;Release,2026', description: 'Line1\nLine2', startDate: new Date(), endDate: new Date() },
    ];
    const ics = generateIcsCalendar(events);
    expect(ics).toContain('SUMMARY:Test\\;Release\\,2026');
    expect(ics).toContain('DESCRIPTION:Line1\\nLine2');
  });

  it('uses CRLF line endings', () => {
    const ics = generateIcsCalendar([]);
    expect(ics).toContain('\r\n');
  });

  it('includes location when provided', () => {
    const events = [
      { uid: 'test-1', title: 'Event', description: '', startDate: new Date(), endDate: new Date(), location: 'Studio A' },
    ];
    const ics = generateIcsCalendar(events);
    expect(ics).toContain('LOCATION:Studio A');
  });
});

describe('CalendarExport — buildReleaseCalendarEvents', () => {
  it('creates events from releases', () => {
    const releases = [
      { id: 'r1', title: 'Summer Hit', artist: 'DJ Cool', estimatedReleaseDate: new Date('2026-07-15'), status: 'active', genre: 'Pop' },
    ];
    const events = buildReleaseCalendarEvents(releases);
    expect(events).toHaveLength(1);
    expect(events[0]!.uid).toBe('releaseflow-r1');
    expect(events[0]!.title).toContain('Summer Hit');
    expect(events[0]!.title).toContain('DJ Cool');
  });

  it('handles releases without artist', () => {
    const releases = [
      { id: 'r1', title: 'Album', estimatedReleaseDate: new Date('2026-08-01'), status: 'draft', genre: 'Rock' },
    ];
    const events = buildReleaseCalendarEvents(releases);
    expect(events[0]!.title).toBe('Album');
  });

  it('creates events with one-day duration', () => {
    const startDate = new Date('2026-06-15');
    const releases = [
      { id: 'r1', title: 'Test', estimatedReleaseDate: startDate, status: 'draft', genre: null },
    ];
    const events = buildReleaseCalendarEvents(releases);
    expect(events[0]!.startDate.getTime()).toBe(startDate.getTime());
    expect(events[0]!.endDate.getTime()).toBe(startDate.getTime() + 24 * 60 * 60 * 1000);
  });

  it('handles empty release list', () => {
    const events = buildReleaseCalendarEvents([]);
    expect(events).toHaveLength(0);
  });

  it('uses targetReleaseDate when estimated is missing', () => {
    const releases = [
      { id: 'r1', title: 'Test', targetReleaseDate: new Date('2026-09-01'), status: 'draft', genre: null },
    ];
    const events = buildReleaseCalendarEvents(releases);
    expect(events[0]!.startDate).toEqual(new Date('2026-09-01'));
  });

  it('includes description with status and genre', () => {
    const releases = [
      { id: 'r1', title: 'Test', estimatedReleaseDate: new Date(), status: 'active', genre: 'Electronic' },
    ];
    const events = buildReleaseCalendarEvents(releases);
    expect(events[0]!.description).toContain('active');
    expect(events[0]!.description).toContain('Electronic');
  });
});
