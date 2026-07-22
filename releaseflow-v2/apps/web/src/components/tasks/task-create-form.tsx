'use client';

/**
 * BUILD-014 — Create Task form.
 * Assign To uses ContributorSelector (org collaborators only).
 * Linked Release is optional (ReleaseSelector).
 */

import { useEffect, useState, FormEvent } from 'react';
import { createTaskWithAssignment } from '@/lib/task-service';
import type { TaskPriority } from '@/lib/task-service';
import type { ReleaseRecord } from '@/lib/release-repository';
import { fetchRelease } from '@/lib/release-service';
import { getRelease } from '@/lib/release-repository';
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

export interface TaskCreateFormProps {
  organizationId: string;
  actorId: string;
  presetReleaseId?: string | null;
  lockRelease?: boolean;
  onCancel?: () => void;
  onCreated?: (taskId: string) => void;
  submitLabel?: string;
}

export function TaskCreateForm({
  organizationId,
  actorId,
  presetReleaseId,
  lockRelease = false,
  onCancel,
  onCreated,
  submitLabel = 'Create Task',
}: TaskCreateFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contributor, setContributor] = useState<ContributorSelection | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [release, setRelease] = useState<ReleaseRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [releaseLoadError, setReleaseLoadError] = useState(false);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!contributor) {
      toast.error('Assign To is required');
      return;
    }

    setLoading(true);
    try {
      const result = await createTaskWithAssignment({
        organisationId: organizationId,
        title: title.trim(),
        description: description.trim() || null,
        assigneeId: contributor.person.id,
        assigneeUserId: contributor.person.userId ?? null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
        releaseId: release?.id ?? presetReleaseId ?? null,
        createdBy: actorId,
        assignerUserId: actorId,
      });
      toast.success('Task created');
      onCreated?.(result.task.id);
    } catch (err) {
      console.error('[TaskCreateForm]', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-content-primary mb-1">
          Title <span className="text-danger-500">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Upload final masters"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-content-primary mb-1">
          Description
        </label>
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-content-primary mb-1">
          Assign To <span className="text-danger-500">*</span>
        </label>
        <ContributorSelector
          organizationId={organizationId}
          value={contributor}
          onChange={setContributor}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-content-primary mb-1">
            Priority
          </label>
          <Select
            value={priority}
            onChange={(v) => setPriority(v as TaskPriority)}
            options={priorityOptions}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-content-primary mb-1">
            Due Date
          </label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-content-primary mb-1">
          Reminder
        </label>
        <Input
          type="datetime-local"
          value={reminderAt}
          onChange={(e) => setReminderAt(e.target.value)}
        />
        <p className="mt-1 text-xs text-content-label">
          Stored only — notifications are not sent yet.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-content-primary mb-1">
          Linked Release
        </label>
        {lockRelease && release ? (
          <div className="rounded-lg border border-surface-200 bg-layer-2 px-3 py-2 text-sm text-content-primary">
            {release.displayTitle || release.title}
          </div>
        ) : (
          <ReleaseSelector
            organizationId={organizationId}
            value={release}
            onChange={setRelease}
            locked={lockRelease}
          />
        )}
        {releaseLoadError ? (
          <p className="mt-1 text-xs text-danger-500">Could not load preset release.</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Creating…' : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
