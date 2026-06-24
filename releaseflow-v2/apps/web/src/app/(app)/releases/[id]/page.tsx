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
import { computeReadiness } from '@/lib/readiness-engine';
import { getRequirementsByRelease, submitRequirement, approveRequirement } from '@/lib/requirement-service';
import { getDeliverablesByRelease } from '@/lib/deliverable-service';
import { checkDistributionReadiness, generateDistributionPackage, getLatestDistributionPackage } from '@/lib/distribution-service';
import { validateReleaseOwnership } from '@/lib/rights-service';
import type { OwnershipValidation } from '@/lib/rights-service';
import { getDependenciesByRelease } from '@/lib/dependency-service';
import type { Release, Track, Contributor, Workflow, Stage, Task, ReleaseRequirement, Deliverable, Dependency, DistributionPackage } from '../../types';

const stageStatusStyles: Record<string, string> = {
  not_started: 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900',
  in_progress: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950',
  blocked: 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950',
  review: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950',
  approved: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950',
  completed: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950',
};

const stageLabelStyles: Record<string, string> = {
  not_started: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const healthStyles: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const priorityStyles: Record<string, string> = {
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export default function ReleaseDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [release, setRelease] = useState<Release | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasksByStage, setTasksByStage] = useState<Record<string, Task[]>>({});
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<ReleaseRequirement[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [distPackage, setDistPackage] = useState<DistributionPackage | null>(null);
  const [ownership, setOwnership] = useState<OwnershipValidation | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<string>('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  const actorId = user?.uid ?? 'unknown';

  useEffect(() => {
    async function load() {
      const db = getDb();
      if (!db) return;
      const relSnap = await getDoc(doc(db, 'releases', id));
      if (!relSnap.exists()) { setLoading(false); return; }
      setRelease({ id: relSnap.id, ...relSnap.data() } as Release);

      const [trackSnap, contrSnap, wfSnap] = await Promise.all([
        getDocs(query(collection(db, 'tracks'), where('releaseId', '==', id))),
        getDocs(query(collection(db, 'contributors'), where('releaseId', '==', id))),
        getDocs(query(collection(db, 'workflows'), where('releaseId', '==', id), limit(1))),
      ]);
      setTracks(trackSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Track));
      setContributors(contrSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Contributor));

      if (!wfSnap.empty) {
        const wfDoc = wfSnap.docs[0];
        if (!wfDoc) return;
        const wf = { id: wfDoc.id, ...wfDoc.data() } as Workflow;
        setWorkflow(wf);
        const stageSnap = await getDocs(
          query(collection(db, 'stages'), where('workflowId', '==', wf.id), orderBy('order', 'asc')),
        );
        const stageList = stageSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Stage);
        setStages(stageList);

        const tasksMap: Record<string, Task[]> = {};
        for (const s of stageList) {
          tasksMap[s.id] = await getTasksByStage(s.id);
        }
        setTasksByStage(tasksMap);
      }

      const [reqData, delData] = await Promise.all([
        getRequirementsByRelease(id),
        getDeliverablesByRelease(id),
      ]);
      setRequirements(reqData);
      setDeliverables(delData);

      const depData = await getDependenciesByRelease(id);
      setDependencies(depData);

      const pkg = await getLatestDistributionPackage(id);
      setDistPackage(pkg);

      const ownershipValidation = await validateReleaseOwnership(id);
      setOwnership(ownershipValidation);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleCompleteStage(stageId: string) {
    if (!workflow) return;
    setCompleting(stageId);
    try {
      await stageComplete(workflow.id, stageId, id, actorId);
      const db = getDb();
      if (!db) return;
      const wfSnap = await getDoc(doc(db, 'workflows', workflow.id));
      if (wfSnap.exists()) setWorkflow({ id: wfSnap.id, ...wfSnap.data() } as Workflow);
      const stageSnap = await getDocs(
        query(collection(db, 'stages'), where('workflowId', '==', workflow.id), orderBy('order', 'asc')),
      );
      setStages(stageSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Stage));
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(null);
    }
  }

  async function handleAddTask(stageId: string, e: FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setCreatingTask(true);
    try {
      await createTask(stageId, id, actorId, {
        title: newTaskTitle.trim(),
        priority: newTaskPriority as Task['priority'],
        assigneeId: newTaskAssignee.trim() || undefined,
      });
      setTasksByStage((prev) => ({ ...prev, [stageId]: [] }));
      const updated = await getTasksByStage(stageId);
      setTasksByStage((prev) => ({ ...prev, [stageId]: updated }));
      setNewTaskTitle('');
      setNewTaskPriority('medium');
      setNewTaskAssignee('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleCompleteTask(stageId: string, taskId: string) {
    await completeTask(taskId, id, stageId, actorId);
    const updated = await getTasksByStage(stageId);
    setTasksByStage((prev) => ({ ...prev, [stageId]: updated }));
  }

  async function handleSubmitRequirement(reqId: string) {
    await submitRequirement(reqId);
    const updated = await getRequirementsByRelease(id);
    setRequirements(updated);
  }

  async function handleApproveRequirement(reqId: string) {
    await approveRequirement(reqId);
    const updated = await getRequirementsByRelease(id);
    setRequirements(updated);
  }

  async function handleAssignTask(stageId: string, taskId: string, assigneeId: string) {
    if (!assigneeId.trim()) {
      await unassignTask(taskId, id, stageId, actorId);
    } else {
      await assignTask(taskId, assigneeId.trim(), id, stageId, actorId);
    }
    const updated = await getTasksByStage(stageId);
    setTasksByStage((prev) => ({ ...prev, [stageId]: updated }));
  }

  async function handleGeneratePackage() {
    await generateDistributionPackage(id);
    const pkg = await getLatestDistributionPackage(id);
    setDistPackage(pkg);
  }

  async function handleDelete() {
    const db = getDb();
    if (!db) return;
    if (!confirm('Are you sure you want to delete this release?')) return;
    await deleteDoc(doc(db, 'releases', id));
    router.push('/releases');
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200" /></div>;
  }
  if (!release) {
    return <div className="flex items-center justify-center py-20"><p className="text-zinc-500">Release not found.</p></div>;
  }

  const progress = computeProgress(stages);
  const readiness = computeReadiness(requirements, stages, deliverables, dependencies);
  const distReadiness = release ? checkDistributionReadiness(
    release,
    deliverables.length,
    deliverables.filter((d) => d.status === 'approved').length,
    requirements.length,
    requirements.filter((r) => r.status === 'approved').length,
    dependencies.filter((d) => d.blocking).length,
    dependencies.filter((d) => d.blocking && d.status === 'completed').length,
  ) : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link href="/releases" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 inline-block">&larr; Back to releases</Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{release.title}</h1>
          <div className="flex gap-3 mt-2">
            <span className="text-sm capitalize rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-zinc-700 dark:text-zinc-300">{release.releaseType}</span>
            <span className="text-sm capitalize rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-zinc-700 dark:text-zinc-300">{release.status.replace(/_/g, ' ')}</span>
            {release.targetReleaseDate ? (
              <span className="text-sm rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-zinc-700 dark:text-zinc-300">Target: {fmtDate(release.targetReleaseDate)}</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/releases/${id}/edit`} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Edit</Link>
          <button onClick={handleDelete} className="rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950">Delete</button>
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Release Readiness</h2>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${readiness.ready ? 'bg-emerald-500' : readiness.percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{readiness.ready ? 'Ready' : 'Not Ready'}</span>
          </div>
        </div>

        <div className="mb-3 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${readiness.ready ? 'bg-emerald-500' : readiness.percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${readiness.percentage}%` }}
          />
        </div>
        <p className="text-sm text-zinc-500 mb-4">Ready: {readiness.percentage}%</p>

        <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mb-4">
          <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1">Requirements {readiness.breakdown.requirements.approved}/{readiness.breakdown.requirements.total}</span>
          {readiness.breakdown.workflow ? (
            <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1">Workflow {readiness.breakdown.workflow.completed}/{readiness.breakdown.workflow.total}</span>
          ) : null}
          {readiness.breakdown.deliverables ? (
            <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1">Deliverables {readiness.breakdown.deliverables.approved}/{readiness.breakdown.deliverables.total}</span>
          ) : null}
          {readiness.breakdown.dependencies ? (
            <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1">Dependencies {readiness.breakdown.dependencies.completed}/{readiness.breakdown.dependencies.totalBlocking}</span>
          ) : null}
        </div>

        {readiness.missing.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Missing</p>
            <div className="flex flex-wrap gap-1.5">
              {readiness.missing.map((m) => (
                <span key={m} className="text-xs rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-2.5 py-0.5">{m}</span>
              ))}
            </div>
          </div>
        )}

        {requirements.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Requirements</p>
            <div className="space-y-1">
              {requirements.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${
                      req.status === 'approved' ? 'bg-emerald-500' : req.status === 'submitted' ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-600'
                    }`} />
                    <span className={`text-sm truncate ${req.status === 'approved' ? 'text-zinc-900 dark:text-zinc-50 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>{req.name}</span>
                    <span className={`text-xs capitalize ${req.status === 'approved' ? 'text-emerald-600' : req.status === 'submitted' ? 'text-amber-600' : 'text-zinc-400'}`}>{req.status}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {req.status === 'required' ? (
                      <button onClick={() => handleSubmitRequirement(req.id)} className="rounded px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">Submit</button>
                    ) : null}
                    {req.status === 'submitted' ? (
                      <button onClick={() => handleApproveRequirement(req.id)} className="rounded px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">Approve</button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {workflow && stages.length > 0 ? (
        <section className="mb-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Workflow</h2>
            <div className="flex items-center gap-3">
              {workflow.health ? (
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${healthStyles[workflow.health] ?? 'bg-zinc-400'}`} title={workflow.health} />
              ) : null}
              <span className="text-sm text-zinc-500">{progress.progress}%</span>
            </div>
          </div>

          <div className="mb-5 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-500"
              style={{ width: `${progress.progress}%` }}
            />
          </div>

          <div className="space-y-2">
            {stages.map((stage) => {
              const isCurrent = stage.id === workflow.currentStageId;
              const tasks = tasksByStage[stage.id] ?? [];
              const done = tasks.filter((t) => t.status === 'done').length;
              return (
                <div key={stage.id}>
                  <div
                    className={`rounded-lg border px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${stageStatusStyles[stage.status] ?? ''} hover:shadow-sm`}
                    onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-zinc-400 w-5 shrink-0 text-right">{stage.order}.</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{stage.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs capitalize rounded-full px-2 py-0.5 ${stageLabelStyles[stage.status] ?? ''}`}>
                            {stage.status.replace(/_/g, ' ')}
                          </span>
                          {stage.assignedRole ? (
                            <span className="text-xs text-zinc-400 capitalize">{stage.assignedRole.replace(/_/g, ' ')}</span>
                          ) : null}
                          {tasks.length > 0 ? (
                            <span className="text-xs text-zinc-400">{done}/{tasks.length} tasks</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isCurrent && stage.status !== 'completed' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCompleteStage(stage.id); }}
                          disabled={completing === stage.id}
                          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                        >
                          {completing === stage.id ? 'Completing...' : 'Complete Stage'}
                        </button>
                      ) : null}
                      <svg
                        className={`w-4 h-4 text-zinc-400 transition-transform ${expandedStage === stage.id ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {expandedStage === stage.id ? (
                    <div className="ml-7 mt-2 space-y-2 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                      {tasks.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-2">No tasks yet.</p>
                      ) : (
                        tasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2">
                            <button
                              onClick={() => handleCompleteTask(stage.id, task.id)}
                              className={`shrink-0 w-4 h-4 rounded border ${
                                task.status === 'done'
                                  ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100'
                                  : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-900 dark:hover:border-zinc-100'
                              } flex items-center justify-center transition-colors`}
                            >
                              {task.status === 'done' ? (
                                <svg className="w-3 h-3 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : null}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm truncate ${task.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-zinc-50'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs capitalize rounded-full px-1.5 py-0.5 ${priorityStyles[task.priority] ?? ''}`}>
                                  {task.priority}
                                </span>
                                {task.assigneeId ? (
                                  <span className="text-xs text-zinc-400">{task.assigneeId}</span>
                                ) : null}
                              </div>
                            </div>
                            <input
                              type="text"
                              defaultValue={task.assigneeId ?? ''}
                              placeholder="assignee"
                              onBlur={(e) => {
                                if (e.target.value !== (task.assigneeId ?? '')) {
                                  handleAssignTask(stage.id, task.id, e.target.value);
                                }
                              }}
                              className="w-28 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                          </div>
                        ))
                      )}

                      <form onSubmit={(e) => handleAddTask(stage.id, e)} className="flex items-center gap-2 pt-1 pb-2">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="New task..."
                          className="flex-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value)}
                          className="rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                          <option value="low">low</option>
                          <option value="medium">med</option>
                          <option value="high">high</option>
                          <option value="critical">crit</option>
                        </select>
                        <input
                          type="text"
                          value={newTaskAssignee}
                          onChange={(e) => setNewTaskAssignee(e.target.value)}
                          placeholder="assignee"
                          className="w-24 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                        <button
                          type="submit"
                          disabled={creatingTask || !newTaskTitle.trim()}
                          className="shrink-0 rounded bg-zinc-900 dark:bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {distReadiness ? (
        <section className="mb-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Distribution Readiness</h2>
            <div className="flex items-center gap-3">
              {distPackage ? (
                <span className="text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-zinc-600 dark:text-zinc-400 capitalize">{distPackage.status}</span>
              ) : null}
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${distReadiness.canDistribute ? 'bg-emerald-500' : distReadiness.completeness >= 66 ? 'bg-amber-500' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{distReadiness.canDistribute ? 'Ready to deliver' : 'Not ready'}</span>
            </div>
          </div>

          <div className="mb-3 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${distReadiness.canDistribute ? 'bg-emerald-500' : distReadiness.completeness >= 66 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${distReadiness.completeness}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-3 text-xs mb-3">
            <span className={`rounded-full px-2 py-0.5 ${distReadiness.metadataReady ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
              {distReadiness.metadataReady ? '✓' : '✗'} Metadata
            </span>
            <span className={`rounded-full px-2 py-0.5 ${distReadiness.deliverablesReady ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
              {distReadiness.deliverablesReady ? '✓' : '✗'} Deliverables ({distReadiness.missingDeliverables} missing)
            </span>
            <span className={`rounded-full px-2 py-0.5 ${distReadiness.requirementsReady ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
              {distReadiness.requirementsReady ? '✓' : '✗'} Requirements ({distReadiness.missingRequirements} missing)
            </span>
            <span className={`rounded-full px-2 py-0.5 ${distReadiness.dependenciesReady ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
              {distReadiness.dependenciesReady ? '✓' : '✗'} Dependencies ({distReadiness.missingDependencies} missing)
            </span>
          </div>

          {distReadiness.missingMetadata.length > 0 ? (
            <div className="mb-3">
              <p className="text-xs text-zinc-400 mb-1">Missing metadata:</p>
              <div className="flex flex-wrap gap-1">
                {distReadiness.missingMetadata.map((f) => (
                  <span key={f} className="text-xs rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.5">{f}</span>
                ))}
              </div>
            </div>
          ) : null}

          <button
            onClick={handleGeneratePackage}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Generate Distribution Package
          </button>
        </section>
      ) : null}

      {ownership ? (
        <section className="mb-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Rights Ownership</h2>
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${ownership.valid ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </div>

          {ownership.masterPct > 0 || ownership.publishingPct > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 text-xs mb-3">
              {ownership.masterPct > 0 ? (
                <div className="flex items-center justify-between rounded border border-zinc-100 dark:border-zinc-800 px-3 py-2">
                  <span className="text-zinc-600 dark:text-zinc-400">Master</span>
                  <span className={`font-medium ${ownership.masterPct === 100 ? 'text-emerald-600' : 'text-red-500'}`}>{ownership.masterPct}%</span>
                </div>
              ) : null}
              {ownership.publishingPct > 0 ? (
                <div className="flex items-center justify-between rounded border border-zinc-100 dark:border-zinc-800 px-3 py-2">
                  <span className="text-zinc-600 dark:text-zinc-400">Publishing</span>
                  <span className={`font-medium ${ownership.publishingPct === 100 ? 'text-emerald-600' : 'text-red-500'}`}>{ownership.publishingPct}%</span>
                </div>
              ) : null}
              {ownership.mechanicalPct > 0 ? (
                <div className="flex items-center justify-between rounded border border-zinc-100 dark:border-zinc-800 px-3 py-2">
                  <span className="text-zinc-600 dark:text-zinc-400">Mechanical</span>
                  <span className="text-xs text-zinc-500">{ownership.mechanicalPct}%</span>
                </div>
              ) : null}
              {ownership.neighbouringPct > 0 ? (
                <div className="flex items-center justify-between rounded border border-zinc-100 dark:border-zinc-800 px-3 py-2">
                  <span className="text-zinc-600 dark:text-zinc-400">Neighbouring</span>
                  <span className="text-xs text-zinc-500">{ownership.neighbouringPct}%</span>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 mb-3">No ownership splits defined yet.</p>
          )}

          {ownership.issues.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {ownership.issues.map((issue) => (
                <span key={issue} className="text-xs rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-2 py-0.5">{issue}</span>
              ))}
            </div>
          ) : ownership.masterPct > 0 || ownership.publishingPct > 0 ? (
            <span className="text-xs text-emerald-600">Rights-ready</span>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Tracks ({tracks.length})</h3>
          </div>
          {tracks.length === 0 ? (
            <p className="text-sm text-zinc-500">No tracks added yet.</p>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => (
                <div key={track.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{track.title}</p>
                    {track.version && <p className="text-xs text-zinc-400">{track.version}</p>}
                  </div>
                  <div className="text-sm text-zinc-500">
                    {track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : '--:--'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Contributors ({contributors.length})</h3>
          </div>
          {contributors.length === 0 ? (
            <p className="text-sm text-zinc-500">No contributors added yet.</p>
          ) : (
            <div className="space-y-2">
              {contributors.map((c) => (
                <div key={c.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 flex items-center justify-between">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{c.userId}</p>
                  <span className="text-xs capitalize rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-zinc-600 dark:text-zinc-400">{c.contributorRole.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
