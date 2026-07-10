// TEMPORARY — BUILD-031G diagnostic trace. REMOVE after investigation.
import { getAuthInstance } from '@/lib/firebase';

const TAG = '[BUILD-031G]';

export interface TraceOpts {
  repo: string;
  op: string;
  organizationId: string;
  releaseId?: string;
  queryPath: string;
  constraints: string;
}

export function traceMediaBefore(o: TraceOpts): void {
  const auth = getAuthInstance();
  const projectId = auth?.app?.options?.projectId ?? null;
  const uid = auth?.currentUser?.uid ?? null;
  console.log(TAG, 'getDocs BEFORE', {
    repo: o.repo,
    operation: o.op,
    organizationId: o.organizationId,
    releaseId: o.releaseId ?? null,
    collectionPath: o.queryPath,
    queryConstraints: o.constraints,
    firebaseProjectId: projectId,
    currentUid: uid,
  });
}

export function traceMediaError(o: TraceOpts, e: unknown): void {
  const err = e as { code?: string; message?: string; stack?: string };
  console.error(TAG, 'getDocs ERROR', {
    repo: o.repo,
    operation: o.op,
    queryPath: o.queryPath,
    errorCode: err?.code ?? null,
    errorMessage: err?.message ?? null,
    stack: err?.stack ?? null,
  });
  console.error(e);
}
