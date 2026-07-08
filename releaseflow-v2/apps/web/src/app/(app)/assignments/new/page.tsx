'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { createNewAssignment } from '@/lib/assignment-service';
import { Button, Input, TextArea, Select, Card } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

const entityTypeOptions = [
  { value: 'release', label: 'Release' },
  { value: 'track', label: 'Track' },
  { value: 'work', label: 'Work' },
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

export default function NewAssignmentPage() {
  const router = useRouter();
  const { activeOrgId } = useOrgStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState('release');
  const [entityId, setEntityId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [role, setRole] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeOrgId) { toast.error('No organization selected'); return; }
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!assigneeId.trim()) { toast.error('Assignee is required'); return; }
    if (!entityId.trim()) { toast.error('Entity is required'); return; }

    setLoading(true);
    try {
      const assignment = await createNewAssignment({
        organizationId: activeOrgId,
        title: title.trim(),
        description: description.trim() || null,
        entityType: entityType as 'release' | 'track' | 'work' | 'media_asset' | 'artist' | 'label' | 'person',
        entityId: entityId.trim(),
        assigneeId: assigneeId.trim(),
        assignerId: assigneeId.trim(),
        role: role.trim() || 'contributor',
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: dueDate ? new Date(dueDate) : null,
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

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-6">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">New Assignment</p>
        <p className="mt-1 text-sm text-text-400">Create a new task assignment.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mix final master" required />
          <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details about this assignment..." />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Entity Type" options={entityTypeOptions} value={entityType} onChange={setEntityType} />
            <Input label="Entity ID" value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="e.g. release_abc123" required />
          </div>

          <Input label="Assignee (Person ID)" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} placeholder="e.g. person_xyz" required />
          <Input label="Role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Producer, Engineer" />

          <div className="grid grid-cols-3 gap-4">
            <Select label="Priority" options={priorityOptions} value={priority} onChange={setPriority} />
            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Input label="Est. Hours" type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="e.g. 8" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={loading}>Create Assignment</Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
