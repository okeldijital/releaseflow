'use client';

import { useState, useEffect, useCallback } from 'react';
import { createNewAssignment } from '@/lib/assignment-service';
import { toast } from '@/stores/toast-store';
import { Button, Input, Select, TextArea } from '@releaseflow/ui';
import { PersonPickerDialog } from '@/components/person-picker-dialog';

const entityTypeOptions = [
  { value: 'release', label: 'Release' },
  { value: 'track', label: 'Track' },
  { value: 'media_asset', label: 'Media' },
  { value: 'artist', label: 'Artist' },
  { value: 'label', label: 'Label' },
  { value: 'person', label: 'Person' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface AssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  organizationId: string;
  actorId: string;
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
  const [entityType, setEntityType] = useState<string>(presetEntityType ?? 'release');
  const [entityId, setEntityId] = useState(presetEntityId ?? '');
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [role, setRole] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [saving, setSaving] = useState(false);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDescription('');
    setEntityType(presetEntityType ?? 'release');
    setEntityId(presetEntityId ?? '');
    setAssigneeId('');
    setAssigneeName('');
    setRole('');
    setPriority('medium');
    setDueDate('');
    setEstimatedHours('');
    setAssigneePickerOpen(false);
  }, [open, presetEntityType, presetEntityId]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!assigneeId) { toast.error('Assignee is required'); return; }
    if (!entityId.trim()) { toast.error('Entity is required'); return; }

    setSaving(true);
    try {
      await createNewAssignment({
        organizationId,
        title: title.trim(),
        description: description.trim() || null,
        entityType: entityType as 'release' | 'track' | 'media_asset' | 'artist' | 'label' | 'person',
        entityId: entityId.trim(),
        assigneeId,
        assignerId: actorId,
        role: role.trim() || 'contributor',
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: dueDate ? new Date(dueDate) : null,
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
  }, [title, description, entityType, entityId, assigneeId, role, priority, dueDate, estimatedHours, organizationId, actorId, onCreated, onClose]);

  if (!open) return null;

  const showEntityFields = !presetEntityType || !presetEntityId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-surface-700 bg-surface-900 p-6 shadow-modal space-y-4">
        <h2 className="text-base font-semibold text-content-primary">Create Assignment</h2>

        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mix final master" required />

        <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details about this assignment..." />

        {showEntityFields ? (
          <div className="grid grid-cols-2 gap-4">
            <Select label="Entity Type" options={entityTypeOptions} value={entityType} onChange={setEntityType} />
            <Input label="Entity ID" value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="e.g. track_abc123" required />
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-content-label mb-2">Assignee</label>
          <button
            type="button"
            onClick={() => setAssigneePickerOpen(true)}
            className="w-full flex items-center gap-2.5 h-10 px-3 text-sm rounded-md border border-divider bg-layer-3 text-left hover:border-primary-500 transition-colors"
          >
            {assigneeName ? (
              <span className="text-content-primary truncate flex-1">{assigneeName}</span>
            ) : (
              <span className="text-content-label truncate flex-1">Select a person...</span>
            )}
            <svg className="h-4 w-4 text-content-label shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <PersonPickerDialog
          open={assigneePickerOpen}
          onClose={() => setAssigneePickerOpen(false)}
          onSelectPerson={(result) => {
            setAssigneeId(result.personId);
            setAssigneeName(result.personName ?? '');
            setAssigneePickerOpen(false);
          }}
          contextLabel="Assign Person"
          contextRole={role || 'contributor'}
          organizationId={organizationId}
          currentUserId={actorId}
        />

        <Input
          label="Contribution Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Lyricist, Composer, Producer"
        />
        <p className="text-xs text-text-500 -mt-2">
          What this person contributes on this assignment only — not their organization security role.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <Select label="Priority" options={priorityOptions} value={priority} onChange={setPriority} />
          <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Input label="Est. Hours" type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="e.g. 8" />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Create Assignment</Button>
        </div>
      </div>
    </div>
  );
}
