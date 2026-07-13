'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePerson } from '@/hooks/usePerson';
import { useOrgStore } from '@/stores/org-store';
import { getAssignmentsByEntity } from '@/lib/assignment-repository';
import { getRelease } from '@/lib/release-repository';
import { Container, LoadingState, EmptyState } from '@releaseflow/ui';

interface ReleaseInfo {
  id: string;
  title: string;
  role: string;
  status: string;
}

export default function PersonReleasesPage() {
  const params = useParams();
  const id = params.id as string;
  const { activeOrgId } = useOrgStore();
  const { person, loading } = usePerson(id);

  const [releases, setReleases] = useState<ReleaseInfo[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(true);

  useEffect(() => {
    if (!id || !activeOrgId) return;
    setLoadingReleases(true);
    getAssignmentsByEntity('release', id).then(async (assignments) => {
      const uniqueIds = [...new Set(assignments.map(a => a.entityId))];
      const details = await Promise.all(
        uniqueIds.map(async (rid) => {
          const release = await getRelease(rid);
          const assignment = assignments.find(a => a.entityId === rid);
          return {
            id: rid,
            title: release?.title ?? rid,
            role: assignment?.role ?? '',
            status: assignment?.status ?? '',
          };
        })
      );
      setReleases(details);
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
        <div className="space-y-2">
          {releases.map((r) => (
            <a key={r.id} href={`/releases/${r.id}`} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary-400 truncate">{r.title}</p>
                <p className="text-xs text-text-500">{r.role || 'Collaborator'}</p>
              </div>
              <span className="text-xs text-text-500 capitalize">{r.status.replace(/_/g, ' ')}</span>
            </a>
          ))}
        </div>
      )}
    </Container>
  );
}
