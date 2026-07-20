'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePerson } from '@/hooks/usePerson';
import { useOrgStore } from '@/stores/org-store';
import { fetchAssignmentsByEntity } from '@/lib/assignment-service';
import { getRelease } from '@/lib/release-repository';
import { Container, LoadingState, EmptyState } from '@releaseflow/ui';
import { ReleaseCard } from '@/components/release/cards/ReleaseCard';
import { resolveReleaseCardVariant } from '@/lib/release-workspace';
import type { Release } from '@/app/(app)/types';

/**
 * BUG-008B — Person → Releases list uses ReleaseCard only.
 * Assignment role is not a separate release summary renderer.
 */
export default function PersonReleasesPage() {
  const params = useParams();
  const id = params.id as string;
  const { activeOrgId } = useOrgStore();
  const { person, loading } = usePerson(id);

  const [releases, setReleases] = useState<Release[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(true);

  useEffect(() => {
    if (!id || !activeOrgId) return;
    setLoadingReleases(true);
    fetchAssignmentsByEntity('release', id).then(async (assignments) => {
      const uniqueIds = [...new Set(assignments.map((a) => a.entityId))];
      const details = await Promise.all(
        uniqueIds.map(async (rid) => {
          const release = await getRelease(rid);
          return release as Release | null;
        }),
      );
      setReleases(details.filter((r): r is Release => r != null));
      setLoadingReleases(false);
    }).catch(() => {
      setReleases([]);
      setLoadingReleases(false);
    });
  }, [id, activeOrgId]);

  if (loading) {
    return (
      <Container size="wide" className="py-8 page-transition">
        <div className="flex items-center justify-center py-32"><LoadingState /></div>
      </Container>
    );
  }

  if (!person) {
    return (
      <Container size="wide" className="py-8 page-transition">
        <EmptyState title="Person not found" description="The requested collaborator could not be found." />
      </Container>
    );
  }

  return (
    <Container size="wide" className="py-8 page-transition">
      <div className="mb-6">
        <a href={`/people/${id}`} className="text-sm text-text-400 hover:text-surface-50 inline-block">&larr; Back to {person.displayName}</a>
      </div>
      <div className="mb-8">
        <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">Releases</h1>
        <p className="mt-1 text-sm text-text-400">
          {releases.length > 0
            ? `${releases.length} release${releases.length !== 1 ? 's' : ''} assigned to ${person.displayName}`
            : 'No releases assigned to this person.'}
        </p>
      </div>

      {loadingReleases ? (
        <LoadingState />
      ) : releases.length === 0 ? (
        <EmptyState title="No releases" description={`${person.displayName} has not been assigned to any releases yet.`} />
      ) : (
        <div className="space-y-2" data-release-card-grid data-count={releases.length}>
          {releases.map((r) => (
            <ReleaseCard
              key={r.id}
              release={r}
              view="list"
              variant={resolveReleaseCardVariant(r)}
              mode="table"
            />
          ))}
        </div>
      )}
    </Container>
  );
}
