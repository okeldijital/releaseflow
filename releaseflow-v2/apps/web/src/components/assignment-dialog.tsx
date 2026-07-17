'use client';

/**
 * AW-001 / RW-001 — Assignment dialog wraps the shared AssignmentCreateForm.
 * Single creation implementation across the platform.
 */

import { AssignmentCreateForm } from '@/components/assignments/assignment-create-form';

interface AssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  organizationId: string;
  actorId: string;
  /** When opened from a release/track context */
  entityType?: 'release' | 'track' | 'media_asset' | 'artist' | 'label' | 'person';
  entityId?: string;
  /** Pre-selected release (defaults to entityId when entityType is release). */
  releaseId?: string;
  /** Lock release selection (default true when entityType is release). */
  lockRelease?: boolean;
}

export function AssignmentDialog({
  open,
  onClose,
  onCreated,
  organizationId,
  actorId,
  entityType: presetEntityType,
  entityId: presetEntityId,
  releaseId,
  lockRelease,
}: AssignmentDialogProps) {
  if (!open) return null;

  const presetReleaseId =
    releaseId
    ?? (presetEntityType === 'release' ? presetEntityId : undefined);
  const shouldLock =
    lockRelease ?? Boolean(presetEntityType === 'release' && presetEntityId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <button
        className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl border border-surface-700 bg-surface-900 p-5 sm:p-6 shadow-modal space-y-4">
        <h2 className="text-base font-semibold text-content-primary">Create Assignment</h2>
        <AssignmentCreateForm
          organizationId={organizationId}
          actorId={actorId}
          presetReleaseId={presetReleaseId}
          lockRelease={shouldLock}
          entityType={presetEntityType}
          entityId={presetEntityId}
          variant="dialog"
          onCancel={onClose}
          onCreated={() => {
            onCreated();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
