'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { useAuth } from '@/contexts/auth-context';
import { collection, query, where, getDocs, getDoc, doc, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { fmtDate } from '@/lib/utils';
import type { Organization, Release } from '../types';

async function getOrgs(userId: string): Promise<Organization[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(collection(db, 'memberships'), where('userId', '==', userId), where('status', '==', 'active'));
  const members = await getDocs(q);
  const orgs: Organization[] = [];
  for (const d of members.docs) {
    const m = d.data() as { organizationId: string };
    const snap = await getDoc(doc(db, 'organizations', m.organizationId));
    if (snap.exists()) orgs.push({ id: snap.id, ...snap.data() } as Organization);
  }
  return orgs;
}

async function getReleases(orgId: string): Promise<Release[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(collection(db, 'releases'), where('organizationId', '==', orgId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Release);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeOrgId, setActiveOrgId } = useOrgStore();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getOrgs(user.uid).then((data) => {
      setOrgs(data);
      if (!activeOrgId && data[0]) setActiveOrgId(data[0].id);
      setLoading(false);
    });
  }, [user, activeOrgId, setActiveOrgId]);

  useEffect(() => {
    if (!activeOrgId) return;
    getReleases(activeOrgId).then(setReleases);
  }, [activeOrgId]);

  const activeOrg = orgs.find((o) => o.id === activeOrgId);
  const activeReleases = releases.filter((r) => r.status === 'released');
  const draftReleases = releases.filter((r) => r.status === 'draft' || r.status === 'planning' || r.status === 'in_production');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          {activeOrg && <p className="text-zinc-500 text-sm mt-1">{activeOrg.name}</p>}
        </div>
      </div>

      {!activeOrgId ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 mb-4">No organization selected.</p>
          <Link href="/organizations" className="inline-block rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800">
            Create or join an organization
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">Total Releases</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{releases.length}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">Released</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{activeReleases.length}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">Drafts</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{draftReleases.length}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Recent Releases</h2>
            <Link href="/releases/new" className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800">New Release</Link>
          </div>

          {releases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
              <p className="text-zinc-500 mb-2">No releases yet</p>
              <Link href="/releases/new" className="text-sm text-zinc-900 dark:text-zinc-100 underline underline-offset-4">Create your first release</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {releases.slice(0, 5).map((release) => (
                <Link key={release.id} href={`/releases/${release.id}`}
                  className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{release.title}</p>
                      <p className="text-sm text-zinc-500 capitalize mt-0.5">{release.releaseType} &middot; {release.status.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-xs text-zinc-400">{fmtDate(release.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
