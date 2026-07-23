'use client';

/**
 * BUILD-018 — Canonical Person Card
 *
 * One layout for all contexts. size = compact | standard | large only.
 *
 * Layout:
 *   Photo (square) + status badge TL + overflow menu TR
 *   Display name (max 2 lines)
 *   Subtitle (primary role — never invented)
 *   Statistics (releases / credits) when available
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { Badge, ConfirmationDialog } from '@releaseflow/ui';
import { EntityOverflowMenu, type EntityOverflowMenuItem } from '@/components/entity-overflow-menu';
import type { PersonCardModel, PersonCardMenuAction } from '@/lib/person-card-model';

export type PersonCardSize = 'compact' | 'standard' | 'large';

const SIZE_STYLES: Record<
  PersonCardSize,
  { pad: string; title: string; meta: string; stats: string }
> = {
  compact: {
    pad: 'p-3 space-y-1.5',
    title: 'text-sm font-semibold leading-snug line-clamp-2',
    meta: 'text-[11px] text-text-400 truncate',
    stats: 'text-[11px] text-text-500',
  },
  standard: {
    pad: 'p-4 space-y-2',
    title: 'text-sm sm:text-base font-semibold leading-snug line-clamp-2',
    meta: 'text-xs text-text-400 truncate',
    stats: 'text-xs text-text-500',
  },
  large: {
    pad: 'p-5 space-y-3',
    title: 'text-base sm:text-lg font-semibold leading-snug line-clamp-2',
    meta: 'text-sm text-text-400 truncate',
    stats: 'text-sm text-text-500',
  },
};

function PersonImage({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const initial = name.charAt(0).toUpperCase() || 'P';
  if (image) {
    return (
      <img
        src={image}
        alt={`${name}`}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center">
      <span className="text-4xl sm:text-5xl font-bold text-surface-50 select-none">
        {initial}
      </span>
    </div>
  );
}

function CardSurface({
  href,
  onSelect,
  children,
  className,
}: {
  href?: string;
  onSelect?: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full h-full text-left ${className ?? ''}`}
      >
        {children}
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

export interface PersonCardProps {
  person: PersonCardModel;
  size?: PersonCardSize;
  showMenu?: boolean;
  showStats?: boolean;
  /** Selection mode (pickers) — disables navigation links */
  onSelect?: (personId: string) => void;
  onArchive?: (personId: string) => Promise<void> | void;
  onRestore?: (personId: string) => Promise<void> | void;
  onDeleteRequest?: (personId: string, personName: string) => Promise<void> | void;
  onArchived?: (personId: string) => void;
  onRestored?: (personId: string) => void;
  onDeleted?: (personId: string) => void;
}

