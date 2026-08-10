'use client';

/**
 * BUILD-220F — When true, schedule/calendar domain views suppress page titles
 * so ModulePage owns the "Calendar" heading.
 */

import { createContext, useContext } from 'react';

export const CalendarEmbedContext = createContext(false);

export function useCalendarEmbed(): boolean {
  return useContext(CalendarEmbedContext);
}
