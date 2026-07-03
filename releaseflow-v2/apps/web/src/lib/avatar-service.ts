export interface AvatarInput {
  userId?: string | null;
  avatarUrl?: string | null;
  displayName: string;
}

export interface AvatarResult {
  type: 'account' | 'uploaded' | 'initials';
  url?: string;
  initials: string;
}

export function resolveAvatar(person: AvatarInput): AvatarResult {
  const parts = (person.displayName ?? '').trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  const initials = parts.length >= 2
    ? `${first}${second}`.toUpperCase()
    : parts.length === 1
      ? first.toUpperCase()
      : '';

  if (person.userId) {
    return { type: 'account', initials };
  }

  if (person.avatarUrl) {
    return { type: 'uploaded', url: person.avatarUrl, initials };
  }

  return { type: 'initials', initials };
}