export function PersonCard({
  person,
  size = 'standard',
  showMenu = true,
  showStats = true,
  onSelect,
  onArchive,
  onRestore,
  onDeleteRequest,
  onArchived,
  onRestored,
}: PersonCardProps) {
  const router = useRouter();
  const styles = SIZE_STYLES[size];
  const [busy, setBusy] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const isArchived = person.status === 'archived';
  const selectable = typeof onSelect === 'function';
  const detailHref = selectable ? undefined : `/people/${person.id}`;

  const actionEnabled = (id: PersonCardMenuAction): boolean => {
    if (id === 'view' || id === 'edit') return true;
    if (id === 'archive') return Boolean(onArchive);
    if (id === 'restore') return Boolean(onRestore);
    if (id === 'delete') return Boolean(onDeleteRequest);
    return false;
  };

  const overflowItems: EntityOverflowMenuItem[] = (person.menuActions ?? []).map(
    (id): EntityOverflowMenuItem => {
      switch (id) {
        case 'view':
          return {
            id: 'view',
            label: 'View',
            onClick: () => router.push(`/people/${person.id}`),
            disabled: busy,
          };
        case 'edit':
          return {
            id: 'edit',
            label: 'Edit',
            onClick: () => router.push(`/people/${person.id}?edit=1`),
            disabled: busy,
          };
        case 'restore':
          return {
            id: 'restore',
            label: 'Restore',
            variant: 'secondary',
            separatorBefore: true,
            onClick: () => {
              void (async () => {
                if (!onRestore) return;
                setBusy(true);
                try {
                  await onRestore(person.id);
                  onRestored?.(person.id);
                } finally {
                  setBusy(false);
                }
              })();
            },
            disabled: busy || !actionEnabled('restore'),
          };
        case 'archive':
          return {
            id: 'archive',
            label: 'Archive',
            variant: 'secondary',
            separatorBefore: true,
            onClick: () => setConfirmArchive(true),
            disabled: busy || !actionEnabled('archive'),
          };
        case 'delete':
          return {
            id: 'delete',
            label: 'Delete',
            variant: 'danger',
            separatorBefore: true,
            onClick: () => {
              void onDeleteRequest?.(person.id, person.displayName);
            },
            disabled: busy || !actionEnabled('delete'),
          };
        default:
          return {
            id: String(id),
            label: String(id),
            onClick: () => {},
            disabled: true,
          };
      }
    },
  );

  const statsParts: string[] = [];
  if (showStats) {
    if (person.releaseCount !== null && person.releaseCount !== undefined) {
      statsParts.push(
        person.releaseCount === 1
          ? '1 Release'
          : `${person.releaseCount} Releases`,
      );
    }
    if (person.creditCount !== null && person.creditCount !== undefined) {
      statsParts.push(
        person.creditCount === 1
          ? '1 Credit'
          : `${person.creditCount} Credits`,
      );
    }
  }

  const stopMenuBubble = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      data-person-card
      data-person-id={person.id}
      data-size={size}
      className="group relative rounded-xl border border-surface-200 bg-layer-2 shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all duration-200 overflow-hidden"
    >
      <div className="relative w-full aspect-square overflow-hidden">
        <CardSurface
          href={detailHref}
          onSelect={selectable ? () => onSelect?.(person.id) : undefined}
          className="block w-full h-full"
        >
          <PersonImage name={person.displayName} image={person.image} />
        </CardSurface>

        {person.status && person.status !== 'active' ? (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <Badge
              label={person.status.toUpperCase()}
              color={
                isArchived
                  ? 'bg-surface-800/90 text-text-300 border border-surface-600/50'
                  : 'bg-warning-500/20 text-warning-600 border border-warning-500/30'
              }
              size="sm"
            />
          </div>
        ) : null}

        {showMenu && !selectable && overflowItems.length > 0 ? (
          <div className="absolute top-3 right-3 z-10" onClick={stopMenuBubble}>
            <EntityOverflowMenu align="right" items={overflowItems} />
          </div>
        ) : null}
      </div>

      <div className={styles.pad}>
        <CardSurface
          href={detailHref}
          onSelect={selectable ? () => onSelect?.(person.id) : undefined}
          className="block min-w-0"
        >
          <h3
            className={`${styles.title} text-primary-400`}
            title={person.displayName}
          >
            {person.displayName}
          </h3>
        </CardSurface>

        {person.subtitle ? (
          <p className={styles.meta} title={person.subtitle}>
            {person.subtitle}
          </p>
        ) : null}

        {statsParts.length > 0 ? (
          <p className={styles.stats}>{statsParts.join(' · ')}</p>
        ) : null}
      </div>

      <ConfirmationDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => {
          void (async () => {
            if (!onArchive) return;
            setBusy(true);
            setConfirmArchive(false);
            try {
              await onArchive(person.id);
              onArchived?.(person.id);
            } finally {
              setBusy(false);
            }
          })();
        }}
        title="Archive Person?"
        message={`Archive "${person.displayName}"? They will be hidden from the active directory.`}
        confirmLabel="Archive"
        variant="danger"
        loading={busy}
      />
    </div>
  );
}
