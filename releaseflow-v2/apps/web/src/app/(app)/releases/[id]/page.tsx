'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { fetchStages } from '@/lib/workflow-service';
import { fetchRelease, removeRelease, changeReleaseStatus } from '@/lib/release-service';
import { useWorkflow, useActivity } from '@/hooks/useWorkflow';
import {
  Card, Badge, StatusBadge, ProgressBar, Button, EmptyState, LoadingState, Skeleton, Drawer, Tabs,
  WorkspaceLayout,
} from '@releaseflow/ui';
import {
  ReleaseJourney, HealthRing, ReadinessStack, ContextRail, WorkflowBoard, OperationalSummary,
} from '@releaseflow/domain-ui';
import type { Release, ReleaseStatus, Workflow, Stage, Task, ReleaseRequirement, Deliverable, Dependency, DistributionPackage } from '../../types';

const TAB_IDS = [
  'overview', 'workflow', 'assets', 'distribution', 'campaigns',
  'budget', 'rights', 'credits', 'activity', 'settings',
] as const;
type TabId = typeof TAB_IDS[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview', workflow: 'Workflow', assets: 'Assets',
  distribution: 'Distribution', campaigns: 'Campaigns', budget: 'Budget',
  rights: 'Rights', credits: 'Credits', activity: 'Activity', settings: 'Settings',
};

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

