'use client';

import { useState } from 'react';
import { Button, ConfirmationDialog } from '@releaseflow/ui';
import { ImageUploader } from '@/components/common/image-upload/ImageUploader';

interface ProfileAvatarUploaderProps {
  currentImageUrl?: string | null;
  displayName: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function ProfileAvatarUploader({
  currentImageUrl,
  displayName,
  onUpload,
  onRemove,
}: ProfileAvatarUploaderProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  async function handleUpload(file: File) {
    await onUpload(file);
    setShowUploader(false);
  }

  async function handleRemove() {
    setShowRemoveConfirm(false);
    await onRemove();
  }

  if (showUploader) {
    return (
      <div>
        <p className="text-sm font-semibold text-text-700 mb-3">Profile Photo</p>
        <ImageUploader
          onUpload={handleUpload}
          onCancel={() => setShowUploader(false)}
          label="Upload photo"
          maxSizeMB={5}
          accept="image/jpeg,image/jpg,image/png,image/webp"
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-text-700 mb-3">Profile Photo</p>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden ring-1 ring-surface-0/10 bg-surface-950 shrink-0">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-700 text-xl font-semibold">
              {displayName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowUploader(true)}>
            {currentImageUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
          {currentImageUrl && (
            <Button size="sm" variant="outline" onClick={() => setShowRemoveConfirm(true)}>
              Remove Photo
            </Button>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemove}
        title="Remove Photo"
        message="Are you sure you want to remove your profile photo? Your initials will be displayed instead."
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
