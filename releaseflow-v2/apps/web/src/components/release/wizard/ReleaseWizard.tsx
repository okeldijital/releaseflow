'use client';

import { type ReleaseTypeVal } from './release-wizard-types';
import { StepTitle, SaveDraftButton } from './wizard-ui';
import { ReleaseTypeStep } from './ReleaseTypeStep';
import { DetailsStep } from './DetailsStep';
import { ArtworkStep } from './ArtworkStep';
import { TracksStep } from './TracksStep';
import { LinerNotesStep } from './LinerNotesStep';
import { ReleaseInfoStep } from './ReleaseInfoStep';
import { PromoStep } from './PromoStep';
import { EmailStep } from './EmailStep';
import { ReviewStep } from './ReviewStep';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useReleaseWizard } from './useReleaseWizard';
import { PersonPickerDialog } from '@/components/person-picker-dialog';
import { LoadingState, EmptyState, ConfirmationDialog } from '@releaseflow/ui';
import { useUnsavedChanges } from '@/hooks/use-keyboard-shortcuts';

export function ReleaseWizard({ mode = 'create', releaseId, draftId }: { mode?: 'create' | 'edit'; releaseId?: string; draftId?: string }) {
  const wizard = useReleaseWizard({ mode, releaseId, draftId });
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [showSaveOnCancel, setShowSaveOnCancel] = useState(false);
  const [showNavWarning, setShowNavWarning] = useState(false);
  const { user, activeOrgId, step, STEPS, currentStepKey, stepProps, handlers, labelOptions, assignerOpen, setAssignerOpen, assignerLabel, assignerRole, assignerTrackId, assignerField, assignerCallback, loadingEdit, editForbidden, hasUnsavedChanges, savingDraft, saveState, lastSavedAt } = wizard;

  useUnsavedChanges(hasUnsavedChanges);

  // Navigation protection for browser back/forward
  useEffect(() => {
    if (mode !== 'create' || !hasUnsavedChanges) return;
    const handler = (e: PopStateEvent) => {
      e.preventDefault();
      setShowNavWarning(true);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [hasUnsavedChanges, mode]);

  if (!user) return null;

  if (mode === 'edit' && loadingEdit) {
    return (
      <div className="mx-auto max-w-lg px-5 sm:px-7 py-12 page-transition">
        <div className="flex items-center justify-center py-20"><LoadingState /></div>
      </div>
    );
  }

  if (mode === 'edit' && editForbidden) {
    return (
      <div className="mx-auto max-w-lg px-5 sm:px-7 py-12 page-transition">
        <EmptyState
          title="Access Denied"
          description="You do not have permission to edit this release."
          action={{ label: 'Go to Dashboard', onClick: () => window.location.href = '/dashboard' }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 sm:px-7 py-12 page-transition">
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={() => {
            if (hasUnsavedChanges) {
              setShowSaveOnCancel(true);
            } else {
              setCancelOpen(true);
            }
          }}
          className="flex items-center gap-1 text-sm text-text-400 hover:text-text-200 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cancel
        </button>
        <SaveDraftButton onClick={handlers.saveDraft} loading={savingDraft} state={saveState} lastSavedAt={lastSavedAt} />
      </div>

      <div className="flex items-center justify-center gap-2 mb-10">
        {STEPS.map((_, i) => (
          <span key={i} className={`block rounded-full transition-all duration-300 ${i < step ? 'h-2 w-2 bg-primary-500/40' : i === step ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_6px_rgba(204,85,0,0.4)]' : 'h-1.5 w-1.5 bg-surface-700'}`} />
        ))}
      </div>

      <StepTitle step={currentStepKey ?? 'type'} />

      {currentStepKey === 'type' && <ReleaseTypeStep releaseType={stepProps.releaseType} setReleaseType={stepProps.setReleaseType as (v: ReleaseTypeVal) => void} next={handlers.next} />}
      {currentStepKey === 'details' && (
        <DetailsStep
          releaseTitle={stepProps.releaseTitle}
          setReleaseTitle={stepProps.setReleaseTitle}
          releaseNotes={stepProps.releaseNotes}
          setReleaseNotes={stepProps.setReleaseNotes}
          targetReleaseDate={stepProps.targetReleaseDate}
          setTargetReleaseDate={stepProps.setTargetReleaseDate}
          estimatedReleaseDate={stepProps.estimatedReleaseDate}
          setEstimatedReleaseDate={stepProps.setEstimatedReleaseDate}
          back={handlers.back}
          next={handlers.next}
        />
      )}
      {currentStepKey === 'artwork' && (
        <ArtworkStep
          hasArtwork={stepProps.hasArtwork}
          setHasArtwork={stepProps.setHasArtwork}
          commissionArtwork={stepProps.commissionArtwork}
          setCommissionArtwork={stepProps.setCommissionArtwork}
          artworkDesigner={stepProps.artworkDesigner}
          setArtworkDesigner={stepProps.setArtworkDesigner}
          people={stepProps.people}
          inviteName={stepProps.inviteName}
          setInviteName={stepProps.setInviteName}
          inviteEmail={stepProps.inviteEmail}
          setInviteEmail={stepProps.setInviteEmail}
          inviteRole={stepProps.inviteRole}
          setInviteRole={stepProps.setInviteRole}
          showInviteForm={stepProps.showInviteForm}
          setShowInviteForm={stepProps.setShowInviteForm}
          handleInvite={stepProps.handleInvite}
          releaseTitle={stepProps.releaseTitle}
          artwork={stepProps.wizardArtwork}
          artworkUploadState={stepProps.artworkUploadState}
          artworkFileName={stepProps.artworkFileName}
          onArtworkUpload={stepProps.handleArtworkUpload}
          onArtworkUploadStateChange={stepProps.setArtworkUploadState}
          onArtworkRemove={stepProps.handleArtworkRemove}
          artworkRemoving={stepProps.artworkRemoving}
          back={handlers.back}
          next={handlers.next}
        />
      )}
      {currentStepKey === 'tracks' && (
        <TracksStep
          tracks={stepProps.tracks}
          artists={stepProps.artists}
          activeOrgId={stepProps.activeOrgId}
          addTrack={handlers.addTrack}
          updateTrackFields={handlers.updateTrackFields}
          removeTrack={handlers.removeTrack}
          onArtistCreated={stepProps.onArtistCreated}
          openAssigner={handlers.openAssigner}
          validateRemixTracks={handlers.validateRemixTracks}
          people={stepProps.people}
          back={handlers.back}
          next={handlers.next}
        />
      )}
      {currentStepKey === 'liner_notes' && (
        <LinerNotesStep
          linerNotes={stepProps.linerNotes}
          setLinerNotes={stepProps.setLinerNotes}
          back={handlers.back}
          next={handlers.next}
        />
      )}
      {currentStepKey === 'release_info' && (
        <ReleaseInfoStep
          primaryArtist={stepProps.primaryArtist}
          setPrimaryArtist={stepProps.setPrimaryArtist}
          featuredArtists={stepProps.featuredArtists}
          setFeaturedArtists={stepProps.setFeaturedArtists}
          releaseLink={stepProps.releaseLink}
          setReleaseLink={stepProps.setReleaseLink}
          recordLabel={stepProps.recordLabel}
          setRecordLabel={stepProps.setRecordLabel}
          catalogueNumber={stepProps.catalogueNumber}
          setCatalogueNumber={stepProps.setCatalogueNumber}
          upc={stepProps.upc}
          setUpc={stepProps.setUpc}
          primaryGenre={stepProps.primaryGenre}
          setPrimaryGenre={stepProps.setPrimaryGenre}
          secondaryGenre={stepProps.secondaryGenre}
          setSecondaryGenre={stepProps.setSecondaryGenre}
          language={stepProps.language}
          setLanguage={stepProps.setLanguage}
          copyrightOwner={stepProps.copyrightOwner}
          setCopyrightOwner={stepProps.setCopyrightOwner}
          copyrightYear={stepProps.copyrightYear}
          setCopyrightYear={stepProps.setCopyrightYear}
          releaseOwner={stepProps.releaseOwner}
          setReleaseOwner={stepProps.setReleaseOwner}
          labelOptions={labelOptions}
          activeOrgId={activeOrgId}
          orgName={stepProps.orgName}
          onLabelCreated={handlers.onLabelCreated}
          userId={user.uid}
          back={handlers.back}
          next={handlers.next}
        />
      )}
      {currentStepKey === 'promotion' && (
        <PromoStep
          promoAssets={stepProps.promoAssets}
          setPromoAssets={stepProps.setPromoAssets}
          assetDesigners={stepProps.assetDesigners}
          setAssetDesigners={stepProps.setAssetDesigners}
          people={stepProps.people}
          socialRows={stepProps.socialRows}
          setSocialRows={stepProps.setSocialRows}
          addSocialRow={handlers.addSocialRow}
          removeSocialRow={handlers.removeSocialRow}
          inviteName={stepProps.inviteName}
          setInviteName={stepProps.setInviteName}
          inviteEmail={stepProps.inviteEmail}
          setInviteEmail={stepProps.setInviteEmail}
          inviteRole={stepProps.inviteRole}
          setInviteRole={stepProps.setInviteRole}
          showInviteForm={stepProps.showInviteForm}
          setShowInviteForm={stepProps.setShowInviteForm}
          inviteTarget={stepProps.inviteTarget}
          setInviteTarget={stepProps.setInviteTarget}
          handleInvite={stepProps.handleInvite}
          back={handlers.back}
          next={handlers.next}
        />
      )}
      {currentStepKey === 'email' && (
        <EmailStep
          hasEmail={stepProps.hasEmail}
          setHasEmail={stepProps.setHasEmail}
          emailSubject={stepProps.emailSubject}
          setEmailSubject={stepProps.setEmailSubject}
          emailPreviewText={stepProps.emailPreviewText}
          setEmailPreviewText={stepProps.setEmailPreviewText}
          emailBody={stepProps.emailBody}
          setEmailBody={stepProps.setEmailBody}
          emailCampaignManager={stepProps.emailCampaignManager}
          setEmailCampaignManager={stepProps.setEmailCampaignManager}
          emailSendDate={stepProps.emailSendDate}
          setEmailSendDate={stepProps.setEmailSendDate}
          emailSendTime={stepProps.emailSendTime}
          setEmailSendTime={stepProps.setEmailSendTime}
          emailTimezone={stepProps.emailTimezone}
          setEmailTimezone={stepProps.setEmailTimezone}
          openAssigner={handlers.openAssigner}
          back={handlers.back}
          next={handlers.next}
        />
      )}
      {currentStepKey === 'review' && (
        <ReviewStep
          releaseTitle={stepProps.releaseTitle}
          releaseType={stepProps.releaseType}
          tracks={stepProps.tracks}
          hasArtwork={stepProps.hasArtwork}
          commissionArtwork={stepProps.commissionArtwork}
          promoAssets={stepProps.promoAssets}
          hasEmail={stepProps.hasEmail}
          primaryArtist={stepProps.primaryArtist}
          primaryGenre={stepProps.primaryGenre}
          language={stepProps.language}
          targetReleaseDate={stepProps.targetReleaseDate}
          estimatedReleaseDate={stepProps.estimatedReleaseDate}
          sectionStatus={stepProps.sectionStatus}
          error={stepProps.error}
          launching={stepProps.launching}
          back={handlers.back}
          launch={handlers.handleLaunch}
        />
      )}

      <PersonPickerDialog
        open={assignerOpen}
        onClose={() => setAssignerOpen(false)}
        onSelectPerson={(result) => {
          if (assignerCallback.current) { assignerCallback.current({ personId: result.personId }); assignerCallback.current = null; }
          else if (assignerTrackId && assignerField) {
            handlers.updateTrackFields(assignerTrackId, { [assignerField]: result.personId });
          }
          setAssignerOpen(false);
        }}
        contextLabel={assignerLabel}
        contextRole={assignerRole}
        organizationId={activeOrgId}
        currentUserId={user?.uid ?? ''}
      />

      <ConfirmationDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => router.push('/releases')}
        title="Discard Release?"
        message="Your progress has not been saved. Are you sure you want to cancel creating this release?"
        confirmLabel="Discard Release"
        cancelLabel="Continue Editing"
        variant="danger"
      />

      {showSaveOnCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowSaveOnCancel(false)} />
          <div className="relative z-10 w-full max-w-md bg-layer-2 rounded-lg shadow-modal border border-surface-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-content-primary">You have unsaved changes</h2>
            <p className="text-sm text-content-secondary">Do you want to save your progress before leaving?</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveOnCancel(false)}
                className="h-10 px-4 text-sm font-medium text-content-secondary rounded-md border border-surface-200 bg-layer-2 hover:bg-surface-50 transition-colors"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={() => { setShowSaveOnCancel(false); router.push('/releases'); }}
                className="h-10 px-4 text-sm font-medium text-danger-600 rounded-md border border-danger-200 bg-danger-50 hover:bg-danger-100 transition-colors"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSaveOnCancel(false);
                  handlers.saveDraft();
                }}
                className="h-10 px-4 text-sm font-medium text-primary-400 rounded-md border border-primary-200 bg-primary-500/10 hover:bg-primary-500/20 transition-colors"
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {showNavWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowNavWarning(false)} />
          <div className="relative z-10 w-full max-w-md bg-layer-2 rounded-lg shadow-modal border border-surface-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-content-primary">You have unsaved changes</h2>
            <p className="text-sm text-content-secondary">Do you want to save your progress before leaving?</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNavWarning(false)}
                className="h-10 px-4 text-sm font-medium text-content-secondary rounded-md border border-surface-200 bg-layer-2 hover:bg-surface-50 transition-colors"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={() => { setShowNavWarning(false); router.back(); }}
                className="h-10 px-4 text-sm font-medium text-danger-600 rounded-md border border-danger-200 bg-danger-50 hover:bg-danger-100 transition-colors"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={() => { setShowNavWarning(false); handlers.saveDraft(); }}
                className="h-10 px-4 text-sm font-medium text-primary-400 rounded-md border border-primary-200 bg-primary-500/10 hover:bg-primary-500/20 transition-colors"
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {wizard.conflictData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={handlers.handleConflictDiscard} />
          <div className="relative z-10 w-full max-w-md bg-layer-2 rounded-lg shadow-modal border border-surface-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-content-primary">Conflict detected</h2>
            <p className="text-sm text-content-secondary">This draft was updated elsewhere. Do you want to overwrite the server version with your local changes?</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handlers.handleConflictDiscard}
                className="h-10 px-4 text-sm font-medium text-content-secondary rounded-md border border-surface-200 bg-layer-2 hover:bg-surface-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlers.handleConflictReload}
                className="h-10 px-4 text-sm font-medium text-primary-400 rounded-md border border-primary-200 bg-primary-500/10 hover:bg-primary-500/20 transition-colors"
              >
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
