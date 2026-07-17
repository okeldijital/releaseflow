'use client';

/**
 * AW-001 / RW-001 — Single assignment creation form used by:
 * - /assignments/new (full workspace)
 * - AssignmentDialog (embedded contexts)
 *
 * No manual ID entry. Authorization enforced in createNewAssignment via
 * AuthorizationService.requireManageAssignments().
 */

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { createNewAssignment } from '@/lib/assignment-service';
import type { ReleaseRecord } from '@/lib/release-repository';
import { getRelease } from '@/lib/release-repository';
import { fetchRelease } from '@/lib/release-service';
import {
  CONTRIBUTION_ROLE_OPTIONS,
  templatesForContributionRole,
} from '@/lib/contribution-roles';
import { ReleaseSelector } from '@/components/assignments/release-selector';
import {
  ContributorSelector,
  type ContributorSelection,
} from '@/components/assignments/contributor-selector';
import { Button, Input, TextArea, Select } from '@releaseflow/ui';
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

export interface AssignmentCreateFormProps {
  organizationId: string;
  actorId: string;
  /** Pre-select and optionally lock a release (Release workspace). */
  presetReleaseId?: string | null;
  /** When true, release cannot be changed (RW-001). */
  lockRelease?: boolean;
  /**
   * Non-release entity context (track / artist). Still requires a release
   * for AW-001 domain model unless entityType is release.
   */
  entityType?: 'release' | 'track' | 'media_asset' | 'artist' | 'label' | 'person';
  entityId?: string;
  /** Layout variant */
  variant?: 'page' | 'dialog';
  onCancel?: () => void;
  onCreated?: (assignmentId: string) => void;
  submitLabel?: string;
}

export function AssignmentCreateForm({
  organizationId,
  actorId,
  presetReleaseId,
  lockRelease = false,
  entityType,
  entityId,
  variant = 'page',
  onCancel,
  onCreated,
  submitLabel = 'Create Assignment',
}: AssignmentCreateFormProps) {
  const [release, setRelease] = useState<ReleaseRecord | null>(null);
  const [contributor, setContributor] = useState<ContributorSelection | null>(null);
  const [contributionRole, setContributionRole] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [releaseLoadError, setReleaseLoadError] = useState(false);

  // Load preset release when provided.
  useEffect(() => {
    if (!presetReleaseId) {
      if (!lockRelease) setRelease(null);
      return;
    }
    let cancelled = false;
    setReleaseLoadError(false);
    void (async () => {
      try {
        const r = await fetchRelease(presetReleaseId);
        if (cancelled) return;
        if (r) {
          setRelease(r as ReleaseRecord);
          return;
        }
        const raw = await getRelease(presetReleaseId);
        if (cancelled) return;
        if (raw) setRelease(raw);
        else setReleaseLoadError(true);
      } catch {
        if (!cancelled) setReleaseLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [presetReleaseId, lockRelease]);

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
    if (!release) {
      toast.error('Select a release');
      return;
    }
    if (!contributor) {
      toast.error('Select a contributor');
      return;
    }
    if (!contributionRole.trim()) {
      toast.error('Select a contribution role');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!dueDate) {
      toast.error('Due date is required');
      return;
    }

    // Prefer release entity; non-release presets still attach work to the release
    // for AW-001 domain model when opened from track/artist context with a release.
    const resolvedEntityType =
      entityType && entityId && entityType !== 'release' ? entityType : 'release';
    const resolvedEntityId =
      resolvedEntityType === 'release' ? release.id : (entityId ?? release.id);

    setLoading(true);
    try {
      const assignment = await createNewAssignment({
        organizationId,
        title: title.trim(),
        description: description.trim() || null,
        entityType: resolvedEntityType,
        entityId: resolvedEntityId,
        assigneeId: contributor.person.id,
        assignerId: actorId,
        role: contributionRole.trim(),
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: new Date(dueDate),
      });
      toast.success('Assignment created');
      onCreated?.(assignment.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  }

  const isDialog = variant === 'dialog';

  return (
    <form onSubmit={handleSubmit} className={isDialog ? 'space-y-4' : 'space-y-5'}>
      {releaseLoadError ? (
        <p className="text-sm text-danger-500">Could not load the pre-selected release.</p>
      ) : null}

      <ReleaseSelector
        organizationId={organizationId}
        value={release}
        onChange={setRelease}
        locked={lockRelease && Boolean(presetReleaseId)}
      />

      <ContributorSelector
        organizationId={organizationId}
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

      <div className={`border-t border-surface-700/50 ${isDialog ? 'pt-4' : 'pt-5'} space-y-4`}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Priority" options={priorityOptions} value={priority} onChange={setPriority} />
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
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
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="min-h-[48px] sm:min-h-0 w-full sm:w-auto"
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          loading={loading}
          className={`min-h-[48px] sm:min-h-0 w-full sm:w-auto ${onCancel ? 'sm:flex-1' : ''}`}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
