'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePerson } from '@/hooks/usePerson';
import { useOrgStore } from '@/stores/org-store';

import {
  editPerson, archivePerson as serviceArchive, restorePerson as serviceRestore,
} from '@/lib/person-service';
import { uploadPersonImage, removePersonImage } from '@/lib/person-media-service';
import { getAssignmentsByAssignee, getAssignmentsByEntity } from '@/lib/assignment-repository';
import type { AssignmentRecord } from '@/lib/assignment-repository';
import {
  Avatar, Badge, Button, Card, EmptyState, Input, StatusBadge, TextArea, Select, Tabs,
  WorkspaceLayout, Skeleton, ConfirmationDialog, LoadingState,
} from '@releaseflow/ui';
import {
  OperationalSummary, ReadinessStack, ContextRail, HealthRing,
} from '@releaseflow/domain-ui';
import { EntityOverflowMenu } from '@/components/entity-overflow-menu';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/stores/toast-store';

const employmentTypeOptions = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'intern', label: 'Intern' },
];

const invitationStatusLabels: Record<string, { label: string; variant: 'pending' | 'active' | 'archived' | 'warning' }> = {
  invited: { label: 'Invited', variant: 'pending' },
  pending: { label: 'Invitation Pending', variant: 'pending' },
  accepted: { label: 'Accepted', variant: 'active' },
  declined: { label: 'Declined', variant: 'archived' },
  expired: { label: 'Expired', variant: 'warning' },
  revoked: { label: 'Revoked', variant: 'archived' },
};

const SKILL_OPTIONS = [
  'Producer', 'Mix Engineer', 'Mastering Engineer', 'Composer', 'Songwriter',
  'A&R', 'Designer', 'Photographer', 'Videographer', 'Marketing', 'Project Manager',
  'Recording Engineer', 'Vocalist', 'Instrumentalist', 'Arranger', 'DJ',
];

type TabId = 'overview' | 'assignments' | 'activity' | 'permissions';

function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    const obj = value as { seconds?: number; toDate?(): Date };
    if (typeof obj.seconds === 'number') return new Date(obj.seconds * 1000).toLocaleDateString();
    if (typeof obj.toDate === 'function') return obj.toDate().toLocaleDateString();
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  } catch {
    return '';
  }
}

const statusColors: Record<string, string> = {
  draft: 'bg-surface-800 text-text-500',
  assigned: 'bg-primary-500/10 text-primary-400',
  accepted: 'bg-info-500/10 text-info-400',
  in_progress: 'bg-warning-500/10 text-warning-600',
  review: 'bg-accent-500/10 text-accent-400',
  completed: 'bg-success-500/10 text-success-600',
  declined: 'bg-danger-500/10 text-danger-600',
  cancelled: 'bg-surface-800 text-text-500',
  archived: 'bg-surface-800 text-text-500',
};

