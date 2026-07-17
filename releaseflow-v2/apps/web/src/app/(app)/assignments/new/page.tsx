'use client';

/**
 * AW-001 — Assignment creation centered on Release, Contributor, Contribution Role.
 * No manual entity or person IDs.
 */

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { createNewAssignment } from '@/lib/assignment-service';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import type { ReleaseRecord } from '@/lib/release-repository';
import {
  CONTRIBUTION_ROLE_OPTIONS,
  templatesForContributionRole,
} from '@/lib/contribution-roles';
import { ReleaseSelector } from '@/components/assignments/release-selector';
import {
  ContributorSelector,
  type ContributorSelection,
} from '@/components/assignments/contributor-selector';
import { Button, Input, TextArea, Select, Card } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'object' && value && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  return null;
}

export default function NewAssignmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();

  const [release, setRelease] = useState<ReleaseRecord | null>(null);
  const [contributor, setContributor] = useState<ContributorSelection | null>(null);
  const [contributionRole, setContributionRole] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [loading, setLoading] = useState(false);

  const canCreate = AuthorizationService.canManageAssignments();

  useEffect(() => {
    if (!canCreate && !AuthorizationService.isLoading()) {
      router.replace('/assignments');
    }
  }, [canCreate, router]);

  const templates = useMemo(
    () => (contributionRole ? templatesForContributionRole(contributionRole) : []),
    [contributionRole],
  );

  const dueAfterRelease = useMemo(() => {
    if (!dueDate || !release) return false;
    const releaseDate = toDate(release.targetReleaseDate ?? release.estimatedReleaseDate);
    if (!releaseDate) return false;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const rd = new Date(releaseDate);
    rd.setHours(0, 0, 0, 0);
    return due.getTime() > rd.getTime();
  }, [dueDate, release]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) { toast.error('Authentication required'); return; }
    if (!activeOrgId) { toast.error('No organization selected'); return; }
    if (!release) { toast.error('Select a release'); return; }
    if (!contributor) { toast.error('Select a contributor'); return; }
    if (!contributionRole.trim()) { toast.error('Select a contribution role'); return; }
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!dueDate) { toast.error('Due date is required'); return; }

    setLoading(true);
    try {
      const assignment = await createNewAssignment({
        organizationId: activeOrgId,
        title: title.trim(),
        description: description.trim() || null,
        entityType: 'release',
        entityId: release.id,
        assigneeId: contributor.person.id,
        assignerId: user.uid,
        role: contributionRole.trim(),
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: new Date(dueDate),
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
      });
      toast.success('Assignment created');
      router.push(`/assignments/${assignment.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-7 py-8">
        <p className="text-sm text-text-400">Select an organization to create assignments.</p>
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <ReleaseSelector
            organizationId={activeOrgId}
            value={release}
            onChange={setRelease}
          />

          <ContributorSelector
            organizationId={activeOrgId}
            value={contributor}
            onChange={setContributor}
          />

          <div>
            <Select
              label="Contribution Role"
              options={[
                { value: '', label: 'Select contribution role…' },
                ...CONTRIBUTION_ROLE_OPTIONS,
              ]}
              value={contributionRole}
              onChange={setContributionRole}
            />
            <p className="text-xs text-text-500 mt-1.5">
              Describes the work on this assignment only — not platform access.
            </p>
            {templates.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {templates.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTitle(t)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-surface-700 text-text-400 hover:border-primary-500/40 hover:text-primary-400 min-h-[36px]"
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="border-t border-surface-700/50 pt-5 space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete lyrics"
              required
              className="min-h-[48px] sm:min-h-0"
            />
            <TextArea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details about this assignment…"
              rows={3}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Priority" options={priorityOptions} value={priority} onChange={setPriority} />
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="min-h-[48px] sm:min-h-0"
              />
              <Input
                label="Est. Hours"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g. 8"
                className="min-h-[48px] sm:min-h-0"
              />
            </div>
            {dueAfterRelease ? (
              <p className="text-sm text-warning-500 rounded-xl border border-warning-500/30 bg-warning-500/10 px-3 py-2.5">
                ⚠ This assignment finishes after release day.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="min-h-[48px] sm:min-h-0 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="min-h-[48px] sm:min-h-0 w-full sm:w-auto sm:flex-1"
            >
              Create Assignment
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
