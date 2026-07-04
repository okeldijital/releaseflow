'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useArtist, useArtists } from '@/hooks/useArtist';
import { useOrgStore } from '@/stores/org-store';
import { useActivity } from '@/hooks/useWorkflow';
import { editArtist } from '@/lib/artist-service';
import {
  Avatar, Badge, Button, Card, EmptyState, Input, StatusBadge, TextArea, Tabs,
  WorkspaceLayout, Skeleton,
} from '@releaseflow/ui';
import {
  OperationalSummary, ReadinessStack, ContextRail, HealthRing,
} from '@releaseflow/domain-ui';

const typeLabels: Record<string, string> = {
  original_artist: 'Original Artist', remix_artist: 'Remix Artist',
  cover_artist: 'Cover Artist', producer: 'Producer', dj: 'DJ',
  band: 'Band', label: 'Label',
};

const TAB_IDS = ['overview', 'releases', 'credits', 'assets', 'press-kit', 'activity'] as const;
type TabId = typeof TAB_IDS[number];

export default function ArtistDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { activeOrgId } = useOrgStore();
  const { artist, releases, credits, readiness, loading, refresh } = useArtist(id);
  const { bumpArtistCatalogue } = useArtists();
  const { activities, loading: activityLoading } = useActivity(id);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [genres, setGenres] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tab, setTab] = useState<TabId>('overview');

  useEffect(() => {
    if (artist) {
      setBio(artist.bio ?? '');
      setCountry(artist.country ?? '');
      setGenres((artist.genres ?? []).join(', '));
      setImageUrl(artist.imageUrl ?? '');
    }
  }, [artist]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;
    await editArtist(activeOrgId, id, {
      bio: bio.trim() || null,
      country: country.trim() || null,
      genres: genres ? genres.split(',').map((g) => g.trim()).filter(Boolean) : null,
      imageUrl: imageUrl.trim() || null,
    });
    bumpArtistCatalogue();
    setEditing(false);
    await refresh();
  }

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

  if (!artist) {
    return <div className="flex items-center justify-center py-20"><p className="text-text-400">Artist not found.</p></div>;
  }

  const activeReleases = releases.filter((r) => r.status !== 'released' && r.status !== 'cancelled' && r.status !== 'archived');
  const completedReleases = releases.filter((r) => r.status === 'released');

  const readinessItems = [
    { id: 'photo', category: 'Artist Photo', status: (artist.imageUrl ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.imageUrl ? 'Uploaded' : 'Missing' },
    { id: 'bio', category: 'Bio', status: (artist.bio ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.bio ? 'Complete' : 'Missing' },
    { id: 'genres', category: 'Genres', status: ((artist.genres?.length ?? 0) > 0 ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.genres ? artist.genres.join(', ') : 'Not specified' },
    { id: 'social', category: 'Social Links', status: (artist.socialLinks?.instagram || artist.socialLinks?.spotify ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: artist.socialLinks?.instagram ? 'Instagram linked' : artist.socialLinks?.spotify ? 'Spotify linked' : 'No links' },
    { id: 'releases', category: 'Releases', status: (releases.length > 0 ? 'ready' : 'not-ready') as 'ready' | 'not-ready', description: `${releases.length} release${releases.length !== 1 ? 's' : ''}` },
  ];

  const readinessCategories: Record<string, { status: 'ready' | 'not-ready'; description?: string; guidance?: string }> = {};
  for (const item of readinessItems) {
    readinessCategories[item.category] = { status: item.status, description: item.description };
  }

  const healthPct = readiness?.percentage ?? Math.round(
    (readinessItems.filter((i) => i.status === 'ready').length / Math.max(1, readinessItems.length)) * 100
  );

  const contextRailContent = (
    <div className="p-4 space-y-6">
      <HealthRing size="md" health={healthPct} readiness={healthPct} timelineConfidence={activeReleases.length > 0 ? 70 : 100} workflowCompletion={healthPct} currentStage={artist.status} />
      <ReadinessStack categories={readinessCategories} />
      <ContextRail releaseName={artist.name} releaseType={typeLabels[artist.artistType] ?? artist.artistType} currentStage={artist.status} releaseDate={artist.country ?? 'Unknown'} health={healthPct} attentionItems={readiness?.missing.map((m, i) => ({ id: `missing-${i}`, label: m, type: 'deadline' as const })) ?? []} />
    </div>
  );

  const tabs = TAB_IDS.map((t) => ({ id: t, label: t === 'press-kit' ? 'Press Kit' : t.charAt(0).toUpperCase() + t.slice(1), count: t === 'releases' ? releases.length : t === 'credits' ? credits.length : undefined }));

  return (
    <WorkspaceLayout contextRail={contextRailContent}>
      <div className="px-6 py-6">
        <Link href="/artists" className="text-sm text-text-400 hover:text-surface-50 mb-5 inline-block">&larr; Back to artists</Link>

        {/* ===== Artist Hero ===== */}
        <header className="mb-12">
          <div className="flex items-start gap-5">
            <Avatar name={artist.name} src={artist.imageUrl ?? undefined} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[1.75rem] font-semibold text-surface-50 tracking-tight">{artist.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="text-sm text-text-400">{typeLabels[artist.artistType] ?? artist.artistType}</span>
                    {artist.country ? <span className="text-sm text-text-500">&middot; {artist.country}</span> : null}
                  </div>
                </div>
                <div className="shrink-0">
                  <Link href={`/releases/new?artistId=${id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 h-9 text-sm font-medium text-white shadow-sm hover:bg-primary-600 active:scale-[0.98] transition-all duration-150">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Release
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                <span className={`text-xs font-medium ${healthPct >= 80 ? 'text-success-600' : healthPct >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>
                  {healthPct >= 80 ? 'Complete' : healthPct >= 50 ? 'In Progress' : 'Needs Work'} &middot; {healthPct}%
                </span>
                <span className="text-xs text-text-500">{activeReleases.length} active &middot; {completedReleases.length} completed &middot; {credits.length} credits</span>
              </div>

              <div className="flex gap-3 mt-3">
                {artist.socialLinks?.instagram ? <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-text-500 hover:text-surface-100 underline">Instagram</a> : null}
                {artist.socialLinks?.spotify ? <a href={artist.socialLinks.spotify} target="_blank" rel="noopener noreferrer" className="text-xs text-text-500 hover:text-surface-100 underline">Spotify</a> : null}
                {artist.socialLinks?.website ? <a href={artist.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-xs text-text-500 hover:text-surface-100 underline">Website</a> : null}
              </div>
            </div>
          </div>
        </header>

        {/* ===== Artist Health — Dominant Region ===== */}
        <div className="mb-14">
          <OperationalSummary healthScore={healthPct} currentStage={artist.status} completedStages={completedReleases.length} totalStages={releases.length} readyItems={readinessItems.filter((i) => i.status === 'ready').length} totalItems={readinessItems.length} pendingApprovals={0} blockers={0} daysUntilRelease={activeReleases.length} />
        </div>

        <Tabs tabs={tabs} activeTab={tab} onChange={(t) => setTab(t as TabId)} variant="underline" className="mb-8" />

        {tab === 'overview' && (
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-surface-50">Profile</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
              </div>
              {editing ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <TextArea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Bio" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
                    <Input value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Genres (comma-separated)" />
                  </div>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" />
                  <div className="flex gap-2"><Button type="submit" size="sm">Save</Button></div>
                </form>
              ) : (
                <Card><p className="text-sm text-surface-100 whitespace-pre-wrap">{artist.bio || 'No bio yet.'}</p></Card>
              )}
            </section>

            <section>
              <h2 className="text-base font-semibold text-surface-50 mb-4">Active Releases ({activeReleases.length})</h2>
              {activeReleases.length === 0 ? (
                <EmptyState title="No active releases" description="Active releases will appear here when this artist is linked to a release in progress." />
              ) : (
                <div className="space-y-3">
                  {activeReleases.map((r) => (
                     <Link key={r.id} href={`/releases/${r.id}`} className="block rounded-lg border border-surface-700/60 bg-surface-900 p-4 hover:border-primary-200 hover:shadow-raised transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div><span className="text-base font-semibold text-surface-50">{r.title}</span><Badge label={r.releaseType} color="bg-surface-100 text-text-400" size="sm" className="ml-2" /><span className="text-sm text-text-500 ml-2 capitalize">{r.role.replace(/_/g, ' ')}</span></div>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="flex items-center justify-between"><span className="text-xs text-text-500">Active release</span><span className="text-xs text-primary-500 font-medium">Open Release &rarr;</span></div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {completedReleases.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-surface-50 mb-4">Completed Releases ({completedReleases.length})</h2>
                <div className="space-y-2">
                  {completedReleases.map((r) => (
                    <Link key={r.id} href={`/releases/${r.id}`} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3 hover:bg-surface-50 transition-colors">
                      <div><span className="text-sm font-medium text-surface-50">{r.title}</span><Badge label={r.releaseType} color="bg-surface-100 text-text-400" size="sm" className="ml-2" /></div>
                      <div className="flex items-center gap-2"><span className="text-xs capitalize text-text-500">{r.role.replace(/_/g, ' ')}</span><StatusBadge status="completed" /></div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {tab === 'releases' && (
          <section>
            <h2 className="text-base font-semibold text-surface-50 mb-4">Discography ({releases.length})</h2>
            {releases.length === 0 ? <EmptyState title="No releases" description="Not linked to any releases yet." /> : (
              <div className="space-y-2">
                {releases.map((r) => (
                  <Link key={r.id} href={`/releases/${r.id}`} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3 hover:border-primary-200 transition-colors">
                    <div><p className="text-sm font-medium text-surface-50 truncate">{r.title}</p><div className="flex items-center gap-2 mt-0.5"><Badge label={r.releaseType} color="bg-surface-100 text-text-400" size="sm" /><span className="text-xs capitalize text-text-500">{r.role.replace(/_/g, ' ')}</span></div></div>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'credits' && (
          <section>
            <h2 className="text-base font-semibold text-surface-50 mb-4">Track Credits ({credits.length})</h2>
            {credits.length === 0 ? <EmptyState title="No track credits" description="No track credits recorded yet." /> : (
              <div className="grid gap-2 sm:grid-cols-2">
                {credits.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-surface-700/60 bg-surface-900 px-4 py-3">
                    <p className="text-sm text-surface-50 truncate">{c.trackTitle ?? c.trackId}</p>
                    <span className="text-xs capitalize text-text-500 shrink-0 ml-2">{c.role.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'assets' && <section><h2 className="text-base font-semibold text-surface-50 mb-4">Assets</h2><EmptyState title="No assets" description="Artist assets will appear here." /></section>}
        {tab === 'activity' && (
          <section>
            <h2 className="text-base font-semibold text-surface-50 mb-4">Activity</h2>
            {activityLoading ? <div className="text-sm text-text-500 py-4">Loading&hellip;</div> : activities.length === 0 ? <EmptyState title="No activity" description="Activity will appear when this artist's releases are updated." /> : (
              <div className="space-y-1">
                {activities.slice(0, 10).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 border-l-2 border-surface-700/60 pl-3 py-1">
                    <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500 shrink-0" />
                    <div><p className="text-sm text-surface-100 capitalize">{a.type.replace(/_/g, ' ')}</p><p className="text-xs text-text-500">{a.actorId} &middot; {a.createdAt.toLocaleDateString()}</p></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        {tab === 'press-kit' && (
          <section>
            <div className="flex items-center justify-between mb-4"><h2 className="text-base font-semibold text-surface-50">Press Kit</h2><Button size="sm" variant="outline">Download PDF</Button></div>
            <div className="space-y-6">
              <Card><h3 className="text-sm font-semibold text-surface-50 mb-3">Bio</h3><p className="text-sm text-surface-100 whitespace-pre-wrap">{artist.bio || 'No bio.'}</p></Card>
              {artist.socialLinks && <Card><h3 className="text-sm font-semibold text-surface-50 mb-3">Social Links</h3><div className="space-y-1 text-sm">{artist.socialLinks.instagram ? <p className="text-text-400">Instagram: <span className="text-surface-100">{artist.socialLinks.instagram}</span></p> : null}{artist.socialLinks.spotify ? <p className="text-text-400">Spotify: <span className="text-surface-100">{artist.socialLinks.spotify}</span></p> : null}{artist.socialLinks.website ? <p className="text-text-400">Website: <span className="text-surface-100">{artist.socialLinks.website}</span></p> : null}</div></Card>}
              <Card><h3 className="text-sm font-semibold text-surface-50 mb-3">Discography</h3>{releases.length === 0 ? <p className="text-sm text-text-500">No releases yet.</p> : <div className="space-y-1">{releases.map((r) => <div key={r.id} className="text-sm text-surface-100">{r.title} ({r.releaseType}) &middot; {r.role.replace(/_/g, ' ')}</div>)}</div>}</Card>
            </div>
          </section>
        )}
      </div>
    </WorkspaceLayout>
  );
}
