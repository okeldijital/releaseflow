'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createRightsHolder } from '@/lib/rights-service';

const holderTypes = [
  { value: 'artist', label: 'Artist' },
  { value: 'publisher', label: 'Publisher' },
  { value: 'label', label: 'Label' },
  { value: 'pro', label: 'PRO' },
  { value: 'distributor', label: 'Distributor' },
] as const;

export default function NewRightsHolderPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('artist');
  const [contact, setContact] = useState('');
  const [territory, setTerritory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createRightsHolder(name.trim(), type as never, contact.trim() || undefined, territory.trim() || undefined);
      router.push('/rights-holders');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <Link href="/rights-holders" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 inline-block">&larr; Back</Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">Add Rights Holder</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Universal Music Publishing"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900">
              {holderTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Territory</label>
            <input type="text" value={territory} onChange={(e) => setTerritory(e.target.value)} placeholder="Worldwide"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Contact</label>
          <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="licensing@example.com"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
        </div>
        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={submitting || !name.trim()}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add Rights Holder'}
          </button>
          <Link href="/rights-holders" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
