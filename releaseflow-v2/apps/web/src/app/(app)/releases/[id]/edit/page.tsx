'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { fetchRelease, editRelease } from '@/lib/release-service';
import type { ReleaseRecord } from '@/lib/release-repository';
import { Button, Card, Input, Select, LoadingState, EmptyState } from '@releaseflow/ui';

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

export default function EditReleasePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [releaseType, setReleaseType] = useState('single');
  const [status, setStatus] = useState('draft');
  const [targetReleaseDate, setTargetReleaseDate] = useState('');
  const [upc, setUpc] = useState('');
  const [catalogNumber, setCatalogNumber] = useState('');
  const [label, setLabel] = useState('');
  const [copyright, setCopyright] = useState('');
  const [pLine, setPLine] = useState('');
  const [cLine, setCLine] = useState('');
  const [genre, setGenre] = useState('');
  const [subgenre, setSubgenre] = useState('');
  const [language, setLanguage] = useState('');
  const [explicit, setExplicit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [releaseOrgId, setReleaseOrgId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fetchRelease(id);
      if (!data) { setLoading(false); return; }
      if (activeOrgId && data.organizationId && data.organizationId !== activeOrgId) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      setReleaseOrgId(data.organizationId ?? null);
      setTitle(data.title ?? '');
      setReleaseType(data.releaseType ?? 'single');
      setStatus(data.status ?? 'draft');
      if (data.targetReleaseDate) {
        const d = (data.targetReleaseDate as { toDate?: () => Date; seconds?: number }).toDate
          ? (data.targetReleaseDate as { toDate: () => Date }).toDate()
          : new Date((data.targetReleaseDate as { seconds: number }).seconds * 1000);
        setTargetReleaseDate(d.toISOString().split('T')[0] ?? '');
      }
      setUpc(data.upc ?? '');
      setCatalogNumber(data.catalogNumber ?? '');
      setLabel(data.label ?? '');
      setCopyright(data.copyright ?? '');
      setPLine(data.pLine ?? '');
      setCLine(data.cLine ?? '');
      setGenre(data.genre ?? '');
      setSubgenre(data.subgenre ?? '');
      setLanguage(data.language ?? '');
      setExplicit(data.explicit ?? false);
      setLoading(false);
    }
    load();
  }, [id, activeOrgId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (!user) return;
    if (activeOrgId && releaseOrgId && releaseOrgId !== activeOrgId) return;
    setSubmitting(true);
    setError(null);
    try {
      await editRelease(id, {
        title,
        releaseType: releaseType as ReleaseRecord['releaseType'],
        status: status as ReleaseRecord['status'],
        targetReleaseDate: targetReleaseDate ? new Date(targetReleaseDate) : null,
        upc: upc || null,
        catalogNumber: catalogNumber || null,
        label: label || null,
        copyright: copyright || null,
        pLine: pLine || null,
        cLine: cLine || null,
        genre: genre || null,
        subgenre: subgenre || null,
        language: language || null,
        explicit: explicit || null,
      }, user.uid);
      router.push(`/releases/${id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (forbidden) {
    return (
      <EmptyState
        title="Access Denied"
        description="You do not have permission to edit this release."
        action={{ label: 'Go to Dashboard', onClick: () => router.push('/dashboard') }}
      />
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><LoadingState /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href={`/releases/${id}`} className="text-sm text-text-400 hover:text-surface-50 mb-6 inline-block">&larr; Back to release</Link>
      <div className="mb-8">
        <p className="text-2xl font-bold text-surface-50">Edit Release</p>
        <p className="mt-1 text-sm text-text-400">Update release details without restarting setup.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-surface-50 mb-4">Release Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Release title" label="Release Title" />
            </div>
            <Select label="Release Type" options={releaseTypes.map((rt) => ({ value: rt.value, label: rt.label }))} value={releaseType} onChange={setReleaseType} />
            <Select label="Status" options={releaseStatuses.map((rs) => ({ value: rs.value, label: rs.label }))} value={status} onChange={setStatus} />
            <Input type="date" value={targetReleaseDate} onChange={(e) => setTargetReleaseDate(e.target.value)} label="Release Date" hint="Optional" />
            <Input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label name" label="Company / Label" />
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-sm font-semibold text-surface-50 mb-4">Artists</h2>
          <p className="text-sm text-text-400">Artist links are managed from the release workspace and track workspaces.</p>
        </Card>

        <Card padding="lg">
          <h2 className="text-sm font-semibold text-surface-50 mb-4">Genre & Language</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Electronic" label="Genre" />
            <Input type="text" value={subgenre} onChange={(e) => setSubgenre(e.target.value)} placeholder="House" label="Subgenre" />
            <Input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="English" label="Language" />
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)}
                  className="rounded border-surface-300 text-surface-50 focus:ring-primary-500" />
                <span className="text-sm font-medium text-surface-100">Explicit Content</span>
              </label>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-sm font-semibold text-surface-50 mb-4">Artwork</h2>
          <p className="text-sm text-text-400">Artwork is managed from the artwork card in the Release Workspace.</p>
        </Card>

        <Card padding="lg">
          <h2 className="text-sm font-semibold text-surface-50 mb-4">Metadata</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="text" value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="012345678901" label="UPC" />
            <Input type="text" value={catalogNumber} onChange={(e) => setCatalogNumber(e.target.value)} placeholder="CAT-001" label="Catalog Number" />
            <Input type="text" value={copyright} onChange={(e) => setCopyright(e.target.value)} placeholder="(c) 2026 Label Name" label="Copyright" />
            <Input type="text" value={pLine} onChange={(e) => setPLine(e.target.value)} placeholder="(p) 2026 Label Name" label="P-Line" />
            <Input type="text" value={cLine} onChange={(e) => setCLine(e.target.value)} placeholder="(c) 2026 Label Name" label="C-Line" />
          </div>
        </Card>

        {error && <p className="text-sm text-danger-500">{error}</p>}
        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" variant="primary" disabled={submitting || !title.trim()} loading={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href={`/releases/${id}`} className="text-sm text-text-400 hover:text-surface-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
