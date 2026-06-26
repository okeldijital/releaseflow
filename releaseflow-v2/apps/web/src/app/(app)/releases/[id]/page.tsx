'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { fmtDate } from '@/lib/utils';
import { computeProgress } from '@/lib/workflow-progress';
import { stageComplete } from '@/lib/workflow-progression';
import { createTask, completeTask, getTasksByStage, assignTask, unassignTask } from '@/lib/task-service';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { computeReadiness } from '@/lib/readiness-engine';
import { getRequirementsByRelease, submitRequirement, approveRequirement } from '@/lib/requirement-service';
import { getDeliverablesByRelease } from '@/lib/deliverable-service';
import { checkDistributionReadiness, generateDistributionPackage, getLatestDistributionPackage } from '@/lib/distribution-service';
import { validateReleaseOwnership } from '@/lib/rights-service';
import type { OwnershipValidation } from '@/lib/rights-service';
import { getDependenciesByRelease } from '@/lib/dependency-service';
import { updateReleaseStatus } from '@/lib/release-service';
import {
  Card, Badge, StatusBadge, ProgressBar, Button, EmptyState, LoadingState, Avatar, Skeleton,
  WorkspaceLayout,
} from '@releaseflow/ui';
import type { Release, ReleaseStatus, Workflow, Stage, Task, ReleaseRequirement, Deliverable, Dependency, DistributionPackage } from '../../types';

const priorityStyles: Record<string, string> = {
  low: 'bg-surface-100 text-text-500', medium: 'bg-info-50 text-info-500',
  high: 'bg-warning-50 text-warning-500', critical: 'bg-danger-50 text-danger-500',
};

const TABS = ['Overview', 'Workflow', 'Tasks', 'Deliverables', 'Dependencies', 'Activity'] as const;
type Tab = typeof TABS[number];

const STATUS_TRANSITIONS: Record<string, { label: string; status: ReleaseStatus; destructive?: boolean; needsReason?: boolean }[]> = {
  draft: [
    { label: 'Begin Planning', status: 'planning' },
    { label: 'Cancel Release', status: 'cancelled', destructive: true },
  ],
  planning: [
    { label: 'Start Production', status: 'in_production' },
    { label: 'Cancel Release', status: 'cancelled', destructive: true },
  ],
  in_production: [
    { label: 'Put On Hold', status: 'on_hold', needsReason: true },
    { label: 'Mark Ready', status: 'ready_for_distribution' },
    { label: 'Cancel Release', status: 'cancelled', destructive: true },
  ],
  on_hold: [
    { label: 'Resume Production', status: 'in_production' },
    { label: 'Cancel Release', status: 'cancelled', destructive: true },
  ],
  ready_for_distribution: [
    { label: 'Publish Release', status: 'released' },
    { label: 'Re-Open Release', status: 'in_production' },
    { label: 'Cancel Release', status: 'cancelled', destructive: true },
  ],
};

const distChip = (ok: boolean, label: string, missing: number) => (
  <span className={`rounded-full px-2 py-0.5 text-xs ${ok ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'}`}>
    {ok ? '✓' : '✗'} {label}{missing > 0 ? ` (${missing} missing)` : ''}
  </span>
);

