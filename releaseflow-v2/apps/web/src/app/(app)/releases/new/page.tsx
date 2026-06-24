'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { collection, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { getStageTemplatesForReleaseType, initialStageStatus } from '@/lib/workflow-templates';
import { getRequirementNamesForReleaseType } from '@/lib/requirement-templates';
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeOrgId || !user) return;
    setSubmitting(true);
    const db = getDb();
    if (!db) return;

    const batch = writeBatch(db);

    const releaseRef = doc(collection(db, 'releases'));
    batch.set(releaseRef, {
      organizationId: activeOrgId,
      title,
      releaseType,
      status,
      targetReleaseDate: targetReleaseDate ? Timestamp.fromDate(new Date(targetReleaseDate)) : null,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const now = Timestamp.now();
    const templates = getStageTemplatesForReleaseType(releaseType as Release['releaseType']);

    const workflowRef = doc(collection(db, 'workflows'));
    let firstStageId: string | null = null;

    batch.set(workflowRef, {
      releaseId: releaseRef.id,
      templateId: releaseType,
      status: templates.length > 0 ? 'in_progress' : 'completed',
      progress: 0,
      currentStageId: null,
      startedAt: now,
      updatedAt: now,
    });

    for (const tpl of templates) {
      const ref = doc(collection(db, 'stages'));
      if (tpl.order === 1) firstStageId = ref.id;
      batch.set(ref, {
        workflowId: workflowRef.id,
        name: tpl.name,
        order: tpl.order,
        status: tpl.order === 1 ? 'in_progress' : initialStageStatus,
        startedAt: tpl.order === 1 ? now : null,
        dueDate: null,
        assignedRole: tpl.assignedRole ?? null,
        completedAt: null,
      });
    }

    if (firstStageId) {
      batch.update(workflowRef, { currentStageId: firstStageId });
    }

    const reqNames = getRequirementNamesForReleaseType(releaseType as Release['releaseType']);
    for (const reqName of reqNames) {
      const ref = doc(collection(db, 'release_requirements'));
      batch.set(ref, {
        releaseId: releaseRef.id,
        name: reqName,
        status: 'required',
        createdAt: now,
        updatedAt: now,
      });
    }

    const activityRef = doc(collection(db, 'activities'));
    batch.set(activityRef, {
      type: 'release.created',
      releaseId: releaseRef.id,
      workflowId: workflowRef.id,
      stageId: null,
      actorId: user.uid,
      metadata: { title, releaseType },
      createdAt: now,
    });

    if (templates.length > 0) {
      const wfActivityRef = doc(collection(db, 'activities'));
      batch.set(wfActivityRef, {
        type: 'workflow.generated',
        releaseId: releaseRef.id,
        workflowId: workflowRef.id,
        stageId: null,
        actorId: user.uid,
        metadata: { stageCount: templates.length },
        createdAt: Timestamp.now(),
      });
    }

    await batch.commit();
    router.push(`/releases/${releaseRef.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/releases" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 inline-block">&larr; Back to releases</Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">New Release</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Release title"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Release Type</label>
          <select value={releaseType} onChange={(e) => setReleaseType(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900">
            {releaseTypes.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900">
            {releaseStatuses.map((rs) => <option key={rs.value} value={rs.value}>{rs.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Target Release Date <span className="text-zinc-400 font-normal">(optional)</span></label>
          <input type="date" value={targetReleaseDate} onChange={(e) => setTargetReleaseDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        {!activeOrgId && <p className="text-sm text-amber-600">Select an organization on the dashboard first to create a release.</p>}
        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={submitting || !activeOrgId || !title.trim()}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Creating...' : 'Create Release'}
          </button>
          <Link href="/releases" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
