'use client';

/**
 * AW-001 — Assignment dialog: Release + Contributor + Contribution Role.
 * Used when creating assignments from release/track contexts.
 */

import { useState, useEffect, useCallback } from 'react';
import { createNewAssignment } from '@/lib/assignment-service';
import { toast } from '@/stores/toast-store';
import { Button, Input, Select, TextArea } from '@releaseflow/ui';
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

interface AssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  organizationId: string;
  actorId: string;
  /** When opened from a release/track context */
  entityType?: 'release' | 'track' | 'media_asset' | 'artist' | 'label' | 'person';
  entityId?: string;
}

export function AssignmentDialog({
  open,
  onClose,
  onCreated,
  organizationId,
  actorId,
  entityType: presetEntityType,
  entityId: presetEntityId,
}: AssignmentDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [release, setRelease] = useState<ReleaseRecord | null>(null);
  const [contributor, setContributor] = useState<ContributorSelection | null>(null);
  const [contributionRole, setContributionRole] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [saving, setSaving] = useState(false);

  const presetRelease = presetEntityType === 'release' && presetEntityId;

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDescription('');
    setContributor(null);
    setContributionRole('');
    setPriority('medium');
    setDueDate('');
    setEstimatedHours('');
    setRelease(null);

    if (presetRelease && presetEntityId) {
      void fetchRelease(presetEntityId).then((r) => {
        if (r) setRelease(r as ReleaseRecord);
        else {
          void getRelease(presetEntityId).then((raw) => {
            if (raw) setRelease(raw);
          });
        }
      });
    }
  }, [open, presetRelease, presetEntityId]);

  const showDueWarning = (() => {
    if (!dueDate || !release) return false;
    const releaseDate = toDate(release.targetReleaseDate ?? release.estimatedReleaseDate);
    if (!releaseDate) return false;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const rd = new Date(releaseDate);
    rd.setHours(0, 0, 0, 0);
    return due.getTime() > rd.getTime();
  })();

  const templates = contributionRole ? templatesForContributionRole(contributionRole) : [];

  const handleSave = useCallback(async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!contributor) { toast.error('Select a contributor'); return; }
    if (!contributionRole.trim()) { toast.error('Select a contribution role'); return; }
    if (!dueDate) { toast.error('Due date is required'); return; }

    const entityType = presetEntityType && presetEntityId && presetEntityType !== 'release'
      ? presetEntityType
      : 'release';
    const entityId = entityType === 'release'
      ? (release?.id ?? '')
      : (presetEntityId ?? '');

    if (!entityId) { toast.error('Select a release'); return; }

    setSaving(true);
    try {
      await createNewAssignment({
        organizationId,
        title: title.trim(),
        description: description.trim() || null,
        entityType,
        entityId,
        assigneeId: contributor.person.id,
        assignerId: actorId,
        role: contributionRole.trim(),
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: new Date(dueDate),
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
      });
      toast.success('Assignment created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  }, [
    title, description, release, contributor, contributionRole, priority, dueDate,
    estimatedHours, organizationId, actorId, onCreated, onClose, presetEntityType, presetEntityId,
  ]);

  if (!open) return null;

  const needReleasePicker = !presetRelease;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <button className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl border border-surface-700 bg-surface-900 p-5 sm:p-6 shadow-modal space-y-4">
        <h2 className="text-base font-semibold text-content-primary">Create Assignment</h2>

        {needReleasePicker ? (
          <ReleaseSelector
            organizationId={organizationId}
            value={release}
            onChange={setRelease}
          />
        ) : release ? (
          <div className="text-sm text-text-400">
            Release: <span className="text-surface-100 font-medium">{release.title}</span>
          </div>
        ) : null}

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
          {templates.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(t)}
                  className="text-xs px-2 py-1 rounded-lg border border-surface-700 text-text-400 hover:border-primary-500/40"
                >
                  {t}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mix final master" required />
        <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details…" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Priority" options={priorityOptions} value={priority} onChange={setPriority} />
          <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          <Input label="Est. Hours" type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="8" />
        </div>

        {showDueWarning ? (
          <p className="text-xs text-warning-500">⚠ This assignment finishes after release day.</p>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="min-h-[48px] sm:min-h-0">Cancel</Button>
          <Button onClick={handleSave} loading={saving} className="min-h-[48px] sm:min-h-0">Create Assignment</Button>
        </div>
      </div>
    </div>
  );
}
