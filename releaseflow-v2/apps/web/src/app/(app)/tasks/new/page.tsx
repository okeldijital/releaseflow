'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { usePermissions } from '@/hooks/usePermissions';
import { TaskCreateForm } from '@/components/tasks/task-create-form';
import { Container, Button, LoadingState } from '@releaseflow/ui';
import Link from 'next/link';

function NewTaskWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const perms = usePermissions();

  const presetReleaseId = searchParams.get('releaseId');
  const lockRelease =
    searchParams.get('lockRelease') === '1' || searchParams.get('from') === 'release';

  if (!perms.canManageAssignments) {
    return (
      <Container className="py-8">
        <p className="text-sm text-content-secondary">
          You do not have permission to create tasks.
        </p>
        <Link href="/tasks" className="text-sm text-primary-400 mt-4 inline-block">
          Back to Tasks
        </Link>
      </Container>
    );
  }

  if (!activeOrgId || !user?.uid) {
    return (
      <Container className="py-8">
        <p className="text-sm text-content-label">Loading…</p>
      </Container>
    );
  }

  return (
    <Container className="py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-content-primary">New Task</h1>
          <p className="text-sm text-content-secondary mt-1">
            Create a unit of work and assign ownership.
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.push('/tasks')}>
          Cancel
        </Button>
      </div>

      <div className="rounded-xl border border-surface-200 bg-layer-2 shadow-card p-5 sm:p-6">
        <TaskCreateForm
          organizationId={activeOrgId}
          actorId={user.uid}
          presetReleaseId={presetReleaseId}
          lockRelease={lockRelease}
          onCancel={() => {
            if (lockRelease && presetReleaseId) {
              router.push(`/releases/${presetReleaseId}`);
            } else {
              router.push('/tasks');
            }
          }}
          onCreated={(taskId) => router.push(`/tasks/${taskId}`)}
        />
      </div>
    </Container>
  );
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={<div className="py-16"><LoadingState /></div>}>
      <NewTaskWorkspace />
    </Suspense>
  );
}