export default function ReleaseDetailPage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tab, setTab] = useState<Tab>('Overview');
  const [release, setRelease] = useState<Release | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasksByStage, setTasksByStage] = useState<Record<string, Task[]>>({});
  const [requirements, setRequirements] = useState<ReleaseRequirement[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [distPackage, setDistPackage] = useState<DistributionPackage | null>(null);
  const [ownership, setOwnership] = useState<OwnershipValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [confirmTransition, setConfirmTransition] = useState<{ label: string; status: ReleaseStatus; destructive?: boolean; needsReason?: boolean } | null>(null);
  const [updating, setUpdating] = useState(false);

  const actorId = user?.uid ?? 'unknown';

  useEffect(() => {
    async function load() {
      const db = getDb();
      if (!db) return;
      const relSnap = await getDoc(doc(db, 'releases', id));
      if (!relSnap.exists()) { setLoading(false); return; }

      const releaseData = { id: relSnap.id, ...relSnap.data() } as Release;
      if (activeOrgId && releaseData.organizationId && releaseData.organizationId !== activeOrgId) {
        setForbidden(true); setLoading(false); return;
      }
      setRelease(releaseData);

      const wfSnap = (await Promise.all([
        getDocs(query(collection(db, 'workflows'), where('releaseId', '==', id), limit(1))),
      ]))[0];

      if (!wfSnap.empty) {
        const wfDoc = wfSnap.docs[0];
        if (wfDoc) {
          const wf = { id: wfDoc.id, ...wfDoc.data() } as Workflow;
          setWorkflow(wf);
          const stageSnap = await getDocs(query(collection(db, 'stages'), where('workflowId', '==', wf.id), orderBy('order', 'asc')));
          const stageList = stageSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Stage);
          setStages(stageList);
          const tasksMap: Record<string, Task[]> = {};
          for (const s of stageList) tasksMap[s.id] = await getTasksByStage(s.id);
          setTasksByStage(tasksMap);
        }
      }

      const [reqData, delData, depData, pkg, ownershipValidation] = await Promise.all([
        getRequirementsByRelease(id),
        getDeliverablesByRelease(id),
        getDependenciesByRelease(id),
        getLatestDistributionPackage(id),
        validateReleaseOwnership(id),
      ]);
      setRequirements(reqData);
      setDeliverables(delData);
      setDependencies(depData);
      setDistPackage(pkg);
      setOwnership(ownershipValidation);
      setLoading(false);
    }
    load();
  }, [id, activeOrgId]);

  async function handleCompleteStage(stageId: string) {
    if (!workflow) return;
    setCompleting(stageId);
    try {
      await stageComplete(workflow.id, stageId, id, actorId);
      const db = getDb(); if (!db) return;
      const wfSnap = await getDoc(doc(db, 'workflows', workflow.id));
      if (wfSnap.exists()) setWorkflow({ id: wfSnap.id, ...wfSnap.data() } as Workflow);
      const sSnap = await getDocs(query(collection(db, 'stages'), where('workflowId', '==', workflow.id), orderBy('order', 'asc')));
      setStages(sSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Stage));
    } catch (err) { console.error(err); }
    finally { setCompleting(null); }
  }

  async function handleAddTask(stageId: string, e: FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setCreatingTask(true);
    try {
      await createTask(stageId, id, actorId, { title: newTaskTitle.trim(), priority: newTaskPriority as Task['priority'], assigneeId: newTaskAssignee.trim() || undefined });
      const updated = await getTasksByStage(stageId);
      setTasksByStage((prev) => ({ ...prev, [stageId]: updated }));
      setNewTaskTitle(''); setNewTaskPriority('medium'); setNewTaskAssignee('');
    } catch (err) { console.error(err); } finally { setCreatingTask(false); }
  }

  async function handleCompleteTask(stageId: string, taskId: string) {
    await completeTask(taskId, id, stageId, actorId);
    const updated = await getTasksByStage(stageId);
    setTasksByStage((prev) => ({ ...prev, [stageId]: updated }));
  }

  async function handleAssignTask(stageId: string, taskId: string, assigneeId: string) {
    if (!assigneeId.trim()) await unassignTask(taskId, id, stageId, actorId);
    else await assignTask(taskId, assigneeId.trim(), id, stageId, actorId);
    const updated = await getTasksByStage(stageId);
    setTasksByStage((prev) => ({ ...prev, [stageId]: updated }));
  }

  async function handleSubmitReq(reqId: string) { await submitRequirement(reqId); setRequirements(await getRequirementsByRelease(id)); }
  async function handleApproveReq(reqId: string) { await approveRequirement(reqId); setRequirements(await getRequirementsByRelease(id)); }
  async function handleGeneratePackage() { await generateDistributionPackage(id); setDistPackage(await getLatestDistributionPackage(id)); }

  async function handleDelete() {
    if (!confirm('Are you sure?')) return;
    const db = getDb(); if (!db) return;
    await deleteDoc(doc(db, 'releases', id));
    router.push('/releases');
  }

  async function handleStatusTransition(status: ReleaseStatus, reason?: string) {
    setUpdating(true);
    try {
      const metadata: Record<string, unknown> = {};
      if (status === 'cancelled' && release) metadata.previousStatus = release.status;
      if (reason) metadata.reason = reason;
      await updateReleaseStatus(id, status, actorId, reason ? metadata : undefined);
      setRelease((prev) => prev ? { ...prev, status } : prev);
    } catch (err) { console.error(err); }
    finally { setUpdating(false); }
  }

  if (loading) return (
    <div className="flex min-h-screen bg-surface-50">
      <div className="flex-1 max-w-6xl mx-auto px-6 py-8">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex gap-1 border-b border-surface-200 mb-6">
          <Skeleton className="h-8 w-20 mr-3" /><Skeleton className="h-8 w-20 mr-3" /><Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-6">
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="card" className="h-40" />
        </div>
      </div>
    </div>
  );
  if (forbidden) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-50 py-20">
      <p className="text-lg font-semibold text-text-900 mb-2">Access Denied</p>
      <p className="text-sm text-text-500 mb-4">You do not have permission to view this release.</p>
      <Link href="/dashboard" className="text-sm text-primary-500 underline underline-offset-4">Go to Dashboard</Link>
    </div>
  );
  if (!release) return <div className="flex min-h-screen items-center justify-center bg-surface-50"><EmptyState title="Release not found" /></div>;

  const progress = computeProgress(stages);
  const readiness = computeReadiness(requirements, stages, deliverables, dependencies);
  const distReadiness = checkDistributionReadiness(
    release, deliverables.length, deliverables.filter((d) => d.status === 'approved').length,
    requirements.length, requirements.filter((r) => r.status === 'approved').length,
    dependencies.filter((d) => d.blocking).length, dependencies.filter((d) => d.blocking && d.status === 'completed').length,
  );
  const allTasks = Object.values(tasksByStage).flat();
  const doneTasks = allTasks.filter((t) => t.status === 'done').length;
  const blockingDeps = dependencies.filter((d) => d.blocking);
  const completedBlockingDeps = blockingDeps.filter((d) => d.status === 'completed').length;

  const ContextRail = (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-1">Metadata</p>
        <div className="space-y-1 text-sm">
          <p className="text-text-500">Type: <span className="text-text-700 capitalize">{release.releaseType}</span></p>
          {release.upc ? <p className="text-text-500">UPC: <span className="text-text-700">{release.upc}</span></p> : null}
          {release.catalogNumber ? <p className="text-text-500">Catalog: <span className="text-text-700">{release.catalogNumber}</span></p> : null}
          {release.label ? <p className="text-text-500">Label: <span className="text-text-700">{release.label}</span></p> : null}
          {release.genre ? <p className="text-text-500">Genre: <span className="text-text-700">{release.genre}</span></p> : null}
          {release.language ? <p className="text-text-500">Lang: <span className="text-text-700">{release.language}</span></p> : null}
          {release.explicit ? <Badge label="Explicit" color="bg-danger-50 text-danger-500" /> : null}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-1">Status</p>
        <StatusBadge status={release.status} />
        {release.targetReleaseDate ? <p className="text-xs text-text-400 mt-1">Target: {fmtDate(release.targetReleaseDate)}</p> : null}
      </div>

      <div>
        <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-1">Readiness</p>
        <ProgressBar value={readiness.percentage} color={readiness.ready ? 'bg-success-500' : 'bg-warning-500'} showLabel />
      </div>

      {blockingDeps.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-1">Dependencies</p>
          <p className="text-sm text-text-500">{completedBlockingDeps}/{blockingDeps.length} cleared</p>
        </div>
      ) : null}

      {distPackage ? (
        <div>
          <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-1">Distribution</p>
          <StatusBadge status={distPackage.status} />
          <p className="text-xs text-text-400 mt-1">{distPackage.completeness}% complete</p>
        </div>
      ) : null}
    </div>
  );

  return (
    <WorkspaceLayout contextRail={ContextRail}>
      <div className="px-6 py-6">
        <Link href="/releases" className="text-sm text-text-500 hover:text-text-900 mb-4 inline-block">&larr; Back to releases</Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-900">{release.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge label={release.releaseType} color="bg-surface-100 text-text-700" />
              <div className="relative">
                <button type="button" onClick={() => { setStatusOpen(!statusOpen); setConfirmTransition(null); }} className="cursor-pointer">
                  <StatusBadge status={release.status} />
                </button>
                <div
                  className={`fixed inset-0 z-40 transition-opacity duration-150 ${statusOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  onClick={() => { setStatusOpen(false); setConfirmTransition(null); }}
                />
                <div className={`absolute top-full left-0 mt-1 z-50 w-52 bg-white dark:bg-surface-900 border border-surface-200 rounded-lg shadow-elevated overflow-hidden transition-all duration-200 ease-in-out ${statusOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                  {confirmTransition ? (
                    confirmTransition.destructive ? (
                      <div className="p-3">
                        <p className="text-sm text-text-700 mb-3">Cancel this release? This action cannot be undone.</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={async () => { await handleStatusTransition(confirmTransition.status); setStatusOpen(false); setConfirmTransition(null); }} disabled={updating} className="flex-1 rounded bg-danger-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-danger-600 disabled:opacity-50">Confirm</button>
                          <button type="button" onClick={() => setConfirmTransition(null)} className="flex-1 rounded border border-surface-300 px-3 py-1.5 text-xs font-medium text-text-700 hover:bg-surface-100">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3">
                        <input type="text" value={holdReason} onChange={(e) => setHoldReason(e.target.value)} placeholder="Reason (min 10 chars)" className="w-full rounded border border-surface-300 bg-white dark:bg-surface-800 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 mb-2" autoFocus />
                        <button type="button" onClick={async () => { await handleStatusTransition(confirmTransition.status, holdReason); setStatusOpen(false); setConfirmTransition(null); }} disabled={holdReason.trim().length < 10 || updating} className="w-full rounded bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50">Put On Hold</button>
                      </div>
                    )
                  ) : (
                    <div className="py-1">
                      {(STATUS_TRANSITIONS[release.status] ?? []).map((t) => (
                        <button key={t.status} type="button" onClick={() => { if (t.destructive || t.needsReason) { setConfirmTransition(t); if (t.needsReason) setHoldReason(''); } else { handleStatusTransition(t.status); setStatusOpen(false); } }} disabled={updating} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-100 text-text-700 disabled:opacity-50">{t.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {ownership ? (
                <span className={`text-xs rounded-full px-2 py-0.5 ${ownership.valid ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'}`}>
                  {ownership.valid ? 'Rights Ready' : 'Rights Incomplete'}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/releases/${id}/edit`} className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-text-700 hover:bg-surface-100">Edit</Link>
            <button onClick={handleDelete} className="rounded-lg border border-danger-300 px-4 py-2 text-sm font-medium text-danger-500 hover:bg-danger-50">Delete</button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-surface-200 mb-6 -mx-6 px-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors shrink-0 ${tab === t ? 'border-primary-500 text-primary-500' : 'border-transparent text-text-500 hover:text-text-700'}`}
            >{t}</button>
          ))}
        </div>

        {tab === 'Overview' ? <OverviewTab release={release} readiness={readiness} distReadiness={distReadiness} distPackage={distPackage} ownership={ownership} requirements={requirements} handleSubmitReq={handleSubmitReq} handleApproveReq={handleApproveReq} handleGeneratePackage={handleGeneratePackage} /> : null}

        {tab === 'Workflow' ? <WorkflowTab workflow={workflow} stages={stages} progress={progress} completing={completing} handleCompleteStage={handleCompleteStage} tasksByStage={tasksByStage} deliverables={deliverables} blockingDeps={blockingDeps.filter((d) => d.status !== 'completed')} completedBlockingDeps={completedBlockingDeps} /> : null}

        {tab === 'Tasks' ? <TasksTab stages={stages} tasksByStage={tasksByStage} doneTasks={doneTasks} allTasks={allTasks} newTaskTitle={newTaskTitle} setNewTaskTitle={setNewTaskTitle} newTaskPriority={newTaskPriority} setNewTaskPriority={setNewTaskPriority} newTaskAssignee={newTaskAssignee} setNewTaskAssignee={setNewTaskAssignee} creatingTask={creatingTask} handleAddTask={handleAddTask} handleCompleteTask={handleCompleteTask} handleAssignTask={handleAssignTask} /> : null}

        {tab === 'Deliverables' ? <DeliverablesTab deliverables={deliverables} /> : null}

        {tab === 'Dependencies' ? <DependenciesTab dependencies={dependencies} blockingDeps={blockingDeps} completedBlockingDeps={completedBlockingDeps} /> : null}

        {tab === 'Activity' ? <ActivityTab releaseId={id} /> : null}
      </div>
    </WorkspaceLayout>
  );
}

function OverviewTab({ release: _release, readiness, distReadiness, distPackage, ownership, requirements, handleSubmitReq, handleApproveReq, handleGeneratePackage }: {
  release: Release; readiness: ReturnType<typeof computeReadiness>; distReadiness: ReturnType<typeof checkDistributionReadiness>;
  distPackage: DistributionPackage | null; ownership: OwnershipValidation | null; requirements: ReleaseRequirement[];
  handleSubmitReq: (id: string) => void; handleApproveReq: (id: string) => void; handleGeneratePackage: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-900">Release Readiness</h2>
          <span className={`h-2.5 w-2.5 rounded-full ${readiness.ready ? 'bg-success-500' : readiness.percentage >= 70 ? 'bg-warning-500' : 'bg-danger-500'}`} />
        </div>
        <ProgressBar value={readiness.percentage} color={readiness.ready ? 'bg-success-500' : readiness.percentage >= 70 ? 'bg-warning-500' : 'bg-danger-500'} showLabel className="mb-3" />
        <div className="flex flex-wrap gap-2 text-xs mb-3">
          <span className="rounded bg-surface-100 px-2 py-1">Requirements {readiness.breakdown.requirements.approved}/{readiness.breakdown.requirements.total}</span>
          {readiness.breakdown.workflow ? <span className="rounded bg-surface-100 px-2 py-1">Workflow {readiness.breakdown.workflow.completed}/{readiness.breakdown.workflow.total}</span> : null}
          {readiness.breakdown.deliverables ? <span className="rounded bg-surface-100 px-2 py-1">Deliverables {readiness.breakdown.deliverables.approved}/{readiness.breakdown.deliverables.total}</span> : null}
          {readiness.breakdown.dependencies ? <span className="rounded bg-surface-100 px-2 py-1">Deps {readiness.breakdown.dependencies.completed}/{readiness.breakdown.dependencies.totalBlocking}</span> : null}
        </div>
        {readiness.missing.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {readiness.missing.map((m) => <span key={m} className="text-xs rounded bg-danger-50 text-danger-500 px-2 py-0.5">{m}</span>)}
          </div>
        ) : null}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-900">Distribution</h2>
          {distPackage ? <StatusBadge status={distPackage.status} /> : null}
        </div>
        <ProgressBar value={distReadiness.completeness} color={distReadiness.canDistribute ? 'bg-success-500' : 'bg-warning-500'} showLabel className="mb-3" />
        <div className="flex flex-wrap gap-2 text-xs mb-3">
          {distChip(distReadiness.metadataReady, 'Metadata', distReadiness.missingMetadata.length)}
          {distChip(distReadiness.deliverablesReady, 'Deliverables', distReadiness.missingDeliverables)}
          {distChip(distReadiness.requirementsReady, 'Requirements', distReadiness.missingRequirements)}
          {distChip(distReadiness.dependenciesReady, 'Dependencies', distReadiness.missingDependencies)}
        </div>
        <Button size="sm" onClick={handleGeneratePackage}>Generate Distribution Package</Button>
      </Card>

      {ownership ? (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-900">Rights Ownership</h2>
            <span className={`h-2.5 w-2.5 rounded-full ${ownership.valid ? 'bg-success-500' : 'bg-danger-500'}`} />
          </div>
          <div className="grid gap-2 grid-cols-2 text-xs mb-3">
            {ownership.masterPct > 0 ? <div className="flex justify-between border border-surface-100 rounded p-2"><span className="text-text-500">Master</span><span className={ownership.masterPct === 100 ? 'text-success-500' : 'text-danger-500'}>{ownership.masterPct}%</span></div> : null}
            {ownership.publishingPct > 0 ? <div className="flex justify-between border border-surface-100 rounded p-2"><span className="text-text-500">Publishing</span><span className={ownership.publishingPct === 100 ? 'text-success-500' : 'text-danger-500'}>{ownership.publishingPct}%</span></div> : null}
          </div>
          {ownership.issues.map((i) => <p key={i} className="text-xs text-danger-500">{i}</p>)}
        </Card>
      ) : null}

      <Card>
        <h2 className="text-sm font-semibold text-text-900 mb-3">Requirements ({requirements.length})</h2>
        {requirements.length === 0 ? <EmptyState title="No requirements" /> : (
          <div className="space-y-1">
            {requirements.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded border border-surface-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${r.status === 'approved' ? 'bg-success-500' : r.status === 'submitted' ? 'bg-warning-500' : 'bg-surface-300'}`} />
                  <span className={`text-sm ${r.status === 'approved' ? 'line-through text-text-400' : 'text-text-700'}`}>{r.name}</span>
                  <span className={`text-xs capitalize ${r.status === 'approved' ? 'text-success-500' : 'text-text-400'}`}>{r.status}</span>
                </div>
                <div className="flex gap-1">
                  {r.status === 'required' ? <Button size="sm" variant="outline" onClick={() => handleSubmitReq(r.id)}>Submit</Button> : null}
                  {r.status === 'submitted' ? <Button size="sm" variant="primary" onClick={() => handleApproveReq(r.id)}>Approve</Button> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function WorkflowTab({ workflow, stages, progress, completing, handleCompleteStage, tasksByStage, deliverables, blockingDeps, completedBlockingDeps }: {
  workflow: Workflow | null; stages: Stage[]; progress: ReturnType<typeof computeProgress>;
  completing: string | null; handleCompleteStage: (id: string) => void;
  tasksByStage: Record<string, Task[]>; deliverables: Deliverable[];
  blockingDeps: Dependency[]; completedBlockingDeps: number;
}) {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  if (!workflow || stages.length === 0) return <EmptyState title="No workflow" description="Create a release to generate a workflow." />;

  const columnColors: Record<string, string> = {
    completed: 'border-success-200 bg-success-50/30',
    in_progress: 'border-primary-200 bg-primary-50/30 ring-2 ring-primary-300',
    blocked: 'border-danger-200 bg-danger-50/30',
    review: 'border-warning-200 bg-warning-50/30',
    approved: 'border-info-200 bg-info-50/30',
    not_started: 'border-surface-200 bg-white',
  };

  return (
    <div className="flex gap-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-900">Workflow Board</h2>
          <span className="text-sm text-text-500">{progress.progress}%</span>
        </div>
        <ProgressBar value={progress.progress} showLabel={false} className="mb-4" />

        {blockingDeps.length > 0 ? (
          <div className="flex items-center gap-2 mb-4 text-xs text-danger-500 bg-danger-50 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            {completedBlockingDeps}/{blockingDeps.length} blocking dependencies — {blockingDeps.filter((d) => d.status !== 'completed').map((d) => d.title).join(', ')}
          </div>
        ) : null}

        <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:overflow-x-visible">
          <div className="flex items-start gap-0">
            {stages.map((s, idx) => {
              const isCurrent = s.id === workflow.currentStageId;
              const tasks = tasksByStage[s.id] ?? [];
              const done = tasks.filter((t) => t.status === 'done').length;

              return (
                <div key={s.id} className="flex items-start">
                  <button
                    onClick={() => setSelectedStage(s)}
                    className={`shrink-0 w-[140px] sm:w-[180px] rounded-lg border px-3 py-3 text-left transition-all hover:shadow-elevated ${columnColors[s.status] ?? columnColors.not_started} ${isCurrent ? 'ring-2 ring-primary-500' : ''} ${s.status === 'not_started' && !isCurrent ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-400">0{s.order}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-sm font-medium text-text-900 mb-2 truncate">{s.name}</p>
                    <div className="space-y-1 text-xs">
                      {s.assignedRole ? (
                        <div className="flex items-center gap-1 text-text-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          {s.assignedRole.replace(/_/g, ' ')}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-1 text-text-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        {done}/{tasks.length} tasks
                      </div>
                      {s.dueDate ? <div className="text-text-400">{fmtDate(s.dueDate)}</div> : null}
                    </div>

                    {s.status === 'blocked' && blockingDeps.length > 0 ? (
                      <div className="mt-2 pt-2 border-t border-danger-200">
                        <div className="text-xs text-danger-500 font-medium" title={blockingDeps.map((d) => d.title).join(', ')}>
                          🔒 {blockingDeps.length} dep{blockingDeps.length > 1 ? 's' : ''} blocking
                        </div>
                      </div>
                    ) : null}

                    {isCurrent && s.status !== 'completed' ? (
                      <Button size="sm" variant="primary" className="mt-3 w-full" onClick={(e) => { e.stopPropagation(); handleCompleteStage(s.id); }} disabled={completing === s.id} loading={completing === s.id}>
                        Complete
                      </Button>
                    ) : null}
                  </button>
                  {idx < stages.length - 1 ? (
                    <span className={`shrink-0 mx-0.5 sm:mx-1 mt-4 select-none ${s.status === 'completed' ? 'text-[#16A34A]' : 'text-[#A1A1AA]'}`}>
                      →
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedStage ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setSelectedStage(null)} />
          <aside className="fixed inset-y-0 right-0 z-50 w-80 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:z-0 border-l border-surface-200 bg-white dark:bg-surface-900 shadow-modal lg:shadow-none overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-surface-200">
              <h3 className="text-sm font-semibold text-text-900">{selectedStage.name}</h3>
              <button onClick={() => setSelectedStage(null)} className="text-text-400 hover:text-text-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-1">Status</p>
                <StatusBadge status={selectedStage.status} />
                {selectedStage.dueDate ? <p className="text-xs text-text-500 mt-1">Due: {fmtDate(selectedStage.dueDate)}</p> : null}
                {selectedStage.assignedRole ? <p className="text-xs text-text-500 mt-1 capitalize">Assigned: {selectedStage.assignedRole.replace(/_/g, ' ')}</p> : null}
                {selectedStage.startedAt ? <p className="text-xs text-text-400 mt-1">Started: {fmtDate(selectedStage.startedAt)}</p> : null}
                {selectedStage.completedAt ? <p className="text-xs text-text-400">Completed: {fmtDate(selectedStage.completedAt)}</p> : null}
              </div>

              <div>
                <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-2">Tasks ({(tasksByStage[selectedStage.id] ?? []).length})</p>
                {(tasksByStage[selectedStage.id] ?? []).length === 0 ? (
                  <p className="text-xs text-text-400">No tasks yet.</p>
                ) : (
                  <div className="space-y-1">
                    {(tasksByStage[selectedStage.id] ?? []).slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-xs border border-surface-100 rounded p-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.status === 'done' ? 'bg-success-500' : 'bg-surface-300'}`} />
                        <span className={`truncate ${t.status === 'done' ? 'line-through text-text-400' : 'text-text-700'}`}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(() => {
                const stageDeliverables = deliverables.filter((d) => d.stageId === selectedStage.id);
                if (stageDeliverables.length === 0) return null;
                return (
                <div>
                  <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-2">Deliverables ({stageDeliverables.length})</p>
                  {stageDeliverables.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs border border-surface-100 rounded p-1.5 mb-1">
                      <span className="truncate text-text-700">{d.title}</span>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
                );
              })()}

              {selectedStage.id === workflow.currentStageId && selectedStage.status !== 'completed' ? (
                <Button size="sm" variant="primary" className="w-full" onClick={() => { handleCompleteStage(selectedStage.id); setSelectedStage(null); }} disabled={completing === selectedStage.id} loading={completing === selectedStage.id}>
                  Complete Stage
                </Button>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}

function TasksTab({ stages, tasksByStage, doneTasks, allTasks, newTaskTitle, setNewTaskTitle, newTaskPriority, setNewTaskPriority, newTaskAssignee, setNewTaskAssignee, creatingTask, handleAddTask, handleCompleteTask, handleAssignTask }: {
  stages: Stage[]; tasksByStage: Record<string, Task[]>; doneTasks: number; allTasks: Task[];
  newTaskTitle: string; setNewTaskTitle: (v: string) => void; newTaskPriority: string; setNewTaskPriority: (v: string) => void;
  newTaskAssignee: string; setNewTaskAssignee: (v: string) => void; creatingTask: boolean;
  handleAddTask: (stageId: string, e: FormEvent) => void; handleCompleteTask: (stageId: string, taskId: string) => void;
  handleAssignTask: (stageId: string, taskId: string, assigneeId: string) => void;
}) {
  if (allTasks.length === 0) return <EmptyState title="No tasks" description="Add tasks to stages in the Workflow tab." />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-900">Tasks ({doneTasks}/{allTasks.length})</h2>
        <ProgressBar value={doneTasks} max={allTasks.length} size="sm" className="w-32" showLabel />
      </div>
      {stages.filter((s) => (tasksByStage[s.id]?.length ?? 0) > 0).map((s) => {
        const tasks = tasksByStage[s.id] ?? [];
        return (
          <Card key={s.id} padding="sm">
            <h3 className="text-xs font-medium text-text-900 mb-2">{s.name} ({tasks.filter((t) => t.status === 'done').length}/{tasks.length})</h3>
            <div className="space-y-1.5">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded border border-surface-100 px-3 py-2">
                  <button onClick={() => handleCompleteTask(s.id, t.id)}
                    className={`shrink-0 w-4 h-4 rounded border ${t.status === 'done' ? 'bg-primary-500 border-primary-500' : 'border-surface-300 hover:border-primary-500'} flex items-center justify-center`}>
                    {t.status === 'done' ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${t.status === 'done' ? 'line-through text-text-400' : 'text-text-700'}`}>{t.title}</p>
                    <Badge label={t.priority} color={priorityStyles[t.priority] ?? ''} size="sm" />
                  </div>
                  <input type="text" defaultValue={t.assigneeId ?? ''} placeholder="assignee"
                    onBlur={(e) => { if (e.target.value !== (t.assigneeId ?? '')) handleAssignTask(s.id, t.id, e.target.value); }}
                    className="w-24 rounded border border-surface-300 bg-white dark:bg-surface-800 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" />
                </div>
              ))}
            </div>
            <form onSubmit={(e) => handleAddTask(s.id, e)} className="flex items-center gap-2 mt-2 pt-2 border-t border-surface-100">
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="New task..."
                className="flex-1 rounded border border-surface-300 bg-white dark:bg-surface-800 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}
                className="rounded border border-surface-300 bg-white dark:bg-surface-800 px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="low">low</option><option value="medium">med</option><option value="high">high</option><option value="critical">crit</option>
              </select>
              <input type="text" value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} placeholder="assignee"
                className="w-24 rounded border border-surface-300 bg-white dark:bg-surface-800 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <Button size="sm" type="submit" disabled={creatingTask || !newTaskTitle.trim()}>Add</Button>
            </form>
          </Card>
        );
      })}
    </div>
  );
}

function DeliverablesTab({ deliverables }: { deliverables: Deliverable[] }) {
  if (deliverables.length === 0) return <EmptyState title="No deliverables" description="No deliverables have been added yet." />;
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-text-900 mb-3">Deliverables ({deliverables.length})</h2>
      {deliverables.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-lg border border-surface-200 bg-white dark:bg-surface-900 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-900 truncate">{d.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge label={d.type} color="bg-surface-100 text-text-500" size="sm" />
              {d.version ? <span className="text-xs text-text-400">{d.version}</span> : null}
            </div>
          </div>
          <StatusBadge status={d.status} />
        </div>
      ))}
    </div>
  );
}

