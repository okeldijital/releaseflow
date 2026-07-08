'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { createNewWork, checkDuplicateWorks } from '@/lib/work-service';
import { Button, Input, TextArea, Select } from '@releaseflow/ui';
import { toast } from '@/stores/toast-store';

const genreOptions = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'hip_hop', label: 'Hip Hop' },
  { value: 'r&b', label: 'R&B' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'dance', label: 'Dance' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classical', label: 'Classical' },
  { value: 'folk', label: 'Folk' },
  { value: 'afrobeat', label: 'Afrobeat' },
  { value: 'amapiano', label: 'Amapiano' },
  { value: 'gospel', label: 'Gospel' },
  { value: 'other', label: 'Other' },
];

const proOptions = [
  { value: '', label: 'Select PRO...' },
  { value: 'ASCAP', label: 'ASCAP' },
  { value: 'BMI', label: 'BMI' },
  { value: 'SESAC', label: 'SESAC' },
  { value: 'SOCAN', label: 'SOCAN' },
  { value: 'PRS', label: 'PRS' },
  { value: 'GEMA', label: 'GEMA' },
  { value: 'APRA', label: 'APRA' },
  { value: 'JASRAC', label: 'JASRAC' },
  { value: 'CAPASSO', label: 'CAPASSO' },
  { value: 'COMPASS', label: 'COMPASS' },
  { value: 'SUISA', label: 'SUISA' },
  { value: 'SGAE', label: 'SGAE' },
  { value: 'other', label: 'Other' },
];

export default function NewWorkPage() {
  const router = useRouter();
  const { activeOrgId } = useOrgStore();
  const [title, setTitle] = useState('');
  const [alternativeTitle, setAlternativeTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [iswc, setIswc] = useState('');
  const [pro, setPro] = useState('');
  const [copyrightYear, setCopyrightYear] = useState('');
  const [copyrightOwner, setCopyrightOwner] = useState('');
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  async function handleTitleBlur() {
    if (!activeOrgId || !title.trim()) return;
    const dup = await checkDuplicateWorks(activeOrgId, title.trim());
    if (dup.isDuplicate) {
      setDuplicateWarning(
        `A work titled "${title.trim()}" already exists. Consider linking to the existing work instead.`,
      );
    } else {
      setDuplicateWarning(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;
    if (!title.trim()) return;
    setSaving(true);
    try {
      const work = await createNewWork({
        organizationId: activeOrgId,
        title: title.trim(),
        alternativeTitle: alternativeTitle.trim() || null,
        subtitle: subtitle.trim() || null,
        language: language.trim() || null,
        genre: genre || null,
        duration: duration ? parseInt(duration, 10) : null,
        description: description.trim() || null,
        iswc: iswc.trim() || null,
        pro: pro || null,
        copyrightYear: copyrightYear ? parseInt(copyrightYear, 10) : null,
        copyrightOwner: copyrightOwner.trim() || null,
      });
      toast.success('Work created');
      router.push(`/works/${work.id}`);
    } catch (err) {
      toast.error('Failed to create work', (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8">
        <p className="text-display-md font-semibold text-primary-400 tracking-tight">Add Work</p>
        <p className="mt-1 text-sm text-text-400">Register a new musical composition.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title *" value={title} onChange={(e) => { setTitle(e.target.value); setDuplicateWarning(null); }} onBlur={handleTitleBlur} required />
        {duplicateWarning && (
          <div className="rounded-lg border border-warning-500/30 bg-warning-500/5 px-3 py-2">
            <p className="text-xs text-warning-600">{duplicateWarning}</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Alternative Title" value={alternativeTitle} onChange={(e) => setAlternativeTitle(e.target.value)} />
          <Input label="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. English" />
          <Select label="Genre" options={genreOptions} value={genre} onChange={(v) => setGenre(v)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Duration (seconds)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <Input label="ISWC" value={iswc} onChange={(e) => setIswc(e.target.value)} placeholder="T-123456789-0" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="PRO" options={proOptions} value={pro} onChange={(v) => setPro(v)} />
          <Input label="Copyright Year" type="number" value={copyrightYear} onChange={(e) => setCopyrightYear(e.target.value)} />
        </div>
        <Input label="Copyright Owner" value={copyrightOwner} onChange={(e) => setCopyrightOwner(e.target.value)} />
        <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <div className="flex gap-2 pt-4">
          <Button type="submit" loading={saving} disabled={saving || !title.trim()}>
            Create Work
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
