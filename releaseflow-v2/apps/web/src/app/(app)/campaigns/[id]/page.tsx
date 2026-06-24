'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import {
  activateCampaign,
  completeCampaign,
  getCampaignTasksByCampaign,
  createCampaignTask,
  completeCampaignTask,
  checkCampaignReadiness,
  getDeliverablesByCampaign,
  type CampaignReadinessResult,
} from '@/lib/campaign-service';
import type { Campaign, CampaignTask } from '@/app/(app)/types';

const typeLabels: Record<string, string> = {
  pre_save: 'Pre-Save',
  social: 'Social',
  press: 'Press',
  playlist: 'Playlist',
  advertising: 'Advertising',
};

const taskTypeOptions = [
  { value: 'schedule_post', label: 'Schedule Post' },
  { value: 'send_press_release', label: 'Send Press Release' },
  { value: 'submit_playlist_pitch', label: 'Submit Playlist Pitch' },
  { value: 'launch_ad', label: 'Launch Ad' },
];

export default function CampaignDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [tasks, setTasks] = useState<CampaignTask[]>([]);
  const [assets, setAssets] = useState<{ id: string; title: string; status: string }[]>([]);
  const [readiness, setReadiness] = useState<CampaignReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState('schedule_post');
  const [creating, setCreating] = useState(false);

  async function loadData() {
    const db = getDb();
    if (!db) return;
    const snap = await getDoc(doc(db, 'campaigns', id));
    if (!snap.exists()) return;
    const c = { id: snap.id, ...snap.data() } as Campaign;
    setCampaign(c);
    const [t, a, r] = await Promise.all([
      getCampaignTasksByCampaign(id),
      getDeliverablesByCampaign(id),
      checkCampaignReadiness(id),
    ]);
    setTasks(t);
    setAssets(a.map((d) => ({ id: d.id as string, title: d.title as string, status: d.status as string })));
    setReadiness(r);
  }

  useEffect(() => {
    loadData().then(() => setLoading(false));
  }, [id]);

  async function handleActivate() {
    if (!campaign) return;
    await activateCampaign(campaign.id, campaign.releaseId, user?.uid ?? '');
    await loadData();
  }

  async function handleComplete() {
    if (!campaign) return;
    await completeCampaign(campaign.id, campaign.releaseId, user?.uid ?? '');
    await loadData();
  }

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !campaign) return;
    setCreating(true);
    await createCampaignTask({
      campaignId: campaign.id,
      type: taskType as never,
      title: taskTitle.trim(),
      releaseId: campaign.releaseId,
      actorId: user?.uid ?? '',
    });
    setTaskTitle('');
    setCreating(false);
    await loadData();
  }

  async function handleCompleteTask(taskId: string) {
    if (!campaign) return;
    await completeCampaignTask(taskId, campaign.releaseId, user?.uid ?? '');
    await loadData();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" /></div>;
  }
  if (!campaign) {
    return <div className="flex items-center justify-center py-20"><p className="text-zinc-500">Campaign not found.</p></div>;
  }

  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/campaigns" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 inline-block">&larr; Back</Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{campaign.name}</h1>
          <div className="flex gap-2 mt-2">
            <span className="text-sm rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-zinc-700 dark:text-zinc-300">{typeLabels[campaign.type] ?? campaign.type}</span>
            <span className="text-sm rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-zinc-700 dark:text-zinc-300 capitalize">{campaign.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === 'draft' ? (
            <button onClick={handleActivate} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Activate</button>
          ) : null}
          {campaign.status === 'active' ? (
            <button onClick={handleComplete} className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">Complete</button>
          ) : null}
        </div>
      </div>

      {readiness ? (
        <section className="mb-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Campaign Readiness</h2>
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${readiness.canLaunch ? 'bg-emerald-500' : readiness.completeness >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
          </div>
          <div className="mb-2 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${readiness.canLaunch ? 'bg-emerald-500' : readiness.completeness >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${readiness.completeness}%` }} />
          </div>
          <div className="flex gap-3 text-xs">
            <span className={readiness.tasksReady ? 'text-emerald-600' : 'text-red-500'}>Tasks: {doneTasks}/{tasks.length}</span>
            <span className={readiness.assetsReady ? 'text-emerald-600' : 'text-red-500'}>Assets: {assets.filter((a) => a.status === 'approved').length}/{assets.length}</span>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Tasks ({doneTasks}/{tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-zinc-400">No campaign tasks yet.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${t.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-zinc-50'}`}>{t.title}</p>
                    <p className="text-xs text-zinc-400 capitalize">{t.type.replace(/_/g, ' ')}</p>
                  </div>
                  {t.status !== 'done' ? (
                    <button onClick={() => handleCompleteTask(t.id)} className="shrink-0 rounded bg-zinc-900 dark:bg-zinc-100 px-2.5 py-1 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">Done</button>
                  ) : (
                    <span className="text-xs text-emerald-600">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title..."
              className="flex-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)}
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900">
              {taskTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button type="submit" disabled={creating || !taskTitle.trim()}
              className="shrink-0 rounded bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50">Add</button>
          </form>
        </section>

        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Promotional Assets ({assets.length})</h2>
          {assets.length === 0 ? (
            <p className="text-sm text-zinc-400">No assets linked.</p>
          ) : (
            <div className="space-y-2">
              {assets.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2">
                  <p className="text-sm text-zinc-900 dark:text-zinc-50 truncate">{a.title}</p>
                  <span className={`text-xs capitalize rounded-full px-2 py-0.5 ${
                    a.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                    a.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    a.status === 'draft' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
