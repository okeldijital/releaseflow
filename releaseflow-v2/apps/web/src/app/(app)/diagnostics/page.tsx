'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useRoleStore } from '@/stores/role-store';
import { validateEnvironment } from '@/lib/env-validator';
import { getAuthInstance, getDb } from '@/lib/firebase';
import { Card, Badge } from '@releaseflow/ui';

function useDiagnostics() {
  const { user, loading: authLoading } = useAuth();
  const { activeOrgId } = useOrgStore();
  const { role } = useRoleStore();

  return useMemo(() => {
    const env = validateEnvironment();
    const auth = getAuthInstance();
    const db = getDb();

    return {
      timestamp: new Date().toISOString(),
      version: '0.1.0-beta',
      environment: {
        valid: env.valid,
        summary: env.valid ? 'All variables configured' : `${env.missing.length} variable(s) missing`,
        status: env.valid ? ('ok' as const) : ('error' as const),
        vars: env.present.map((k) => ({ key: k, ok: true })).concat(
          env.missing.map((k) => ({ key: k, ok: false })),
        ),
      },
      firebase: {
        auth: !!auth,
        firestore: !!db,
        status: auth && db ? ('ok' as const) : auth || db ? ('warn' as const) : ('error' as const),
      },
      authentication: {
        loggedIn: !!user,
        loading: authLoading,
        email: user?.email ?? null,
        uid: user?.uid?.slice(0, 12) ?? null,
        status: user ? ('ok' as const) : authLoading ? ('info' as const) : ('warn' as const),
      },
      organization: {
        loaded: !!activeOrgId,
        orgId: activeOrgId?.slice(0, 12) ?? null,
        status: activeOrgId ? ('ok' as const) : ('warn' as const),
      },
      permissions: {
        role: role ?? 'viewer',
        hasRole: role !== 'viewer',
        status: role && role !== 'viewer' ? ('ok' as const) : ('warn' as const),
      },
    };
  }, [user, authLoading, activeOrgId, role]);
}

const StatusIcon = ({ ok }: { ok: boolean }) => (
  <span className={`shrink-0 ${ok ? 'text-success-500' : 'text-danger-500'} text-sm font-bold`}>
    {ok ? '✓' : '✗'}
  </span>
);

const SectionStatus = ({ status }: { status: 'ok' | 'warn' | 'error' | 'info' }) => (
  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
    status === 'ok' ? 'bg-success-500' : status === 'warn' ? 'bg-warning-500' : status === 'error' ? 'bg-danger-500' : 'bg-info-500'
  }`} />
);

export default function DiagnosticsPage() {
  const d = useDiagnostics();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-display-md font-semibold text-primary-400 tracking-tight">System Health</p>
          <p className="text-sm text-text-500 mt-1">
            {d.environment.valid
              ? 'All systems operational'
              : 'Configuration issues detected'}
          </p>
        </div>
        <Badge label={`v${d.version}`} color="bg-surface-100 text-text-500" />
      </div>

      <div className="space-y-3">
        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SectionStatus status={d.environment.status} />
              <h2 className="text-sm font-semibold text-text-700">Environment</h2>
            </div>
            <span className="text-xs text-text-400">{d.environment.summary}</span>
          </div>
          <div className="grid gap-1.5 grid-cols-1 sm:grid-cols-2">
            {d.environment.vars.map((v) => (
              <div key={v.key} className="flex items-center gap-2 text-xs rounded border border-surface-100 px-2.5 py-1.5">
                <StatusIcon ok={v.ok} />
                <code className={`text-caption truncate font-mono ${v.ok ? 'text-text-500' : 'text-danger-500'}`}>{v.key}</code>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SectionStatus status={d.firebase.status} />
              <h2 className="text-sm font-semibold text-text-700">Firebase</h2>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <StatusIcon ok={d.firebase.auth} />
              <span className="text-text-500">Auth {d.firebase.auth ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusIcon ok={d.firebase.firestore} />
              <span className="text-text-500">Firestore {d.firebase.firestore ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SectionStatus status={d.authentication.status} />
              <h2 className="text-sm font-semibold text-text-700">Authentication</h2>
            </div>
          </div>
          <div className="space-y-1 text-xs text-text-500">
            <div className="flex items-center gap-2">
              <StatusIcon ok={d.authentication.loggedIn} />
              <span>{d.authentication.loggedIn ? 'Logged In' : d.authentication.loading ? 'Checking...' : 'Not authenticated'}</span>
            </div>
            {d.authentication.email ? <p className="pl-6">Email: {d.authentication.email}</p> : null}
            {d.authentication.uid ? <p className="pl-6">UID: {d.authentication.uid}...</p> : null}
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SectionStatus status={d.organization.status} />
              <h2 className="text-sm font-semibold text-text-700">Organization</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-500">
            <StatusIcon ok={d.organization.loaded} />
            <span>
              {d.organization.loaded
                ? `Active Org: ${d.organization.orgId}...`
                : 'No organization selected'}
            </span>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SectionStatus status={d.permissions.status} />
              <h2 className="text-sm font-semibold text-text-700">Permissions</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-500">
            <StatusIcon ok={d.permissions.hasRole} />
            <span>Role: <span className="font-medium text-text-700 capitalize">{d.permissions.role.replace(/_/g, ' ')}</span></span>
          </div>
        </Card>

        <div className="text-xs text-text-400 text-center pt-2">
          ReleaseFlow v{d.version} · Diagnostics · {new Date(d.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
