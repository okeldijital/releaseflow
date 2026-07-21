'use client';

import { Button } from '@releaseflow/ui';
import { ReleaseArtwork, type UploadState } from '@/components/release/ReleaseArtwork';
import type { Artwork } from '@/lib/artwork/artwork-types';
import type { PersonOption } from './release-wizard-types';
import { PersonSelect, InviteForm, Btn } from './wizard-ui';

export function ArtworkStep({
  hasArtwork,
  setHasArtwork,
  commissionArtwork,
  setCommissionArtwork,
  artworkDesigner,
  setArtworkDesigner,
  people,
  inviteName,
  setInviteName,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  showInviteForm,
  setShowInviteForm,
  handleInvite,
  releaseTitle,
  artwork,
  artworkUploadState,
  artworkFileName,
  onArtworkUpload,
  onArtworkUploadStateChange,
  onArtworkRemove,
  artworkRemoving,
  back,
  next,
}: {
  hasArtwork: boolean | null;
  setHasArtwork: (v: boolean | null) => void;
  commissionArtwork: boolean | null;
  setCommissionArtwork: (v: boolean) => void;
  artworkDesigner: string;
  setArtworkDesigner: (v: string) => void;
  people: PersonOption[];
  inviteName: string;
  setInviteName: (v: string) => void;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: string;
  setInviteRole: (v: string) => void;
  showInviteForm: boolean;
  setShowInviteForm: (v: boolean) => void;
  handleInvite: () => void;
  releaseTitle: string;
  artwork: Artwork | null;
  artworkUploadState: UploadState;
  artworkFileName: string | null;
  onArtworkUpload: (file: File) => void;
  onArtworkUploadStateChange: (state: UploadState) => void;
  onArtworkRemove: () => void;
  artworkRemoving: boolean;
  back: () => void;
  next: () => void;
}) {
  const showUploadPanel = hasArtwork === true;
  const isUploading = artworkUploadState === 'uploading' || artworkUploadState === 'selecting';
  const canContinueWithArtwork = !!artwork && !isUploading && !artworkRemoving;

  return (
    <>
      {!showUploadPanel && (
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => setHasArtwork(true)}
            className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]"
          >
            Yes, I have artwork
          </button>
          <button
            type="button"
            onClick={() => setHasArtwork(false)}
            className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]"
          >
            No, not yet
          </button>
        </div>
      )}

      {hasArtwork === false && (
        <div className="mt-6">
          <p className="text-sm text-text-400 text-center mb-4">Would you like to commission artwork?</p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setCommissionArtwork(true)}
              className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]"
            >
              Yes, find a designer
            </button>
            <button
              type="button"
              onClick={() => {
                setCommissionArtwork(false);
                next();
              }}
              className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]"
            >
              I&apos;ll upload later
            </button>
          </div>
          {commissionArtwork && (
            <div className="mt-6">
              <PersonSelect
                value={artworkDesigner}
                onChange={setArtworkDesigner}
                people={people}
                onInvite={() => setShowInviteForm(true)}
              />
              {showInviteForm && (
                <div className="mt-4">
                  <InviteForm
                    name={inviteName}
                    setName={setInviteName}
                    email={inviteEmail}
                    setEmail={setInviteEmail}
                    role={inviteRole}
                    setRole={setInviteRole}
                    onSend={handleInvite}
                    onCancel={() => setShowInviteForm(false)}
                  />
                </div>
              )}
              <div className="flex items-center gap-3 mt-6">
                <Btn label="Back" onClick={back} secondary />
                <Btn onClick={next} />
              </div>
            </div>
          )}
        </div>
      )}

      {showUploadPanel && (
        <div className="mt-8 space-y-4">
          <p className="text-sm font-semibold text-surface-100">Artwork</p>
          <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
            <ReleaseArtwork
              artwork={artwork}
              releaseTitle={releaseTitle || 'Release'}
              uploadState={artworkUploadState}
              onUpload={onArtworkUpload}
              onUploadStateChange={onArtworkUploadStateChange}
              className="max-w-xs mx-auto"
            />
            {artwork && (
              <div className="mt-3 text-center space-y-1">
                {artworkFileName ? (
                  <p className="text-xs text-text-500 truncate">{artworkFileName}</p>
                ) : artwork.format ? (
                  <p className="text-xs text-text-500 uppercase">{artwork.format}</p>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs mt-2 max-w-xs mx-auto"
                  onClick={onArtworkRemove}
                  disabled={artworkRemoving || isUploading}
                >
                  {artworkRemoving ? 'Removing…' : 'Remove Artwork'}
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-8">
            <Btn
              label="Back"
              onClick={() => setHasArtwork(null)}
              secondary
              disabled={isUploading || artworkRemoving}
            />
            <Btn onClick={next} disabled={!canContinueWithArtwork} />
          </div>
        </div>
      )}
    </>
  );
}
