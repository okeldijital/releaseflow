'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { createReleaseWithFullWorkflow } from '@/lib/release-service';
import { getStageTemplatesForReleaseType } from '@/lib/workflow-templates';
import { getRequirementNamesForReleaseType } from '@/lib/requirement-templates';
import { Button, Card, Input, Select } from '@releaseflow/ui';
import type { Release } from '@/app/(app)/types';

const releaseTypes = [
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'album', label: 'Album' },
  { value: 'remix', label: 'Remix' },
  { value: 'compilation', label: 'Compilation' },
] as const;

const releaseStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_production', label: 'In Production' },
  { value: 'ready_for_distribution', label: 'Ready for Distribution' },
  { value: 'released', label: 'Released' },
  { value: 'archived', label: 'Archived' },
] as const;

export default function NewReleasePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { activeOrgId } = useOrgStore();
  const [title, setTitle] = useState('');
  const [releaseType, setReleaseType] = useState<string>('single');
  const [status, setStatus] = useState<string>('draft');
  const [targetReleaseDate, setTargetReleaseDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeOrgId || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      const stageTemplates = getStageTemplatesForReleaseType(releaseType as Release['releaseType']);
      const requirementNames = getRequirementNamesForReleaseType(releaseType as Release['releaseType']);
      const { releaseId } = await createReleaseWithFullWorkflow(
        {
          title,
          releaseType: releaseType as Release['releaseType'],
          status: status as Release['status'],
          organizationId: activeOrgId,
          createdBy: user.uid,
          targetReleaseDate: targetReleaseDate ? new Date(targetReleaseDate) : null,
        },
        stageTemplates,
        requirementNames,
        user.uid,
      );
      router.push(`/releases/${releaseId}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/releases" className="text-sm text-text-500 hover:text-text-900 dark:hover:text-surface-100 mb-6 inline-block">&larr; Back to releases</Link>
      <h1 className="text-2xl font-bold text-text-900 dark:text-surface-50 mb-8">New Release</h1>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Release title" label="Title" />
          <Select label="Release Type" options={releaseTypes.map((rt) => ({ value: rt.value, label: rt.label }))} value={releaseType} onChange={setReleaseType} />
          <Select label="Status" options={releaseStatuses.map((rs) => ({ value: rs.value, label: rs.label }))} value={status} onChange={setStatus} />
          <Input type="date" value={targetReleaseDate} onChange={(e) => setTargetReleaseDate(e.target.value)} label="Target Release Date" hint="Optional" />
          {!activeOrgId && <p className="text-sm text-warning-500">Select an organization on the dashboard first to create a release.</p>}
          {error && <p className="text-sm text-danger-500">{error}</p>}
          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" variant="primary" disabled={submitting || !activeOrgId || !title.trim()} loading={submitting}>
              {submitting ? 'Creating...' : 'Create Release'}
            </Button>
            <Link href="/releases" className="text-sm text-text-500 hover:text-text-900 dark:hover:text-surface-100">Cancel</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
