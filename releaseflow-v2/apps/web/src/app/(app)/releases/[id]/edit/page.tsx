'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

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
  const [showMetadata, setShowMetadata] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const db = getDb();
      if (!db) return;
      const snap = await getDoc(doc(db, 'releases', id));
      if (!snap.exists()) return;
      const data = snap.data();
      setTitle(data.title ?? '');
      setReleaseType(data.releaseType ?? 'single');
      setStatus(data.status ?? 'draft');
      if (data.targetReleaseDate) {
        const d = data.targetReleaseDate.toDate ? data.targetReleaseDate.toDate() : new Date(data.targetReleaseDate.seconds * 1000);
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
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const db = getDb();
    if (!db) return;
    await updateDoc(doc(db, 'releases', id), {
      title,
      releaseType,
      status,
      targetReleaseDate: targetReleaseDate ? Timestamp.fromDate(new Date(targetReleaseDate)) : null,
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
      updatedAt: Timestamp.now(),
    });
    router.push(`/releases/${id}`);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href={`/releases/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 inline-block">&larr; Back to release</Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">Edit Release</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Release title"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Release Type</label>
          <select value={releaseType} onChange={(e) => setReleaseType(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900">
            {releaseTypes.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900">
            {releaseStatuses.map((rs) => <option key={rs.value} value={rs.value}>{rs.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Target Release Date <span className="text-zinc-400 font-normal">(optional)</span></label>
          <input type="date" value={targetReleaseDate} onChange={(e) => setTargetReleaseDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>

        <div>
          <button type="button" onClick={() => setShowMetadata(!showMetadata)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <svg className={`w-4 h-4 transition-transform ${showMetadata ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            Metadata
          </button>
        </div>

        {showMetadata ? (
          <div className="space-y-4 pl-6 border-l-2 border-zinc-200 dark:border-zinc-700">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">UPC</label>
                <input type="text" value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="012345678901"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Catalog Number</label>
                <input type="text" value={catalogNumber} onChange={(e) => setCatalogNumber(e.target.value)} placeholder="CAT-001"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Label</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label name"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Genre</label>
                <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Electronic"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Subgenre</label>
                <input type="text" value={subgenre} onChange={(e) => setSubgenre(e.target.value)} placeholder="House"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Language</label>
                <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="English"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Copyright</label>
                <input type="text" value={copyright} onChange={(e) => setCopyright(e.target.value)} placeholder="&#169; 2025 Label Name"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">P-Line</label>
                <input type="text" value={pLine} onChange={(e) => setPLine(e.target.value)} placeholder="℗ 2025 Label Name"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">C-Line</label>
                <input type="text" value={cLine} onChange={(e) => setCLine(e.target.value)} placeholder="&#169; 2025 Label Name"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-900" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Explicit Content</span>
                </label>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={submitting || !title.trim()}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={`/releases/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
