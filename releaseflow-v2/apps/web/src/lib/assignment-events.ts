/**
 * ARS-003 — in-tab assignment change bus so workspaces reload without full page refresh.
 * Not a second data store — only signals consumers to re-fetch via Assignment Service.
 */

export type AssignmentChangeEvent = {
  organizationId: string;
  assignmentId?: string;
  reason: 'created' | 'updated' | 'deleted' | 'status' | 'unknown';
};

type Listener = (event: AssignmentChangeEvent) => void;

const listeners = new Set<Listener>();

export function onAssignmentsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitAssignmentsChanged(event: AssignmentChangeEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (err) {
      console.error('[assignments] change listener failed', err);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('rf:assignments-changed', { detail: event }));
    } catch {
      /* ignore */
    }
  }
}
