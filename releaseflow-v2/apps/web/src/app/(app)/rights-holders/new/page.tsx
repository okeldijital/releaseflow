'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgStore } from '@/stores/org-store';
import { addRightsHolder } from '@/lib/rights-service';
import { Button, Card, Input, Select } from '@releaseflow/ui';

const holderTypes = [
  { value: 'artist', label: 'Artist' },
  { value: 'publisher', label: 'Publisher' },
  { value: 'label', label: 'Label' },
  { value: 'pro', label: 'PRO' },
  { value: 'distributor', label: 'Distributor' },
] as const;

export default function NewRightsHolderPage() {
  const router = useRouter();
  const { activeOrgId } = useOrgStore();
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
      await addRightsHolder(name.trim(), type as never, activeOrgId ?? '', contact.trim() || undefined, territory.trim() || undefined);
      router.push('/rights-holders');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <Link href="/rights-holders" className="text-sm text-text-500 hover:text-text-200 mb-6 inline-block">&larr; Back</Link>
      <p className="text-display-md font-semibold text-primary-400 tracking-tight mb-8">Add Rights Holder</p>

      <Card padding="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Universal Music Publishing" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Type" value={type} onChange={setType} options={[...holderTypes]} />
            <Input label="Territory" value={territory} onChange={(e) => setTerritory(e.target.value)} placeholder="Worldwide" />
          </div>
          <Input label="Contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="licensing@example.com" />
          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" loading={submitting} disabled={!name.trim()}>Add Rights Holder</Button>
            <Link href="/rights-holders"><Button variant="ghost">Cancel</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
