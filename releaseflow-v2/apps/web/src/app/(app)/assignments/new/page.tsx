'use client';

/**
 * AW-001 / RW-001 — Assignment Workspace (single creation entry).
 * Supports ?releaseId=…&lockRelease=1 for Release Workspace deep-link.
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import { AssignmentCreateForm } from '@/components/assignments/assignment-create-form';
import { Card, LoadingState } from '@releaseflow/ui';

function NewAssignmentWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();

  const releaseId = searchParams.get('releaseId');
  const lockRelease =
    searchParams.get('lockRelease') === '1'
    || searchParams.get('lockRelease') === 'true'
    || Boolean(releaseId && searchParams.get('from') === 'release');

  const canCreate = AuthorizationService.canManageAssignments();

  useEffect(() => {
    if (!canCreate && !AuthorizationService.isLoading()) {
      router.replace('/assignments');
    }
  }, [canCreate, router]);

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-7 py-8">
        <p className="text-sm text-text-400">Select an organization to create assignments.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-7 py-8">
        <p className="text-sm text-text-400">Sign in to create assignments.</p>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-7 py-8">
        <p className="text-sm text-text-400">You do not have permission to create assignments.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg md:max-w-2xl px-4 sm:px-7 py-6 sm:py-8 page-transition pb-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-display-md font-semibold text-primary-400 tracking-tight">
          New Assignment
        </h1>
        <p className="mt-1 text-sm text-text-400">
          Assign work to a collaborator on a release.
        </p>
      </div>

      <Card>
        <AssignmentCreateForm
          organizationId={activeOrgId}
          actorId={user.uid}
          presetReleaseId={releaseId}
          lockRelease={lockRelease && Boolean(releaseId)}
          entityType={releaseId ? 'release' : undefined}
          entityId={releaseId ?? undefined}
          variant="page"
          onCancel={() => {
            if (releaseId) router.push(`/releases/${releaseId}`);
            else router.back();
          }}
          onCreated={(assignmentId) => {
            router.push(`/assignments/${assignmentId}`);
          }}
        />
      </Card>
    </div>
  );
}

export default function NewAssignmentPage() {
  return (
    <Suspense fallback={<div className="py-16"><LoadingState text="Loading…" /></div>}>
      <NewAssignmentWorkspace />
    </Suspense>
  );
}
