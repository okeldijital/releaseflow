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
import { Badge, Button, Card, Input, LoadingState, ProgressBar, Select, StatusBadge } from '@releaseflow/ui';
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
    return <LoadingState />;
  }
  if (!campaign) {
    return <div className="flex items-center justify-center py-20"><p className="text-text-500">Campaign not found.</p></div>;
  }

  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/campaigns" className="text-sm text-text-500 hover:text-text-900 dark:hover:text-surface-100 mb-6 inline-block">&larr; Back</Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-900 dark:text-surface-50">{campaign.name}</h1>
          <div className="flex gap-2 mt-2">
            <Badge label={typeLabels[campaign.type] ?? campaign.type} color="bg-surface-100 text-text-700" />
            <StatusBadge status={campaign.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === 'draft' ? (
            <Button onClick={handleActivate}>Activate</Button>
          ) : null}
          {campaign.status === 'active' ? (
            <Button variant="primary" onClick={handleComplete}>Complete</Button>
          ) : null}
        </div>
      </div>

      {readiness ? (
        <Card padding="md" className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-900 dark:text-surface-50">Campaign Readiness</h2>
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${readiness.canLaunch ? 'bg-emerald-500' : readiness.completeness >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
          </div>
          <ProgressBar value={readiness.completeness} color={readiness.canLaunch ? 'bg-emerald-500' : readiness.completeness >= 50 ? 'bg-amber-500' : 'bg-red-500'} showLabel />
          <div className="flex gap-3 text-xs mt-2">
            <span className={readiness.tasksReady ? 'text-success-500' : 'text-red-500'}>Tasks: {doneTasks}/{tasks.length}</span>
            <span className={readiness.assetsReady ? 'text-success-500' : 'text-red-500'}>Assets: {assets.filter((a) => a.status === 'approved').length}/{assets.length}</span>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="md">
          <h2 className="text-sm font-semibold text-text-900 dark:text-surface-50 mb-4">Tasks ({doneTasks}/{tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-text-400">No campaign tasks yet.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-surface-100 dark:border-surface-800 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${t.status === 'done' ? 'line-through text-text-400' : 'text-text-900 dark:text-surface-50'}`}>{t.title}</p>
                    <p className="text-xs text-text-400 capitalize">{t.type.replace(/_/g, ' ')}</p>
                  </div>
                  {t.status !== 'done' ? (
                    <Button variant="primary" size="sm" onClick={() => handleCompleteTask(t.id)}>Done</Button>
                  ) : (
                    <span className="text-xs text-success-500">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddTask} className="flex gap-2">
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title..." />
            <Select options={taskTypeOptions} value={taskType} onChange={(v) => setTaskType(v)} />
            <Button type="submit" variant="primary" size="sm" loading={creating} disabled={creating || !taskTitle.trim()}>Add</Button>
          </form>
        </Card>

        <Card padding="md">
          <h2 className="text-sm font-semibold text-text-900 dark:text-surface-50 mb-4">Promotional Assets ({assets.length})</h2>
          {assets.length === 0 ? (
            <p className="text-sm text-text-400">No assets linked.</p>
          ) : (
            <div className="space-y-2">
              {assets.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-surface-100 dark:border-surface-800 px-3 py-2">
                  <p className="text-sm text-text-900 dark:text-surface-50 truncate">{a.title}</p>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