const priorityColors: Record<string, string> = {
  low: 'bg-surface-800 text-text-500',
  medium: 'bg-primary-500/10 text-primary-400',
  high: 'bg-warning-500/10 text-warning-600',
  urgent: 'bg-danger-500/10 text-danger-600',
};

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { activeOrgId } = useOrgStore();
  const { user } = useAuth();
  const {
    person, memberships, activities, readiness, assignmentSummary, loading, refresh,
  } = usePerson(id);

  const [personAssignments, setPersonAssignments] = useState<AssignmentRecord[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [assignedReleases, setAssignedReleases] = useState<{ id: string; title: string }[]>([]);
  const [assignedTracks, setAssignedTracks] = useState<{ id: string; title: string }[]>([]);
  const [loadingWorkload, setLoadingWorkload] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editLegalName, setEditLegalName] = useState('');
  const [editPreferredName, setEditPreferredName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTimezone, setEditTimezone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editEmploymentType, setEditEmploymentType] = useState('full_time');
  const [editPrimaryRole, setEditPrimaryRole] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editLanguages, setEditLanguages] = useState('');
  const [tab, setTab] = useState<TabId>('overview');

  const [archiveDialog, setArchiveDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (person) {
      setEditDisplayName(person.displayName ?? '');
      setEditLegalName(person.legalName ?? '');
      setEditPreferredName(person.preferredName ?? '');
      setEditEmail(person.email ?? '');
      setEditPhone(person.phone ?? '');
      setEditTimezone(person.timezone ?? '');
      setEditDepartment(person.department ?? '');
      setEditPosition(person.position ?? '');
      setEditEmploymentType(person.employmentType ?? 'full_time');
      setEditPrimaryRole(person.primaryRole ?? '');
      setEditBio(person.bio ?? '');
      setEditSkills(person.skills ?? []);
      setEditLanguages((person.languages ?? []).join(', '));
    }
  }, [person]);

  useEffect(() => {
    let cancelled = false;
    async function loadAssignments() {
      if (!id) return;
      setLoadingAssignments(true);
      try {
        const data = await getAssignmentsByAssignee(id, activeOrgId ?? undefined);
        if (!cancelled) setPersonAssignments(data);
      } catch {
        if (!cancelled) setPersonAssignments([]);
      } finally {
        if (!cancelled) setLoadingAssignments(false);
      }
    }
    void loadAssignments();
    return () => { cancelled = true; };
  }, [id, activeOrgId]);

  useEffect(() => {
    let cancelled = false;
    async function loadWorkload() {
      if (!id || !activeOrgId) return;
      setLoadingWorkload(true);
      try {
        const [relAssigns, trkAssigns] = await Promise.all([
          getAssignmentsByEntity('release', id),
          getAssignmentsByEntity('track', id),
        ]);
        if (!cancelled) {
          const uniqueReleaseIds = [...new Set(relAssigns.map((a) => a.entityId))];
          const uniqueTrackIds = [...new Set(trkAssigns.map((a) => a.entityId))];
          setAssignedReleases(uniqueReleaseIds.map((rid) => ({ id: rid, title: rid })));
          setAssignedTracks(uniqueTrackIds.map((tid) => ({ id: tid, title: tid })));
        }
      } catch {
        if (!cancelled) {
          setAssignedReleases([]);
          setAssignedTracks([]);
        }
      } finally {
        if (!cancelled) setLoadingWorkload(false);
      }
    }
    void loadWorkload();
    return () => { cancelled = true; };
  }, [id, activeOrgId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;
    await editPerson(id, {
      displayName: editDisplayName.trim() || undefined,
      legalName: editLegalName.trim() || null,
      preferredName: editPreferredName.trim() || null,
      email: editEmail.trim() || undefined,
      phone: editPhone.trim() || null,
      timezone: editTimezone.trim() || null,
      department: editDepartment.trim() || null,
      position: editPosition.trim() || null,
      employmentType: editEmploymentType,
      primaryRole: editPrimaryRole.trim() || undefined,
      bio: editBio.trim() || null,
      skills: editSkills.length > 0 ? editSkills : null,
      languages: editLanguages ? editLanguages.split(',').map((l) => l.trim()).filter(Boolean) : null,
    });
    setEditing(false);
    await refresh();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeOrgId || !person) return;
    setUploading(true);
    try {
      await uploadPersonImage(activeOrgId, id, file, user?.uid ?? '');
      toast.success('Profile photo updated');
      await refresh();
    } catch (err) {
      toast.error('Upload failed', (err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveImage() {
    try {
      await removePersonImage(id);
      toast.success('Profile photo removed');
      await refresh();
    } catch (err) {
      toast.error('Remove failed', (err as Error).message);
    }
  }

  const handleArchive = useCallback(async () => {
    setActionLoading(true);
    try {
      await serviceArchive(id);
      setArchiveDialog(false);
      await refresh();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }, [id, refresh]);

  const handleRestore = useCallback(async () => {
    setActionLoading(true);
    try {
      await serviceRestore(id);
      setRestoreDialog(false);
      await refresh();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }, [id, refresh]);

  const confirmDelete = useCallback(async () => {
    if (!activeOrgId) return;
    setActionLoading(true);
    try {
      await serviceArchive(id);
      setDeleteDialog(false);
      router.push('/people');
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  }, [activeOrgId, id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-surface-50">
        <div className="flex-1 max-w-6xl mx-auto px-6 py-8">
          <Skeleton className="h-4 w-24 mb-6" />
          <div className="flex items-start gap-6 mb-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-64" /></div>
          </div>
          <Skeleton variant="card" className="h-40" />
        </div>
      </div>
    );
  }

  if (!person) {
    return <div className="flex items-center justify-center py-20"><p className="text-text-400">Person not found.</p></div>;
  }

  const readinessItems = [
    { id: 'photo', category: 'Profile Photo', status: (person.avatarUrl ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: person.avatarUrl ? 'Uploaded' : 'Missing' },
    { id: 'name', category: 'Display Name', status: (person.displayName ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: person.displayName ? 'Set' : 'Missing' },
    { id: 'email', category: 'Email', status: (person.email ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: person.email || 'Missing' },
    { id: 'role', category: 'Role', status: (person.primaryRole && person.primaryRole !== '—' ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: person.primaryRole && person.primaryRole !== '—' ? person.primaryRole : 'Not specified' },
    { id: 'department', category: 'Department', status: (person.department ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: person.department || 'Not set' },
    { id: 'skills', category: 'Skills', status: ((person.skills?.length ?? 0) > 0 ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: person.skills ? person.skills.join(', ') : 'None listed' },
  ];

  const readinessCategories: Record<string, { status: 'ready' | 'not-ready'; description?: string; guidance?: string }> = {};
  for (const item of readinessItems) {
    readinessCategories[item.category] = { status: item.status, description: item.description };
  }

  const healthPct = readiness?.percentage ?? Math.round(
    (readinessItems.filter((i) => i.status === 'ready').length / Math.max(1, readinessItems.length)) * 100,
  );

  const overflowMenuItems = [
    { id: 'edit', label: 'Edit', onClick: () => setEditing(true) },
    ...(person.status === 'archived'
      ? [{ id: 'restore', label: 'Restore', onClick: () => setRestoreDialog(true) }]
      : [{ id: 'archive', label: 'Archive', onClick: () => setArchiveDialog(true) }]
    ),
    { id: 'delete', label: 'Delete', variant: 'danger' as const, onClick: () => setDeleteDialog(true), separatorBefore: true },
  ];

  const invStatus = person.invitationStatus ? invitationStatusLabels[person.invitationStatus] : null;

  const contextRailContent = (
    <div className="p-4 space-y-6">
      <HealthRing size="md" health={healthPct} readiness={healthPct} timelineConfidence={100} workflowCompletion={healthPct} currentStage={person.status} />
      <ReadinessStack categories={readinessCategories} />
      <ContextRail releaseName={person.displayName} releaseType={person.primaryRole} currentStage={person.status} releaseDate={person.department ?? 'No department'} health={healthPct} attentionItems={readiness?.missing.map((m, i) => ({ id: `missing-${i}`, label: m, type: 'deadline' as const })) ?? []} />
      {assignmentSummary && (
        <div className="space-y-2 pt-4 border-t border-surface-700/60">
          <p className="text-xs font-semibold text-text-400 uppercase tracking-wider">Assignments</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-text-500">Current:</span>
            <span className="text-surface-50 text-right">{assignmentSummary.current}</span>
            <span className="text-text-500">Completed:</span>
            <span className="text-surface-50 text-right">{assignmentSummary.completed}</span>
            <span className="text-text-500">Overdue:</span>
            <span className="text-surface-50 text-right">{assignmentSummary.overdue}</span>
            <span className="text-text-500">Upcoming:</span>
            <span className="text-surface-50 text-right">{assignmentSummary.upcoming}</span>
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'assignments', label: 'Assignments', count: assignmentSummary ? assignmentSummary.current + assignmentSummary.upcoming : undefined },
    { id: 'activity', label: 'Activity' },
    { id: 'permissions', label: 'Permissions' },
  ];

  const activeAssignments = useMemo(() => personAssignments.filter((a) => !['completed', 'archived', 'cancelled', 'declined'].includes(a.status)), [personAssignments]);
  const completedAssignments = useMemo(() => personAssignments.filter((a) => a.status === 'completed'), [personAssignments]);

  return (
    <WorkspaceLayout contextRail={contextRailContent}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/people" className="text-sm text-text-400 hover:text-surface-50 inline-block">&larr; Back to people</Link>
          <EntityOverflowMenu items={overflowMenuItems} aria-label="Person actions" />
        </div>

        {/* ===== Hero ===== */}
        <header className="mb-12">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <Avatar name={person.displayName} src={person.avatarUrl ?? undefined} size="xl" />
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-7 w-7 rounded-full bg-surface-900 border border-surface-700 flex items-center justify-center hover:bg-surface-700 transition-colors"
                  title="Upload photo"
                >
                  <svg className="h-3.5 w-3.5 text-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {person.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="h-7 w-7 rounded-full bg-surface-900 border border-surface-700 flex items-center justify-center hover:bg-danger-600/20 transition-colors"
                    title="Remove photo"
                  >
                    <svg className="h-3.5 w-3.5 text-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpg,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              {uploading && <div className="absolute inset-0 rounded-full bg-surface-900/60 flex items-center justify-center"><Skeleton className="h-8 w-8 rounded-full" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-display-md font-semibold text-primary-400 tracking-tight">{person.displayName}</h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="text-sm text-text-400">{person.primaryRole}</span>
                    {person.department && <span className="text-sm text-text-500">&middot; {person.department}</span>}
                    <StatusBadge status={person.status} />
                    {person.employmentType && (
                      <Badge label={employmentTypeOptions.find((o) => o.value === person.employmentType)?.label ?? person.employmentType} color="bg-primary-500/10 text-primary-400" size="sm" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-text-500">
                    {person.preferredName && <span>Preferred: <span className="text-surface-100">{person.preferredName}</span></span>}
                    {person.email && <span>Email: <span className="text-surface-100">{person.email}</span></span>}
                  </div>
                  {invStatus && (
                    <div className="mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        invStatus.variant === 'active' ? 'bg-success-500/10 text-success-600' :
                        invStatus.variant === 'pending' ? 'bg-warning-500/10 text-warning-600' :
                        invStatus.variant === 'archived' ? 'bg-surface-800 text-text-500' :
                        'bg-surface-800 text-text-500'
                      }`}>
                        {invStatus.label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <Button variant="primary" size="md" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                <span className={`text-xs font-medium ${healthPct >= 80 ? 'text-success-600' : healthPct >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>
                  {healthPct >= 80 ? 'Complete' : healthPct >= 50 ? 'In Progress' : 'Needs Work'} &middot; {healthPct}%
                </span>
                <span className="text-xs text-text-500">
                  {memberships.length} organizations
                </span>
              </div>
              {person.bio && (
                <p className="text-sm text-text-400 mt-3 line-clamp-2">{person.bio}</p>
              )}
            </div>
          </div>
        </header>

        {/* ===== Health ===== */}
        <div className="mb-14">
          <OperationalSummary healthScore={healthPct} currentStage={person.status} completedStages={assignmentSummary?.completed ?? 0} totalStages={Math.max(1, (assignmentSummary?.current ?? 0) + (assignmentSummary?.completed ?? 0))} readyItems={readinessItems.filter((i) => i.status === 'ready').length} totalItems={readinessItems.length} pendingApprovals={0} blockers={assignmentSummary?.overdue ?? 0} daysUntilRelease={assignmentSummary?.upcoming ?? 0} />
        </div>

        <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as TabId)} variant="underline" className="mb-8" />

        {/* ===== Overview Tab ===== */}
        {tab === 'overview' && (
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-primary-400">Profile</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
              </div>
              {editing ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Display Name" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} required />
                    <Input label="Preferred Name" value={editPreferredName} onChange={(e) => setEditPreferredName(e.target.value)} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Legal Name" value={editLegalName} onChange={(e) => setEditLegalName(e.target.value)} />
                    <Input label="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                    <Input label="Timezone" value={editTimezone} onChange={(e) => setEditTimezone(e.target.value)} placeholder="e.g. America/New_York" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Department" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} placeholder="e.g. Production, A&R" />
                    <Input label="Position" value={editPosition} onChange={(e) => setEditPosition(e.target.value)} placeholder="e.g. Senior Engineer" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input label="Primary Role" value={editPrimaryRole} onChange={(e) => setEditPrimaryRole(e.target.value)} placeholder="e.g. Mastering Engineer" />
                    <Select label="Employment Type" options={employmentTypeOptions} value={editEmploymentType} onChange={(v) => setEditEmploymentType(v)} />
                  </div>
                  <TextArea label="Bio" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} />
                  <div>
                    <p className="text-xs font-medium text-text-400 mb-1.5">Skills</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {SKILL_OPTIONS.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            setEditSkills((prev) =>
                              prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
                            );
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            editSkills.includes(skill)
                              ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30'
                              : 'bg-surface-800 text-text-500 border border-surface-700/60 hover:border-primary-500/30'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                    <Input
                      label="Custom Skills (comma-separated)"
                      value={editSkills.filter((s) => !SKILL_OPTIONS.includes(s)).join(', ')}
                      onChange={(e) => {
                        const custom = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        const standard = editSkills.filter((s) => SKILL_OPTIONS.includes(s));
                        setEditSkills([...standard, ...custom]);
                      }}
                      placeholder="Add custom skills..."
                    />
                  </div>
                  <Input label="Languages (comma-separated)" value={editLanguages} onChange={(e) => setEditLanguages(e.target.value)} />
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" size="sm">Save Changes</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <Card>
                  <div className="space-y-4">
                    {person.bio && <div><p className="text-sm text-text-400 mb-1">Bio</p><p className="text-sm text-surface-100 whitespace-pre-wrap">{person.bio}</p></div>}
                    <div className="grid grid-cols-2 gap-4">
                      {person.preferredName && <div><p className="text-xs text-text-400">Preferred Name</p><p className="text-sm text-surface-100">{person.preferredName}</p></div>}
                      {person.legalName && <div><p className="text-xs text-text-400">Legal Name</p><p className="text-sm text-surface-100">{person.legalName}</p></div>}
                      {person.email && <div><p className="text-xs text-text-400">Email</p><p className="text-sm text-surface-100">{person.email}</p></div>}
                      {person.phone && <div><p className="text-xs text-text-400">Phone</p><p className="text-sm text-surface-100">{person.phone}</p></div>}
                      {person.timezone && <div><p className="text-xs text-text-400">Timezone</p><p className="text-sm text-surface-100">{person.timezone}</p></div>}
                      {person.department && <div><p className="text-xs text-text-400">Department</p><p className="text-sm text-surface-100">{person.department}</p></div>}
                      {person.position && <div><p className="text-xs text-text-400">Position</p><p className="text-sm text-surface-100">{person.position}</p></div>}
                      {person.employmentType && <div><p className="text-xs text-text-400">Employment Type</p><p className="text-sm text-surface-100">{employmentTypeOptions.find((o) => o.value === person.employmentType)?.label ?? person.employmentType}</p></div>}
                    </div>
                    {person.skills && person.skills.length > 0 && (
                      <div>
                        <p className="text-xs text-text-400 mb-1.5">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {person.skills.map((skill) => (
                            <span key={skill} className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary-500/10 text-primary-400 border border-primary-500/30">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {person.languages && person.languages.length > 0 && (
                      <div><p className="text-xs text-text-400">Languages</p><p className="text-sm text-surface-100">{person.languages.join(', ')}</p></div>
                    )}
                    {!person.bio && !person.preferredName && !person.legalName && !person.phone && !person.timezone && !person.department && !person.position && !person.skills?.length && !person.languages?.length && (
                      <p className="text-sm text-text-500">No profile details yet.</p>
                    )}
                  </div>
                </Card>
              )}
            </section>

            {/* ===== Assigned Releases ===== */}
            <section>
              <h2 className="text-base font-semibold text-primary-400 mb-4">Assigned Releases</h2>
              {loadingWorkload ? (
                <Card><Skeleton className="h-12 w-full" /></Card>
              ) : assignedReleases.length === 0 ? (
                <Card><p className="text-sm text-text-500">No releases assigned to this person.</p></Card>
              ) : (
                <div className="space-y-2">
                  {assignedReleases.map((r) => (
                    <Link key={r.id} href={`/releases/${r.id}`} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors">
                      <span className="text-sm font-medium text-primary-400">{r.title}</span>
                      <span className="text-xs text-text-500">Release</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* ===== Assigned Tracks ===== */}
            <section>
              <h2 className="text-base font-semibold text-primary-400 mb-4">Assigned Tracks</h2>
              {loadingWorkload ? (
                <Card><Skeleton className="h-12 w-full" /></Card>
              ) : assignedTracks.length === 0 ? (
                <Card><p className="text-sm text-text-500">No tracks assigned to this person.</p></Card>
              ) : (
                <div className="space-y-2">
                  {assignedTracks.map((t) => (
                    <Link key={t.id} href={`/tracks/${t.id}`} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors">
                      <span className="text-sm font-medium text-primary-400">{t.title}</span>
                      <span className="text-xs text-text-500">Track</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ===== Assignments Tab ===== */}
        {tab === 'assignments' && (
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Assignments</h2>
            {assignmentSummary ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <Card>
                  <p className="text-xs text-text-400">Current</p>
                  <p className="text-display-sm font-semibold text-primary-400">{assignmentSummary.current}</p>
                </Card>
                <Card>
                  <p className="text-xs text-text-400">Upcoming</p>
                  <p className="text-display-sm font-semibold text-warning-600">{assignmentSummary.upcoming}</p>
                </Card>
                <Card>
                  <p className="text-xs text-text-400">Completed</p>
                  <p className="text-display-sm font-semibold text-success-600">{assignmentSummary.completed}</p>
                </Card>
                <Card>
                  <p className="text-xs text-text-400">Overdue</p>
                  <p className="text-display-sm font-semibold text-danger-600">{assignmentSummary.overdue}</p>
                </Card>
              </div>
            ) : (
              <Card className="mb-8">
                <p className="text-sm text-text-500">Loading assignment data...</p>
              </Card>
            )}

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-primary-400 mb-3">Current Assignments</h3>
                {loadingAssignments ? (
                  <LoadingState />
                ) : activeAssignments.length === 0 ? (
                  <EmptyState title="No active assignments" description="This person has no active assignments." />
                ) : (
                  <div className="space-y-2">
                    {activeAssignments.map((a) => (
                      <Link key={a.id} href={`/assignments/${a.id}`} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 hover:border-primary-200 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
                          <p className="text-xs text-text-500 capitalize">{a.entityType} &middot; {a.role}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[a.priority] ?? ''}`}>{a.priority}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] ?? ''}`}>{a.status.replace(/_/g, ' ')}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-primary-400 mb-3">Assignment History</h3>
                {loadingAssignments ? (
                  <LoadingState />
                ) : completedAssignments.length === 0 ? (
                  <EmptyState title="No completed assignments" description="Completed assignments will appear here." />
                ) : (
                  <div className="space-y-2">
                    {completedAssignments.slice(0, 20).map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3 opacity-75">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary-400 truncate">{a.title}</p>
                          <p className="text-xs text-text-500 capitalize">{a.entityType} &middot; {a.role}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-success-500/10 text-success-600`}>Completed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ===== Activity Tab ===== */}
        {tab === 'activity' && (
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Activity</h2>
            {activities.length === 0 ? (
              <EmptyState title="No activity" description="Activity will appear when this person is assigned work or their profile is updated." />
            ) : (
              <div className="space-y-1">
                {activities.slice(0, 20).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-700/60 pl-3 py-1">
                    <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
                    <div>
                      <p className="text-sm text-surface-100 capitalize">{a.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-500">{a.actorId} &middot; {formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===== Permissions Tab ===== */}
        {tab === 'permissions' && (
          <section>
            <h2 className="text-base font-semibold text-primary-400 mb-4">Permissions</h2>
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-400">Organization Role</p>
                  <p className="text-sm text-surface-100">{person.primaryRole || 'Not assigned'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-400">Department</p>
                  <p className="text-sm text-surface-100">{person.department || 'Not set'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-400">Employment Type</p>
                  <p className="text-sm text-surface-100 capitalize">{person.employmentType?.replace(/_/g, ' ') || 'Not set'}</p>
                </div>
                <div className="border-t border-surface-700/60 pt-4">
                  <p className="text-xs text-text-500">Workspace permissions and custom role management will be available in a future update.</p>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>

      <ConfirmationDialog open={archiveDialog} onClose={() => setArchiveDialog(false)} onConfirm={handleArchive} title="Archive Person" message="Archived people will not appear in normal pickers but remain historically referenced." confirmLabel="Archive" loading={actionLoading} />
      <ConfirmationDialog open={restoreDialog} onClose={() => setRestoreDialog(false)} onConfirm={handleRestore} title="Restore Person" message="Restore this person to active status." confirmLabel="Restore" variant="default" loading={actionLoading} />
      <ConfirmationDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={confirmDelete} title="Delete Person" message="This will archive the person. Use the Recovery Center to restore if needed." confirmLabel="Archive" variant="danger" loading={actionLoading} />
    </WorkspaceLayout>
  );
}
