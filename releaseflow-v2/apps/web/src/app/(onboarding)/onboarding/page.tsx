'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { createOrganization, userHasOrganization } from '@/lib/organization-repository';
import { Alert, Button, Card, Input, LoadingState } from '@releaseflow/ui';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/sign-in'); return; }
    userHasOrganization(user.uid).then((hasOrg) => {
      if (hasOrg) router.replace('/dashboard');
      else setChecking(false);
    });
  }, [user, loading, router]);

  function generateSlug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSubmitting(true);
    try {
      await createOrganization(name, slug, user.uid);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (loading || checking) return <LoadingState />;

  return (
    <div className="mx-auto max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-900 dark:text-surface-50">Create your organization</h1>
        <p className="text-text-500 mt-1">Name your label or group to get started.</p>
      </div>

      {error && <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card padding="lg">
          <Input label="Organization Name" type="text" value={name} onChange={(e) => { setName(e.target.value); setSlug(generateSlug(e.target.value)); }} placeholder="My Label" required />
          <Input label="Slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-label" hint="Used in URLs. Lowercase letters, numbers, and hyphens only." required />
        </Card>

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting || !name.trim()} loading={submitting}>
          {submitting ? 'Creating...' : 'Create Organization'}
        </Button>
      </form>
    </div>
  );
}