function DependenciesTab({ dependencies, blockingDeps, completedBlockingDeps }: {
  dependencies: Dependency[]; blockingDeps: Dependency[]; completedBlockingDeps: number;
}) {
  if (dependencies.length === 0) return <EmptyState title="No dependencies" description="No dependencies have been registered." />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-900">Dependencies ({dependencies.length})</h2>
        {blockingDeps.length > 0 ? <span className="text-xs text-text-500">{completedBlockingDeps}/{blockingDeps.length} blocking cleared</span> : null}
      </div>
      <div className="space-y-2">
        {dependencies.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border border-surface-200 bg-white dark:bg-surface-900 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-900 truncate">{d.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge label={d.category} color="bg-surface-100 text-text-500" size="sm" />
                {d.blocking ? <Badge label="blocking" color="bg-danger-50 text-danger-500" size="sm" /> : null}
                {d.owner ? <Avatar name={d.owner} size="sm" /> : null}
              </div>
            </div>
            <StatusBadge status={d.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTab({ releaseId }: { releaseId: string }) {
  const [activities, setActivities] = useState<{ id: string; type: string; actorId: string; createdAt: Date }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const db = getDb(); if (!db) return;
      const snap = await getDocs(query(collection(db, 'activities'), where('releaseId', '==', releaseId), orderBy('createdAt', 'desc'), limit(50)));
      setActivities(snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, type: data.type as string, actorId: data.actorId as string, createdAt: (data.createdAt as { toDate: () => Date }).toDate() };
      }));
      setLoading(false);
    }
    load();
  }, [releaseId]);

  if (loading) return <LoadingState text="Loading activity..." />;
  if (activities.length === 0) return <EmptyState title="No activity" description="Activity will appear as actions are taken." />;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-text-900 mb-3">Activity ({activities.length})</h2>
      {activities.map((a) => (
        <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-200 pl-3 py-1">
          <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
          <div>
            <p className="text-sm text-text-700 capitalize">{a.type.replace(/_/g, ' ')}</p>
            <p className="text-xs text-text-400">{a.actorId} &middot; {a.createdAt.toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
