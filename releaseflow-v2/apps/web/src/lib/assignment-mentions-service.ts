import { getPeopleByOrg } from '@/lib/people-repository';

export interface MentionSuggestion {
  /** Person document id (primary mention identity). */
  personId: string;
  displayName: string;
  primaryRole: string;
  avatarUrl?: string | null;
  userId?: string | null;
}

export async function getMentionSuggestions(
  orgId: string,
  queryStr: string,
): Promise<MentionSuggestion[]> {
  const people = await getPeopleByOrg(orgId);
  const q = queryStr.toLowerCase().trim();
  return people
    .filter((p) => {
      if (p.status === 'archived') return false;
      if (!p.displayName) return false;
      if (!q) return true;
      if (p.displayName.toLowerCase().includes(q)) return true;
      if (p.email?.toLowerCase().includes(q)) return true;
      if (p.primaryRole?.toLowerCase().includes(q)) return true;
      return false;
    })
    .map((p) => ({
      personId: p.id,
      displayName: p.displayName,
      primaryRole: p.primaryRole,
      avatarUrl: p.avatarUrl,
      userId: p.userId ?? null,
    }))
    .slice(0, 10);
}

/**
 * Mentions are stored by explicit person id selection, not by parsing display
 * text alone. This helper only recovers ids for already-selected mentions when
 * the display text still contains `@Display Name`.
 */
export function resolveMentionIdsFromSelection(
  selected: MentionSuggestion[],
): string[] {
  return [...new Set(selected.map((m) => m.personId))];
}

export function insertMentionAtCursor(
  text: string,
  cursor: number,
  displayName: string,
): { text: string; cursor: number; triggerStart: number } {
  const before = text.slice(0, cursor);
  const after = text.slice(cursor);
  const atIdx = before.lastIndexOf('@');
  const triggerStart = atIdx >= 0 ? atIdx : cursor;
  const prefix = text.slice(0, triggerStart);
  const insertion = `@${displayName} `;
  const next = `${prefix}${insertion}${after}`;
  return {
    text: next,
    cursor: prefix.length + insertion.length,
    triggerStart,
  };
}

export function getMentionQueryAtCursor(text: string, cursor: number): {
  active: boolean;
  query: string;
  start: number;
} {
  const before = text.slice(0, cursor);
  const match = before.match(/@([\w\s'-]*)$/);
  if (!match) return { active: false, query: '', start: -1 };
  // Avoid matching emails (char before @ is non-whitespace)
  const atPos = before.length - match[0].length;
  const prevChar = atPos > 0 ? before[atPos - 1] : undefined;
  if (prevChar !== undefined && /\S/.test(prevChar)) {
    return { active: false, query: '', start: -1 };
  }
  return { active: true, query: match[1] ?? '', start: atPos };
}

/** Linkify plain URLs; escape HTML. Mentions highlighted via @Name pattern. */
export function renderCommentMessageHtml(
  message: string,
  mentionNames: string[] = [],
): string {
  let html = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // URLs (no previews / embeds)
  html = html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary-400 underline underline-offset-2 break-all">$1</a>',
  );

  // Mentions — longest names first to avoid partial overlaps
  const names = [...mentionNames].sort((a, b) => b.length - a.length);
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(
      new RegExp(`@${escaped}`, 'gi'),
      `<span class="text-primary-400 font-medium">@${name}</span>`,
    );
  }

  // Paragraphs / line breaks
  html = html.replace(/\n/g, '<br />');
  return html;
}
