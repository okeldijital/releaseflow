'use client';

import { type ReleaseTypeVal } from './release-wizard-types';
import { StepTitle } from './wizard-ui';
import { ReleaseTypeStep } from './ReleaseTypeStep';
import { DetailsStep } from './DetailsStep';
import { ArtworkStep } from './ArtworkStep';
import { TracksStep } from './TracksStep';
import { ReleaseInfoStep } from './ReleaseInfoStep';
import { PromoStep } from './PromoStep';
import { EmailStep } from './EmailStep';
import { ReviewStep } from './ReviewStep';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useReleaseWizard } from './useReleaseWizard';
import { PersonPickerDialog } from '@/components/person-picker-dialog';
import { LoadingState, EmptyState, ConfirmationDialog } from '@releaseflow/ui';

export function ReleaseWizard({ mode = 'create', releaseId }: { mode?: 'create' | 'edit'; releaseId?: string }) {
  const wizard = useReleaseWizard({ mode, releaseId });
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const { user, activeOrgId, step, STEPS, currentStepKey, stepProps, handlers, labelOptions, assignerOpen, setAssignerOpen, assignerLabel, assignerRole, assignerTrackId, assignerField, assignerCallback, loadingEdit, editForbidden } = wizard;

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
      <button
        type="button"
        onClick={() => setCancelOpen(true)}
        className="flex items-center gap-1 text-sm text-text-400 hover:text-text-200 mb-8 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Cancel
      </button>

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
          updateTrack={handlers.updateTrack}
          removeTrack={handlers.removeTrack}
          addFeaturedArtist={handlers.addFeaturedArtist}
          removeFeaturedArtist={handlers.removeFeaturedArtist}
          onArtistCreated={stepProps.onArtistCreated}
          openAssigner={handlers.openAssigner}
          validateRemixTracks={handlers.validateRemixTracks}
          setSectionStatus={stepProps.setSectionStatus}
          currentStepKey={currentStepKey}
          people={stepProps.people}
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
          onLater={() => handlers.later('email')}
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
          else handlers.updateTrack(assignerTrackId, assignerField as string, result.personId);
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
    </div>
  );
}
