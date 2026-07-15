'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { fetchRelease, editRelease } from '@/lib/release-service';
import { toast } from '@/stores/toast-store';
import { Card, Button, Input, Select, Switch, LoadingState, EmptyState } from '@releaseflow/ui';
import { ArtworkDisplay } from '@/components/release/artwork-display';
import { RELEASE_TYPE_LABELS } from '@/components/release/status/release-status-config';
import type { Release, ReleaseType } from '@/app/(app)/types';

function tsToDateString(ts: unknown): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts.slice(0, 10);
  const obj = ts as { toDate?: () => Date; seconds?: number };
  const d = obj.toDate ? obj.toDate() : new Date((obj as { seconds: number }).seconds * 1000);
  return d.toISOString().split('T')[0] ?? '';
}

const releaseTypeOptions = Object.entries(RELEASE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export default function EditReleasePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [release, setRelease] = useState<Release | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [title, setTitle] = useState('');
  const [releaseType, setReleaseType] = useState<ReleaseType>('single');
  const [genre, setGenre] = useState('');
  const [subgenre, setSubgenre] = useState('');
  const [language, setLanguage] = useState('');
  const [explicit, setExplicit] = useState(false);
  const [targetReleaseDate, setTargetReleaseDate] = useState('');
  const [estimatedReleaseDate, setEstimatedReleaseDate] = useState('');
  const [label, setLabel] = useState('');
  const [upc, setUpc] = useState('');
  const [catalogNumber, setCatalogNumber] = useState('');
  const [pLine, setPLine] = useState('');
  const [cLine, setCLine] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, router]);

  useEffect(() => {
    if (!id || !activeOrgId) return;
    async function load() {
      const data = await fetchRelease(id);
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (data.organizationId !== activeOrgId) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      setRelease(data as unknown as Release);
      setTitle(data.title ?? '');
      setReleaseType(data.releaseType as ReleaseType);
      setGenre(data.genre ?? '');
      setSubgenre(data.subgenre ?? '');
      setLanguage(data.language ?? '');
      setExplicit(data.explicit ?? false);
      setTargetReleaseDate(tsToDateString(data.targetReleaseDate));
      setEstimatedReleaseDate(tsToDateString(data.estimatedReleaseDate));
      setLabel(data.label ?? '');
      setUpc(data.upc ?? '');
      setCatalogNumber(data.catalogNumber ?? '');
      setPLine(data.pLine ?? '');
      setCLine(data.cLine ?? '');
      setLoading(false);
    }
    load();
  }, [id, activeOrgId]);

  async function handleSave() {
    if (!user || !id) return;

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      await editRelease(id, {
        title: title.trim(),
        releaseType,
        targetReleaseDate: targetReleaseDate ? new Date(targetReleaseDate) : null,
        estimatedReleaseDate: estimatedReleaseDate ? new Date(estimatedReleaseDate) : null,
        upc: upc || null,
        catalogNumber: catalogNumber || null,
        label: label || null,
        pLine: pLine || null,
        cLine: cLine || null,
        genre: genre || null,
        subgenre: subgenre || null,
        language: language || null,
        explicit,
      }, user.uid);
      toast.success('Release updated');
    } catch (err) {
      toast.error('Failed to update release', (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push(`/releases/${id}`);
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-5 sm:px-7 py-12">
        <div className="flex items-center justify-center py-20"><LoadingState /></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-5 sm:px-7 py-12">
        <EmptyState title="Release not found" description="This release does not exist or has been removed." />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-2xl px-5 sm:px-7 py-12">
        <EmptyState
          title="Access Denied"
          description="You do not have permission to edit this release."
          action={{ label: 'Go to Dashboard', onClick: () => router.push('/dashboard') }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-7 py-12 page-transition">
      <h1 className="text-2xl font-semibold text-content-primary mb-8">Release Details</h1>

      <Card padding="md" elevation="card" className="mb-6">
        <div className="flex items-center gap-4">
          <ArtworkDisplay artwork={release?.artwork} releaseTitle={title} size="lg" className="w-24 h-24" />
          <div>
            <p className="font-semibold text-content-primary">{title || 'Untitled Release'}</p>
            <p className="text-sm text-content-label mt-0.5">{RELEASE_TYPE_LABELS[releaseType] ?? releaseType}</p>
            <p className="text-xs text-content-label capitalize mt-0.5">{release?.status?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </Card>

      <Card padding="md" elevation="card" className="mb-6">
        <h2 className="text-sm font-semibold text-content-label uppercase tracking-wider mb-4">General Information</h2>
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            placeholder="Release title"
          />
          <Select
            label="Release Type"
            options={releaseTypeOptions}
            value={releaseType}
            onChange={(v) => setReleaseType(v as ReleaseType)}
          />
        </div>
      </Card>

      <Card padding="md" elevation="card" className="mb-6">
        <h2 className="text-sm font-semibold text-content-label uppercase tracking-wider mb-4">Classification</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Electronic" />
          <Input label="Subgenre" value={subgenre} onChange={(e) => setSubgenre(e.target.value)} placeholder="e.g. House" />
          <Input label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. English" />
          <div className="flex items-end pb-2">
            <Switch label="Explicit" checked={explicit} onChange={setExplicit} />
          </div>
        </div>
      </Card>

      <Card padding="md" elevation="card" className="mb-6">
        <h2 className="text-sm font-semibold text-content-label uppercase tracking-wider mb-4">Release Dates</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Original Release Date" type="date" value={targetReleaseDate} onChange={(e) => setTargetReleaseDate(e.target.value)} />
          <Input label="Digital Release Date" type="date" value={estimatedReleaseDate} onChange={(e) => setEstimatedReleaseDate(e.target.value)} />
        </div>
      </Card>

      <Card padding="md" elevation="card" className="mb-6">
        <h2 className="text-sm font-semibold text-content-label uppercase tracking-wider mb-4">Commercial</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Record label" />
          <Input label="UPC" value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="UPC code" />
          <Input label="Catalogue Number" value={catalogNumber} onChange={(e) => setCatalogNumber(e.target.value)} placeholder="Catalogue number" />
        </div>
      </Card>

      <Card padding="md" elevation="card" className="mb-6">
        <h2 className="text-sm font-semibold text-content-label uppercase tracking-wider mb-4">Rights</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="&#x2117; Copyright" value={pLine} onChange={(e) => setPLine(e.target.value)} placeholder="&#x2117; 2024 Label Name" />
          <Input label="&copy; Copyright" value={cLine} onChange={(e) => setCLine(e.target.value)} placeholder="&copy; 2024 Label Name" />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
        <Button variant="tertiary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
