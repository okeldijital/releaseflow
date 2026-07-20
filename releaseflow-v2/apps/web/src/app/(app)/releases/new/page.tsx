'use client';

import { useState, useEffect } from 'react';
import { ReleaseWizard } from '@/components/release/wizard/ReleaseWizard';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { fetchDraftsByUser } from '@/lib/release-service';
import { deleteRelease } from '@/lib/release-repository';
import { LoadingState } from '@releaseflow/ui';
import { RELEASE_TYPE_LABELS } from '@/components/release/status/release-status-config';
import type { ReleaseRecord } from '@/lib/release-repository';
import type { WizardDraftData } from '@/components/release/wizard/release-wizard-types';

function fmtDate(ts: unknown): string {
  if (!ts) return 'Unknown';
  let d: Date;
  if (ts instanceof Date) { d = ts; }
  else if (typeof ts === 'object' && ts !== null && 'seconds' in ts) { d = new Date((ts as { seconds: number }).seconds * 1000); }
  else if (typeof ts === 'string') { d = new Date(ts); }
  else return 'Unknown';
  return d.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCompletionLabel(wd: Partial<WizardDraftData>): string {
  let completed = 0;
  const total = 7;
  if (wd.releaseTitle?.trim()) completed++;
  if (wd.hasArtwork !== null || wd.commissionArtwork !== null) completed++;
  if (wd.tracks?.some((t: { title: string }) => t.title.trim())) completed++;
  if (wd.primaryArtist || wd.featuredArtists?.length) completed++;
  if (wd.recordLabel || wd.upc || wd.primaryGenre) completed++;
  if (wd.promoAssets?.length || wd.socialRows?.some((r: { url: string }) => r.url)) completed++;
  if (wd.hasEmail !== null) completed++;
  const pct = Math.round((completed / total) * 100);
  return `${pct}% complete`;
}

function getCurrentStepLabel(wd: Partial<WizardDraftData>): string {
  const idx = typeof wd.currentStep === 'number' ? wd.currentStep : 0;
  const keys = ['type', 'details', 'artwork', 'tracks', 'release_info', 'promotion', 'email', 'review'];
  const labels: Record<string, string> = {
    type: 'Release Type',
    details: 'Details',
    artwork: 'Artwork',
    tracks: 'Tracks',
    release_info: 'Release Info',
    promotion: 'Promotion',
    email: 'Email',
    review: 'Review',
  };
  return labels[keys[idx] ?? ''] ?? 'Unknown';
}

export default function NewReleasePage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const [checkingDraft, setCheckingDraft] = useState(true);
  const [drafts, setDrafts] = useState<ReleaseRecord[]>([]);
  const [resumeDraftId, setResumeDraftId] = useState<string | undefined>(undefined);
  const [discarding, setDiscarding] = useState(false);

  useEffect(() => {
    async function check() {
      if (!user || !activeOrgId) {
        setCheckingDraft(false);
        return;
      }
      try {
        const allDrafts = await fetchDraftsByUser(activeOrgId, user.uid);
        setDrafts(allDrafts);
      } catch {
        // ignore
      } finally {
        setCheckingDraft(false);
      }
    }
    check();
  }, [user, activeOrgId]);

  async function handleDiscard(id: string) {
    setDiscarding(true);
    try {
      await deleteRelease(id);
      setDrafts((p) => p.filter((d) => d.id !== id));
    } catch {
      // ignore
    } finally {
      setDiscarding(false);
    }
  }

  if (checkingDraft) {
    return (
      <div className="mx-auto max-w-lg px-5 sm:px-7 py-12 page-transition">
        <div className="flex items-center justify-center py-20"><LoadingState /></div>
      </div>
    );
  }

  if (drafts.length > 0 && !resumeDraftId) {
    return (
      <div className="mx-auto max-w-lg px-5 sm:px-7 py-12 page-transition">
        <div className="rounded-xl border border-surface-200 bg-layer-2 divide-y divide-surface-200 overflow-hidden">
          {drafts.map((draft) => {
            const wd = (draft.wizardData || {}) as Partial<WizardDraftData>;
            return (
              <div key={draft.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-primary-400 truncate">{draft.title || 'Untitled Draft'}</h3>
                    <p className="text-xs text-text-500 mt-0.5">{RELEASE_TYPE_LABELS[wd.releaseType as string] ?? '—'}</p>
                  </div>
                  <span className="text-xs font-medium text-text-500 whitespace-nowrap">{getCompletionLabel(wd)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-text-500">
                  <span>Current step: {getCurrentStepLabel(wd)}</span>
                  <span>Updated {fmtDate(draft.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setResumeDraftId(draft.id)}
                    className="flex-1 h-10 rounded-lg bg-primary-500 text-surface-50 text-sm font-semibold active:scale-[0.98] transition-all"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDiscard(draft.id)}
                    disabled={discarding}
                    className="h-10 px-4 rounded-lg border border-surface-700 bg-transparent text-text-400 text-sm font-semibold active:scale-[0.98] disabled:opacity-40 transition-all"
                  >
                    {discarding ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
          <div className="p-4">
            <button
              type="button"
              onClick={() => setResumeDraftId('new')}
              className="w-full h-10 rounded-lg border border-dashed border-surface-600 text-sm font-medium text-text-500 hover:text-text-300 active:scale-[0.98] transition-all"
            >
              + Start new release
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <ReleaseWizard mode="create" draftId={resumeDraftId === 'new' ? undefined : resumeDraftId} />;
}