function daysUntil(d: Date): number {
  return Math.max(0, Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function ReleaseDetailPage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tab, setTab] = useState<TabId>('overview');
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

  const { workflow: wfData, stages: wfStages, loading: wfLoading } = useWorkflow(id);
  const { activities, loading: activityLoading } = useActivity(id);

  useEffect(() => {
    async function load() {
      const releaseData = await fetchRelease(id);
      if (!releaseData) { setLoading(false); return; }

      if (activeOrgId && releaseData.organizationId && releaseData.organizationId !== activeOrgId) {
        setForbidden(true); setLoading(false); return;
      }
      setRelease(releaseData as unknown as Release);
      setLoading(false);
    }
    load();
  }, [id, activeOrgId]);

  useEffect(() => {
    if (!wfLoading) {
      if (wfData) setWorkflow(wfData as unknown as Workflow);
      else setWorkflow(null);
      if (wfStages.length > 0) {
        setStages(wfStages as unknown as Stage[]);
        (async () => {
          const tasksMap: Record<string, Task[]> = {};
          for (const s of wfStages) tasksMap[s.id] = await getTasksByStage(s.id);
          setTasksByStage(tasksMap);
        })();
      }
    }
  }, [wfData, wfStages, wfLoading]);

  useEffect(() => {
    if (!release) return;
    Promise.all([
      getRequirementsByRelease(id),
      getDeliverablesByRelease(id),
      getDependenciesByRelease(id),
      getLatestDistributionPackage(id),
      validateReleaseOwnership(id),
    ]).then(([reqData, delData, depData, pkg, ownershipValidation]) => {
      setRequirements(reqData);
      setDeliverables(delData);
      setDependencies(depData);
      setDistPackage(pkg as unknown as DistributionPackage);
      setOwnership(ownershipValidation);
    });
  }, [id, release]);

  async function handleCompleteStage(stageId: string) {
    if (!workflow) return;
    setCompleting(stageId);
    try {
      await stageComplete(workflow.id, stageId, id, actorId);
      const updatedStages = await fetchStages(workflow.id);
      setStages(updatedStages as unknown as Stage[]);
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
  async function handleGeneratePackage() { await generateDistributionPackage(id); setDistPackage(await getLatestDistributionPackage(id) as unknown as DistributionPackage); }

  async function handleDelete() {
    if (!confirm('This permanently removes the release and all associated operational data.')) return;
    await removeRelease(id, actorId);
    router.push('/releases');
  }

  async function handleStatusTransition(status: ReleaseStatus, reason?: string) {
    setUpdating(true);
    try {
      await changeReleaseStatus(id, status, actorId, reason);
      setRelease((prev) => prev ? { ...prev, status } : prev);
    } catch (err) { console.error(err); }
    finally { setUpdating(false); }
  }

  if (loading) return (
    <div className="flex min-h-screen bg-surface-50">
      <div className="flex-1 max-w-6xl mx-auto px-6 py-8">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="flex items-start gap-6 mb-8">
          <Skeleton className="h-20 w-20 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex gap-1 border-b border-surface-200 mb-6">
          <Skeleton className="h-8 w-20 mr-3" /><Skeleton className="h-8 w-20 mr-3" /><Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-6">
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-32" />
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

  const currentStage = workflow?.currentStageId ? stages.find((s) => s.id === workflow.currentStageId)?.name ?? release.status.replace(/_/g, ' ') : release.status.replace(/_/g, ' ');
  const progress = computeProgress(stages);
  const readiness = computeReadiness(requirements, stages, deliverables, dependencies);
  const distReadiness = checkDistributionReadiness(
    release, deliverables.length, deliverables.filter((d) => d.status === 'approved').length,
    requirements.length, requirements.filter((r) => r.status === 'approved').length,
    dependencies.filter((d) => d.blocking).length, dependencies.filter((d) => d.blocking && d.status === 'completed').length,
  );
  const blockingDeps = dependencies.filter((d) => d.blocking);
  const activeBlockingDeps = blockingDeps.filter((d) => d.status !== 'completed');
  const completedBlockingDeps = blockingDeps.filter((d) => d.status === 'completed').length;

  const journeyStages = stages.map((s) => {
    const statusMap: Record<string, 'completed' | 'current' | 'pending' | 'blocked'> = {
      completed: 'completed', in_progress: 'current', not_started: 'pending',
      blocked: 'blocked', review: 'current', approved: 'completed',
    };
    return { id: s.id, label: s.name, status: statusMap[s.status] ?? 'pending', date: s.dueDate ? fmtDate(s.dueDate) : undefined };
  });

  const workflowCompletionPct = stages.length > 0
    ? Math.round((stages.filter((s) => s.status === 'completed').length / stages.length) * 100)
    : 0;

  const readinessCategories: Record<string, { status: 'ready' | 'not-ready'; description?: string; guidance?: string }> = {
    Audio: { status: deliverables.filter((d) => d.type === 'audio' && d.status === 'approved').length > 0 ? 'ready' : 'not-ready', description: `${deliverables.filter((d) => d.type === 'audio' && d.status === 'approved').length} of ${deliverables.filter((d) => d.type === 'audio').length} approved` },
    Artwork: { status: deliverables.filter((d) => d.type === 'artwork' && d.status === 'approved').length > 0 ? 'ready' : 'not-ready', description: deliverables.filter((d) => d.type === 'artwork').length > 0 ? 'Pending approval' : 'No artwork deliverables' },
    Metadata: { status: release.upc ? 'ready' : 'not-ready', description: release.upc ? 'Complete' : 'UPC required' },
    Rights: { status: ownership?.valid ? 'ready' : 'not-ready', description: ownership?.valid ? 'Cleared' : (ownership?.issues?.[0] ?? 'Not cleared') },
    Distribution: { status: distPackage ? 'ready' : 'not-ready', description: distPackage ? `${distPackage.completeness}% complete` : 'Not configured' },
    Marketing: { status: 'not-ready', description: 'Not started' },
    Legal: { status: 'not-ready', description: 'Not reviewed' },
  };
  const readyCount = Object.values(readinessCategories).filter((c) => c.status === 'ready').length;

  const attentionItems = [
    ...activeBlockingDeps.map((d) => ({ id: d.id, label: d.title, type: 'deadline' as const })),
    ...requirements.filter((r) => r.status === 'submitted').map((r) => ({ id: r.id, label: `Review: ${r.name}`, type: 'review' as const })),
  ];

  const targetDays = release.targetReleaseDate instanceof Date ? daysUntil(release.targetReleaseDate) : undefined;

  const contextRailContent = (
    <div className="p-4 space-y-6">
      <HealthRing
        size="md"
        health={readiness.percentage}
        readiness={readiness.percentage}
        timelineConfidence={readiness.percentage}
        workflowCompletion={workflowCompletionPct}
        currentStage={currentStage}
        daysUntilRelease={targetDays}
      />
      <ReadinessStack categories={readinessCategories} />
      <ContextRail
        releaseName={release.title}
        releaseType={release.releaseType}
        currentStage={currentStage}
        releaseDate={release.targetReleaseDate ? fmtDate(release.targetReleaseDate) : 'Not set'}
        health={readiness.percentage}
        attentionItems={attentionItems}
      />
    </div>
  );

  const tabs = TAB_IDS.map((t) => ({
    id: t,
    label: TAB_LABELS[t],
    count: t === 'assets' ? deliverables.length : t === 'credits' ? undefined : t === 'activity' ? undefined : undefined,
  }));

  const healthPillClass = readiness.percentage >= 80
    ? 'bg-success-50 text-success-500' : readiness.percentage >= 50
    ? 'bg-warning-50 text-warning-500' : 'bg-danger-50 text-danger-500';
  const healthPillLabel = readiness.percentage >= 80 ? 'Healthy' : readiness.percentage >= 50 ? 'Attention' : 'Critical';

  return (
    <WorkspaceLayout contextRail={contextRailContent}>
      <div className="px-6 py-6">
        <Link href="/releases" className="text-sm text-text-500 hover:text-text-900 mb-4 inline-block">&larr; Back to releases</Link>

        {/* ===== Release Header (Hero) ===== */}
        <header className="mb-8">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-text-900 truncate">{release.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge label={release.releaseType} color="bg-surface-100 text-text-700" />
                {release.genre ? <Badge label={release.genre} color="bg-surface-100 text-text-500" size="sm" /> : null}
                {release.targetReleaseDate instanceof Date ? (
                  <span className="text-xs text-text-400">{fmtDate(release.targetReleaseDate)}</span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${healthPillClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    readiness.percentage >= 80 ? 'bg-success-500' : readiness.percentage >= 50 ? 'bg-warning-500' : 'bg-danger-500'
                  }`} />
                  {healthPillLabel}
                  <span className="font-normal opacity-70 ml-0.5">{readiness.percentage}%</span>
                </span>

                <div className="relative">
                  <button type="button" onClick={() => { setStatusOpen(!statusOpen); setConfirmTransition(null); }} className="cursor-pointer">
                    <StatusBadge status={release.status} />
                  </button>
                  {statusOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => { setStatusOpen(false); setConfirmTransition(null); }} />
                      <div className="absolute top-full left-0 mt-1 z-50 w-52 bg-white dark:bg-surface-900 border border-surface-200 rounded-lg shadow-modal overflow-hidden">
                        {confirmTransition ? (
                          confirmTransition.destructive ? (
                            <div className="p-3">
                              <p className="text-sm text-text-700 mb-3">This permanently cancels the release.</p>
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
                    </>
                  )}
                </div>

                {ownership ? (
                  <button type="button" onClick={() => setTab('rights')} className={`text-xs rounded-full px-2 py-0.5 cursor-pointer hover:underline ${ownership.valid ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'}`}>
                    {ownership.valid ? 'Rights Ready' : 'Rights Incomplete'}
                  </button>
                ) : null}

                {activeBlockingDeps.length > 0 ? (
                  <button type="button" onClick={() => setTab('workflow')} className="text-xs rounded-full px-2 py-0.5 bg-danger-50 text-danger-500 cursor-pointer hover:underline">
                    {activeBlockingDeps.length} blocker{activeBlockingDeps.length > 1 ? 's' : ''}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {release.status === 'in_production' ? (
                <Button variant="primary" size="sm" onClick={() => workflow?.currentStageId ? handleCompleteStage(workflow.currentStageId) : undefined} disabled={completing !== null}>
                  Advance Stage
                </Button>
              ) : null}
              <div className="flex items-center gap-2">
                <Link href={`/releases/${id}/edit`} className="rounded-lg border border-surface-300 px-3 py-1.5 text-xs font-medium text-text-700 hover:bg-surface-100">Edit</Link>
                <button onClick={handleDelete} className="rounded-lg border border-surface-300 px-3 py-1.5 text-xs font-medium text-text-500 hover:bg-surface-100">Delete</button>
              </div>
            </div>
          </div>
        </header>

        {/* ===== Release Journey ===== */}
        <section className="mb-8">
          <ReleaseJourney stages={journeyStages} />
        </section>

        {/* ===== Operational Summary ===== */}
        <section className="mb-8">
          <OperationalSummary
            healthScore={readiness.percentage}
            currentStage={currentStage}
            completedStages={stages.filter((s) => s.status === 'completed').length}
            totalStages={stages.length}
            readyItems={readyCount}
            totalItems={Object.keys(readinessCategories).length}
            pendingApprovals={requirements.filter((r) => r.status === 'submitted').length}
            blockers={activeBlockingDeps.length}
            daysUntilRelease={targetDays ?? 0}
            onDrillDown={(section) => {
              if (section === 'workflow') setTab('workflow');
              else if (section === 'readiness') setTab('rights');
              else if (section === 'approvals') setTab('activity');
              else if (section === 'blockers') setTab('workflow');
            }}
          />
        </section>

        {/* ===== Workspace Tabs ===== */}
        <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as TabId)} variant="underline" className="mb-6" />

        {/* ===== Active Tab Content ===== */}
        {tab === 'overview' && (
          <OverviewTab
            readiness={readiness} distReadiness={distReadiness} distPackage={distPackage}
            ownership={ownership} requirements={requirements} deliverables={deliverables}
            blockingDeps={activeBlockingDeps} completedBlockingDeps={completedBlockingDeps}
            handleSubmitReq={handleSubmitReq} handleApproveReq={handleApproveReq}
            handleGeneratePackage={handleGeneratePackage}
            onNavigateTab={setTab}
          />
        )}

        {tab === 'workflow' && (
          <WorkflowTab
            workflow={workflow} stages={stages} progress={progress}
            completing={completing} handleCompleteStage={handleCompleteStage}
            tasksByStage={tasksByStage} deliverables={deliverables}
            blockingDeps={activeBlockingDeps} completedBlockingDeps={completedBlockingDeps}
            newTaskTitle={newTaskTitle} setNewTaskTitle={setNewTaskTitle}
            newTaskPriority={newTaskPriority} setNewTaskPriority={setNewTaskPriority}
            newTaskAssignee={newTaskAssignee} setNewTaskAssignee={setNewTaskAssignee}
            creatingTask={creatingTask} handleAddTask={handleAddTask}
            handleCompleteTask={handleCompleteTask} handleAssignTask={handleAssignTask}
          />
        )}

        {tab === 'assets' && <AssetsTab deliverables={deliverables} />}

        {tab === 'distribution' && (
          <DistributionTab
            distReadiness={distReadiness} distPackage={distPackage}
            handleGeneratePackage={handleGeneratePackage}
          />
        )}

        {tab === 'campaigns' && <CampaignsTab />}

        {tab === 'budget' && <BudgetTab />}

        {tab === 'rights' && ownership && <RightsTab ownership={ownership} />}

        {tab === 'credits' && <CreditsTab />}

        {tab === 'activity' && <ActivityTab activities={activities} loading={activityLoading} />}

        {tab === 'settings' && <SettingsTab release={release} />}
      </div>
    </WorkspaceLayout>
  );
}

/* -------------------------------------------------------------------------- */
/*  Overview Tab — readiness, distribution, requirements summary              */
/* -------------------------------------------------------------------------- */

function OverviewTab({ readiness, distReadiness, distPackage, ownership, requirements, deliverables: _deliverables, blockingDeps: _blockingDeps, completedBlockingDeps: _completedBlockingDeps, handleSubmitReq, handleApproveReq, handleGeneratePackage, onNavigateTab }: {
  readiness: ReturnType<typeof computeReadiness>; distReadiness: ReturnType<typeof checkDistributionReadiness>;
  distPackage: DistributionPackage | null; ownership: OwnershipValidation | null;
  requirements: ReleaseRequirement[]; deliverables: Deliverable[];
  blockingDeps: Dependency[]; completedBlockingDeps: number;
  handleSubmitReq: (id: string) => void; handleApproveReq: (id: string) => void;
  handleGeneratePackage: () => void; onNavigateTab: (tab: TabId) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-900">Readiness</h2>
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
            {readiness.missing.map((m) => (
              <button key={m} type="button" onClick={() => onNavigateTab('rights')} className="text-xs rounded bg-danger-50 text-danger-500 px-2 py-0.5 hover:underline cursor-pointer">{m}</button>
            ))}
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
          <span className={`rounded-full px-2 py-0.5 ${distReadiness.metadataReady ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'}`}>{distReadiness.metadataReady ? '\u2713' : '\u2717'} Metadata</span>
          <span className={`rounded-full px-2 py-0.5 ${distReadiness.deliverablesReady ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'}`}>{distReadiness.deliverablesReady ? '\u2713' : '\u2717'} Deliverables</span>
          <span className={`rounded-full px-2 py-0.5 ${distReadiness.requirementsReady ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'}`}>{distReadiness.requirementsReady ? '\u2713' : '\u2717'} Requirements</span>
          <span className={`rounded-full px-2 py-0.5 ${distReadiness.dependenciesReady ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'}`}>{distReadiness.dependenciesReady ? '\u2713' : '\u2717'} Dependencies</span>
        </div>
        <Button size="sm" onClick={() => { handleGeneratePackage(); onNavigateTab('distribution'); }}>Generate Package</Button>
      </Card>

      {ownership ? (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-900">Rights</h2>
            <span className={`h-2.5 w-2.5 rounded-full ${ownership.valid ? 'bg-success-500' : 'bg-danger-500'}`} />
          </div>
          <div className="grid gap-2 grid-cols-2 text-xs mb-3">
            {ownership.masterPct > 0 ? <div className="flex justify-between border border-surface-100 rounded p-2"><span className="text-text-500">Master</span><span className={ownership.masterPct === 100 ? 'text-success-500' : 'text-danger-500'}>{ownership.masterPct}%</span></div> : null}
            {ownership.publishingPct > 0 ? <div className="flex justify-between border border-surface-100 rounded p-2"><span className="text-text-500">Publishing</span><span className={ownership.publishingPct === 100 ? 'text-success-500' : 'text-danger-500'}>{ownership.publishingPct}%</span></div> : null}
          </div>
          {ownership.issues.map((i) => <p key={i} className="text-xs text-danger-500">{i}</p>)}
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => onNavigateTab('rights')}>View all rights</Button>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-900">Requirements</h2>
          <span className="text-xs text-text-400">{requirements.filter((r) => r.status === 'approved').length}/{requirements.length}</span>
        </div>
        {requirements.length === 0 ? <EmptyState title="No requirements" /> : (
          <div className="space-y-1">
            {requirements.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded border border-surface-100 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${r.status === 'approved' ? 'bg-success-500' : r.status === 'submitted' ? 'bg-warning-500' : 'bg-surface-300'}`} />
                  <span className={`text-sm truncate ${r.status === 'approved' ? 'line-through text-text-400' : 'text-text-700'}`}>{r.name}</span>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
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

/* -------------------------------------------------------------------------- */
/*  Workflow Tab — WorkflowBoard + task cards                                 */
/* -------------------------------------------------------------------------- */

function WorkflowTab({ workflow, stages, progress, completing, handleCompleteStage, tasksByStage, deliverables: _deliverables, blockingDeps, completedBlockingDeps, newTaskTitle, setNewTaskTitle, newTaskPriority, setNewTaskPriority, newTaskAssignee, setNewTaskAssignee, creatingTask, handleAddTask, handleCompleteTask, handleAssignTask }: {
  workflow: Workflow | null; stages: Stage[]; progress: ReturnType<typeof computeProgress>;
  completing: string | null; handleCompleteStage: (id: string) => void;
  tasksByStage: Record<string, Task[]>; deliverables: Deliverable[];
  blockingDeps: Dependency[]; completedBlockingDeps: number;
  newTaskTitle: string; setNewTaskTitle: (v: string) => void;
  newTaskPriority: string; setNewTaskPriority: (v: string) => void;
  newTaskAssignee: string; setNewTaskAssignee: (v: string) => void;
  creatingTask: boolean; handleAddTask: (stageId: string, e: FormEvent) => void;
  handleCompleteTask: (stageId: string, taskId: string) => void;
  handleAssignTask: (stageId: string, taskId: string, assigneeId: string) => void;
}) {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  if (!workflow || stages.length === 0) return <EmptyState title="No workflow" description="Create a release to generate a workflow." />;

  const workflowBoardStages = stages.map((s) => {
    const tasks = tasksByStage[s.id] ?? [];
    const done = tasks.filter((t) => t.status === 'done').length;
    const total = tasks.length;
    const statusMap: Record<string, 'completed' | 'in-progress' | 'pending' | 'blocked' | 'at-risk'> = {
      completed: 'completed', in_progress: 'in-progress', review: 'in-progress',
      approved: 'completed', not_started: 'pending', blocked: 'blocked',
    };
    return {
      id: s.id, name: s.name, status: statusMap[s.status] ?? 'pending',
      owner: s.assignedRole ? { name: s.assignedRole.replace(/_/g, ' ') } : undefined,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      dueDate: s.dueDate ? fmtDate(s.dueDate) : undefined,
      dependencies: blockingDeps.length > 0 ? blockingDeps.map((d) => d.title) : undefined,
    };
  });

  const columnColors: Record<string, string> = {
    completed: 'border-success-200 bg-success-50/30',
    in_progress: 'border-primary-200 bg-primary-50/30 ring-2 ring-primary-300',
    blocked: 'border-danger-200 bg-danger-50/30',
    review: 'border-warning-200 bg-warning-50/30',
    approved: 'border-info-200 bg-info-50/30',
    not_started: 'border-surface-200 bg-white',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-900">Workflow Board</h2>
        <span className="text-sm text-text-500">{progress.progress}%</span>
      </div>

      {blockingDeps.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-danger-500 bg-danger-50 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          {completedBlockingDeps}/{blockingDeps.length} blocking dependencies — {blockingDeps.map((d) => d.title).join(', ')}
        </div>
      ) : null}

      <WorkflowBoard stages={workflowBoardStages} showOwners showProgress className="mb-4" />

      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-0 min-w-max">
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
                      <div className="text-xs text-danger-500 font-medium">{blockingDeps.length} blocking</div>
                    </div>
                  ) : null}
                  {isCurrent && s.status !== 'completed' ? (
                    <Button size="sm" variant="primary" className="mt-3 w-full" onClick={(e) => { e.stopPropagation(); handleCompleteStage(s.id); }} disabled={completing === s.id} loading={completing === s.id}>Complete</Button>
                  ) : null}
                </button>
                {idx < stages.length - 1 ? (
                  <span className={`shrink-0 mx-0.5 sm:mx-1 mt-4 select-none ${s.status === 'completed' ? 'text-success-500' : 'text-surface-300'}`}>&rarr;</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <TasksSection
        stages={stages} tasksByStage={tasksByStage} newTaskTitle={newTaskTitle} setNewTaskTitle={setNewTaskTitle}
        newTaskPriority={newTaskPriority} setNewTaskPriority={setNewTaskPriority} newTaskAssignee={newTaskAssignee} setNewTaskAssignee={setNewTaskAssignee}
        creatingTask={creatingTask} handleAddTask={handleAddTask} handleCompleteTask={handleCompleteTask} handleAssignTask={handleAssignTask}
      />

      <Drawer open={!!selectedStage} onClose={() => setSelectedStage(null)} title={selectedStage?.name} position="right">
        {selectedStage && (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-1">Status</p>
              <StatusBadge status={selectedStage.status} />
              {selectedStage.dueDate ? <p className="text-xs text-text-500 mt-1">Due: {fmtDate(selectedStage.dueDate)}</p> : null}
            </div>
            <div>
              <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-2">Tasks ({(tasksByStage[selectedStage.id] ?? []).length})</p>
              {(tasksByStage[selectedStage.id] ?? []).slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-xs border border-surface-100 rounded p-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.status === 'done' ? 'bg-success-500' : 'bg-surface-300'}`} />
                  <span className={`truncate ${t.status === 'done' ? 'line-through text-text-400' : 'text-text-700'}`}>{t.title}</span>
                </div>
              ))}
            </div>
            {selectedStage.id === workflow.currentStageId && selectedStage.status !== 'completed' ? (
              <Button size="sm" variant="primary" className="w-full" onClick={() => { handleCompleteStage(selectedStage.id); setSelectedStage(null); }} disabled={completing === selectedStage.id} loading={completing === selectedStage.id}>Complete Stage</Button>
            ) : null}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function TasksSection({ stages, tasksByStage, newTaskTitle, setNewTaskTitle, newTaskPriority, setNewTaskPriority, newTaskAssignee, setNewTaskAssignee, creatingTask, handleAddTask, handleCompleteTask, handleAssignTask }: {
  stages: Stage[]; tasksByStage: Record<string, Task[]>;
  newTaskTitle: string; setNewTaskTitle: (v: string) => void; newTaskPriority: string; setNewTaskPriority: (v: string) => void;
  newTaskAssignee: string; setNewTaskAssignee: (v: string) => void; creatingTask: boolean;
  handleAddTask: (stageId: string, e: FormEvent) => void; handleCompleteTask: (stageId: string, taskId: string) => void;
  handleAssignTask: (stageId: string, taskId: string, assigneeId: string) => void;
}) {
  const allTasks = Object.values(tasksByStage).flat();
  const doneTasks = allTasks.filter((t) => t.status === 'done').length;
  if (allTasks.length === 0) return null;

  const priorityStyles: Record<string, string> = {
    low: 'bg-surface-100 text-text-500', medium: 'bg-info-50 text-info-500',
    high: 'bg-warning-50 text-warning-500', critical: 'bg-danger-50 text-danger-500',
  };

  return (
    <div className="space-y-4 pt-6 border-t border-surface-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-900">Tasks ({doneTasks}/{allTasks.length})</h3>
        <ProgressBar value={doneTasks} max={allTasks.length} size="sm" className="w-32" showLabel />
      </div>
      {stages.filter((s) => (tasksByStage[s.id]?.length ?? 0) > 0).map((s) => {
        const tasks = tasksByStage[s.id] ?? [];
        return (
          <Card key={s.id} padding="sm">
            <h4 className="text-xs font-medium text-text-900 mb-2">{s.name} ({tasks.filter((t) => t.status === 'done').length}/{tasks.length})</h4>
            <div className="space-y-1.5">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded border border-surface-100 px-3 py-2">
                  <button onClick={() => handleCompleteTask(s.id, t.id)} className={`shrink-0 w-4 h-4 rounded border ${t.status === 'done' ? 'bg-primary-500 border-primary-500' : 'border-surface-300 hover:border-primary-500'} flex items-center justify-center`}>
                    {t.status === 'done' ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${t.status === 'done' ? 'line-through text-text-400' : 'text-text-700'}`}>{t.title}</p>
                    <Badge label={t.priority} color={priorityStyles[t.priority] ?? ''} size="sm" />
                  </div>
                  <input type="text" defaultValue={t.assigneeId ?? ''} placeholder="assignee" onBlur={(e) => { if (e.target.value !== (t.assigneeId ?? '')) handleAssignTask(s.id, t.id, e.target.value); }} className="w-24 rounded border border-surface-300 bg-white dark:bg-surface-800 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" />
                </div>
              ))}
            </div>
            <form onSubmit={(e) => handleAddTask(s.id, e)} className="flex items-center gap-2 mt-2 pt-2 border-t border-surface-100">
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="New task..." className="flex-1 rounded border border-surface-300 bg-white dark:bg-surface-800 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="rounded border border-surface-300 bg-white dark:bg-surface-800 px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="low">low</option><option value="medium">med</option><option value="high">high</option><option value="critical">crit</option>
              </select>
              <input type="text" value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} placeholder="assignee" className="w-24 rounded border border-surface-300 bg-white dark:bg-surface-800 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <Button size="sm" type="submit" disabled={creatingTask || !newTaskTitle.trim()}>Add</Button>
            </form>
          </Card>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Remaining Tabs                                                           */
/* -------------------------------------------------------------------------- */

function AssetsTab({ deliverables }: { deliverables: Deliverable[] }) {
  if (deliverables.length === 0) return <EmptyState title="No assets" description="Deliverables will appear here when uploaded." />;
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-text-900 mb-3">Assets ({deliverables.length})</h2>
      {deliverables.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-lg border border-surface-200 bg-white px-4 py-3">
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

function DistributionTab({ distReadiness, distPackage, handleGeneratePackage }: {
  distReadiness: ReturnType<typeof checkDistributionReadiness>;
  distPackage: DistributionPackage | null;
  handleGeneratePackage: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-900">Distribution Status</h2>
          {distPackage ? <StatusBadge status={distPackage.status} /> : null}
        </div>
        <ProgressBar value={distReadiness.completeness} color={distReadiness.canDistribute ? 'bg-success-500' : 'bg-warning-500'} showLabel className="mb-3" />
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          <div className={`flex items-center justify-between rounded border px-3 py-2 ${distReadiness.metadataReady ? 'border-success-200 bg-success-50/20' : 'border-danger-200 bg-danger-50/20'}`}>
            <span className="text-text-700">Metadata</span>
            <span className={distReadiness.metadataReady ? 'text-success-500' : 'text-danger-500'}>{distReadiness.metadataReady ? 'Ready' : `${distReadiness.missingMetadata.length} missing`}</span>
          </div>
          <div className={`flex items-center justify-between rounded border px-3 py-2 ${distReadiness.deliverablesReady ? 'border-success-200 bg-success-50/20' : 'border-danger-200 bg-danger-50/20'}`}>
            <span className="text-text-700">Deliverables</span>
            <span className={distReadiness.deliverablesReady ? 'text-success-500' : 'text-danger-500'}>{distReadiness.deliverablesReady ? 'Ready' : `${distReadiness.missingDeliverables} missing`}</span>
          </div>
          <div className={`flex items-center justify-between rounded border px-3 py-2 ${distReadiness.requirementsReady ? 'border-success-200 bg-success-50/20' : 'border-danger-200 bg-danger-50/20'}`}>
            <span className="text-text-700">Requirements</span>
            <span className={distReadiness.requirementsReady ? 'text-success-500' : 'text-danger-500'}>{distReadiness.requirementsReady ? 'Ready' : `${distReadiness.missingRequirements} missing`}</span>
          </div>
          <div className={`flex items-center justify-between rounded border px-3 py-2 ${distReadiness.dependenciesReady ? 'border-success-200 bg-success-50/20' : 'border-danger-200 bg-danger-50/20'}`}>
            <span className="text-text-700">Dependencies</span>
            <span className={distReadiness.dependenciesReady ? 'text-success-500' : 'text-danger-500'}>{distReadiness.dependenciesReady ? 'Ready' : `${distReadiness.missingDependencies} missing`}</span>
          </div>
        </div>
        <div className="mt-4">
          <Button size="sm" onClick={handleGeneratePackage}>Generate Distribution Package</Button>
        </div>
      </Card>
    </div>
  );
}

function CampaignsTab() {
  return <EmptyState title="No campaigns" description="Campaigns will appear here when created for this release." />;
}

function BudgetTab() {
  return <EmptyState title="No budget data" description="Budget information will appear here when configured." />;
}

function RightsTab({ ownership }: { ownership: OwnershipValidation }) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-900">Rights Ownership</h2>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${ownership.valid ? 'bg-success-50 text-success-500' : 'bg-danger-50 text-danger-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${ownership.valid ? 'bg-success-500' : 'bg-danger-500'}`} />
            {ownership.valid ? 'Cleared' : 'Incomplete'}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ownership.masterPct > 0 ? (
            <div className="border border-surface-200 rounded-lg p-4">
              <p className="text-xs text-text-400 uppercase tracking-wider mb-2">Master Recording</p>
              <div className="flex items-end justify-between">
                <span className={`text-2xl font-bold ${ownership.masterPct === 100 ? 'text-success-500' : 'text-danger-500'}`}>{ownership.masterPct}%</span>
                <span className="text-xs text-text-400">ownership</span>
              </div>
              <ProgressBar value={ownership.masterPct} color={ownership.masterPct === 100 ? 'bg-success-500' : 'bg-danger-500'} className="mt-2" size="sm" />
            </div>
          ) : null}
          {ownership.publishingPct > 0 ? (
            <div className="border border-surface-200 rounded-lg p-4">
              <p className="text-xs text-text-400 uppercase tracking-wider mb-2">Publishing</p>
              <div className="flex items-end justify-between">
                <span className={`text-2xl font-bold ${ownership.publishingPct === 100 ? 'text-success-500' : 'text-danger-500'}`}>{ownership.publishingPct}%</span>
                <span className="text-xs text-text-400">ownership</span>
              </div>
              <ProgressBar value={ownership.publishingPct} color={ownership.publishingPct === 100 ? 'bg-success-500' : 'bg-danger-500'} className="mt-2" size="sm" />
            </div>
          ) : null}
        </div>
        {ownership.issues.length > 0 && (
          <div className="mt-4 space-y-1">
            {ownership.issues.map((i) => <p key={i} className="text-xs text-danger-500 bg-danger-50 rounded px-2 py-1">{i}</p>)}
          </div>
        )}
      </Card>
    </div>
  );
}

function CreditsTab() {
  return <EmptyState title="No credits" description="Track credits will appear here when recorded." />;
}

function ActivityTab({ activities, loading }: { activities: { id: string; type: string; actorId: string; createdAt: Date }[]; loading: boolean }) {
  if (loading) return <LoadingState text="Loading activity..." />;
  if (activities.length === 0) return <EmptyState title="No activity" description="Activity will appear as actions are taken." />;
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-text-900 mb-3">Activity ({activities.length})</h2>
      {activities.map((a) => (
        <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-200 pl-3 py-1">
          <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
          <div><p className="text-sm text-text-700 capitalize">{a.type.replace(/_/g, ' ')}</p><p className="text-xs text-text-400">{a.actorId} &middot; {a.createdAt.toLocaleDateString()}</p></div>
        </div>
      ))}
    </div>
  );
}

function SettingsTab({ release }: { release: Release }) {
  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <h2 className="text-sm font-semibold text-text-900 mb-4">Release Metadata</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-text-500">Title</dt><dd className="text-text-900 font-medium">{release.title}</dd></div>
          <div className="flex justify-between"><dt className="text-text-500">Type</dt><dd className="text-text-700 capitalize">{release.releaseType}</dd></div>
          {release.genre ? <div className="flex justify-between"><dt className="text-text-500">Genre</dt><dd className="text-text-700">{release.genre}</dd></div> : null}
          {release.label ? <div className="flex justify-between"><dt className="text-text-500">Label</dt><dd className="text-text-700">{release.label}</dd></div> : null}
          {release.upc ? <div className="flex justify-between"><dt className="text-text-500">UPC</dt><dd className="text-text-700 font-mono text-xs">{release.upc}</dd></div> : <div className="flex justify-between"><dt className="text-text-500">UPC</dt><dd className="text-text-400">&mdash;</dd></div>}
          {release.catalogNumber ? <div className="flex justify-between"><dt className="text-text-500">Catalog</dt><dd className="text-text-700">{release.catalogNumber}</dd></div> : null}
          {release.targetReleaseDate instanceof Date ? <div className="flex justify-between"><dt className="text-text-500">Release Date</dt><dd className="text-text-700">{fmtDate(release.targetReleaseDate)}</dd></div> : null}
        </dl>
      </Card>
      <div className="flex gap-2">
        <Link href={`/releases/${release.id}/edit`}><Button variant="outline" size="sm">Edit Metadata</Button></Link>
      </div>
    </div>
  );
}
