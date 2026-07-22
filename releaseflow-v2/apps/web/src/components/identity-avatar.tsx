'use client';

/**
 * BUILD-014B — Avatar resolved via IdentityService (users/{uid}).
 * UI never passes Auth photoURL or invents avatar sources.
 */

import { Avatar } from '@releaseflow/ui';
import { useIdentity } from '@/hooks/useIdentity';
import type { Identity } from '@/lib/identity-service';

export function IdentityAvatar({
  userId,
  fallbackName,
  size = 'sm',
  className,
  preloaded,
}: {
  userId?: string | null;
  fallbackName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  /** When already resolved in a parent map. */
  preloaded?: Identity | null;
}) {
  const { identity } = useIdentity(preloaded ? null : userId);
  const resolved = preloaded ?? identity;
  const name = resolved?.displayName || fallbackName || 'User';
  const src = resolved?.avatarUrl ?? null;

  return <Avatar name={name} src={src} size={size} className={className} />;
}

export function identityLabel(
  identity: Identity | null | undefined,
  fallback = 'User',
): string {
  return identity?.displayName || fallback;
}
