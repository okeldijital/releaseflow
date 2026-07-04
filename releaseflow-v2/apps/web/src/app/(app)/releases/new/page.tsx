'use client';

import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { getPeopleByOrg } from '@/lib/people-repository';
import { createReleaseWithFullWorkflow } from '@/lib/release-service';
import { createNewTrack } from '@/lib/track-service';
import { getStageTemplatesForReleaseType } from '@/lib/workflow-templates';
import { getRequirementNamesForReleaseType } from '@/lib/requirement-templates';
import { PersonAssigner } from '@/components/person-assigner';
import { ArtistFieldPicker, FeaturedArtistsPicker, type ArtistOption } from '@/components/artist-field-picker';
import { useArtists } from '@/hooks/useArtist';
import {
  countRecordingTypes,
  releaseTypeLabel,
  suggestRemixDisplayTitle,
  type RecordingType,
} from '@/lib/recording-type';

const RELEASE_TYPES = [
  { value: 'single', label: 'Single', description: 'One track release' },
  { value: 'ep', label: 'EP', description: '3–6 tracks' },
  { value: 'album', label: 'Album', description: '7+ tracks' },
] as const;

const PROMO_ASSETS = [
  { key: 'cover_artwork', label: 'Cover Artwork' },
  { key: 'story', label: 'Story' },
  { key: 'reel', label: 'Reel' },
  { key: 'teaser', label: 'Teaser' },
  { key: 'banner', label: 'Banner' },
  { key: 'press_kit', label: 'Press Kit' },
];

const SOCIAL_PLATFORMS = ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Website'] as const;

type ReleaseTypeVal = typeof RELEASE_TYPES[number]['value'];

type WizardTrack = {
  id: string;
  title: string;
  version: string;
  recordingType: RecordingType;
  primaryArtistId: string;
  featuredArtistIds: string[];
  originalArtistId: string;
  remixerArtistId: string;
  displayTitle: string;
  displayTitleEdited: boolean;
  mixed: boolean;
  mastered: boolean;
  mixingEngineer: string;
  masteringEngineer: string;
  isrc: string;
  composer: string;
  lyricist: string;
  iswc: string;
  pubOpen: boolean;
  remixErrors: { originalArtist?: string; remixer?: string };
};

function createEmptyTrack(id = String(Date.now())): WizardTrack {
  return {
    id,
    title: '',
    version: '',
    recordingType: 'original',
    primaryArtistId: '',
    featuredArtistIds: [],
    originalArtistId: '',
    remixerArtistId: '',
    displayTitle: '',
    displayTitleEdited: false,
    mixed: true,
    mastered: true,
    mixingEngineer: '',
    masteringEngineer: '',
    isrc: '',
    composer: '',
    lyricist: '',
    iswc: '',
    pubOpen: false,
    remixErrors: {},
  };
}

type PersonOption = { id: string; displayName: string };
type SocialRow = { id: string; platform: string; url: string; personId: string };
type SectionStatusMap = Record<string, 'complete' | 'incomplete' | 'skipped'>;
type AssignerField = 'mixingEngineer' | 'masteringEngineer' | 'emailManager';
type InviteTarget = { type: string; key?: string } | null;

export default function NewReleasePage() {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const { artistOptions: artists, onArtistCreated } = useArtists();
  console.log('[ReleaseWizard] artists received by picker:', artists.length);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const [people, setPeople] = useState<PersonOption[]>([]);

  const [releaseType, setReleaseType] = useState<ReleaseTypeVal>('single');
  const [releaseTitle, setReleaseTitle] = useState('');
  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');

  const [hasArtwork, setHasArtwork] = useState<boolean | null>(null);
  const [commissionArtwork, setCommissionArtwork] = useState<boolean | null>(null);
  const [artworkDesigner, setArtworkDesigner] = useState('');

  const [tracks, setTracks] = useState<WizardTrack[]>([createEmptyTrack('1')]);

  const [promoAssets, setPromoAssets] = useState<string[]>([]);
  const [assetDesigners, setAssetDesigners] = useState<Record<string, string>>({});
  const [socialRows, setSocialRows] = useState<SocialRow[]>([]);

  const [hasEmail, setHasEmail] = useState<boolean | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailPreviewText, setEmailPreviewText] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailCampaignManager, setEmailCampaignManager] = useState('');
  const [emailSendDate, setEmailSendDate] = useState('');
  const [emailSendTime, setEmailSendTime] = useState('');
  const [emailTimezone, setEmailTimezone] = useState('');

  // Release Info
  const [primaryArtist, setPrimaryArtist] = useState('');
  const [featuredArtists, setFeaturedArtists] = useState<string[]>([]);
  const [recordLabel, setRecordLabel] = useState('');
  const [catalogueNumber, setCatalogueNumber] = useState('');
  const [upc, setUpc] = useState('');
  const [primaryGenre, setPrimaryGenre] = useState('');
  const [secondaryGenre, setSecondaryGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [copyrightOwner, setCopyrightOwner] = useState('');
  const [copyrightYear, setCopyrightYear] = useState(String(new Date().getFullYear()));
  const [releaseOwner, setReleaseOwner] = useState('');

  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<InviteTarget>(null);

  const [assignerOpen, setAssignerOpen] = useState(false);
  const [assignerLabel, setAssignerLabel] = useState('');
  const [assignerRole, setAssignerRole] = useState('');
  const [assignerTrackId, setAssignerTrackId] = useState('');
  const [assignerField, setAssignerField] = useState<AssignerField>('mixingEngineer');
  const assignerCallback = useRef<((r: { personId?: string }) => void) | null>(null);

  function openAssigner(label: string, role: string, trackId: string, field: AssignerField, cb?: (r: { personId?: string }) => void) {
    setAssignerLabel(label); setAssignerRole(role); setAssignerTrackId(trackId); setAssignerField(field);
    assignerCallback.current = cb || null;
    setAssignerOpen(true);
  }

  const [sectionStatus, setSectionStatus] = useState<SectionStatusMap>({});
  void (setSectionStatus as unknown);


  useEffect(() => {
    if (!user) { router.push('/sign-in'); return; }
    if (activeOrgId) {
      getPeopleByOrg(activeOrgId).then((p) => setPeople(p.map((x) => ({ id: x.id, displayName: x.displayName }))));
    }
  }, [user, router, activeOrgId]);

  if (!user) return null;

  const STEPS = ['type', 'details', 'artwork', 'tracks', 'release_info', 'promotion', 'email', 'review'];
  const totalSteps = STEPS.length;
  const currentStepKey = STEPS[step];

  function next() { if (step < totalSteps - 1) setStep(step + 1); }
  function back() { if (step > 0) setStep(step - 1); }
  function later(section: string) { setSectionStatus((p) => ({ ...p, [section]: 'skipped' })); }

  function addTrack() { setTracks((p) => [...p, createEmptyTrack()]); }

  function updateTrack(id: string, f: string, v: string | boolean | string[]) {
    setTracks((p) => p.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, [f]: v, remixErrors: { ...t.remixErrors } };
      if (f === 'recordingType' && v === 'original') {
        next.remixErrors = {};
        next.displayTitle = '';
        next.displayTitleEdited = false;
      }
      if ((f === 'title' || f === 'remixerArtistId') && next.recordingType === 'remix' && !next.displayTitleEdited) {
        const remixerName = artists.find((a) => a.id === next.remixerArtistId)?.name ?? '';
        next.displayTitle = suggestRemixDisplayTitle(
          f === 'title' ? String(v) : next.title,
          f === 'remixerArtistId' ? (artists.find((a) => a.id === v)?.name ?? '') : remixerName,
        );
      }
      if (f === 'displayTitle') {
        next.displayTitle = String(v);
        next.displayTitleEdited = true;
        return next;
      }
      if (f === 'originalArtistId' || f === 'remixerArtistId') {
        delete next.remixErrors[f === 'originalArtistId' ? 'originalArtist' : 'remixer'];
      }
      return next;
    }));
  }

  function removeTrack(id: string) { if (tracks.length > 1) setTracks((p) => p.filter((t) => t.id !== id)); }

  function addFeaturedArtist(trackId: string, artistId: string) {
    if (!artistId) return;
    setTracks((p) => p.map((t) => (
      t.id === trackId && !t.featuredArtistIds.includes(artistId)
        ? { ...t, featuredArtistIds: [...t.featuredArtistIds, artistId] }
        : t
    )));
  }

  function removeFeaturedArtist(trackId: string, artistId: string) {
    setTracks((p) => p.map((t) => (
      t.id === trackId
        ? { ...t, featuredArtistIds: t.featuredArtistIds.filter((id) => id !== artistId) }
        : t
    )));
  }

  function validateRemixTracks(): boolean {
    let valid = true;
    setTracks((p) => p.map((t) => {
      if (!t.title.trim() || t.recordingType !== 'remix') return t;
      const remixErrors: WizardTrack['remixErrors'] = {};
      if (!t.originalArtistId) {
        remixErrors.originalArtist = 'Original Artist is required for remix recordings.';
        valid = false;
      }
      if (!t.remixerArtistId) {
        remixErrors.remixer = 'Remixer is required for remix recordings.';
        valid = false;
      }
      return { ...t, remixErrors };
    }));
    return valid;
  }

  function addSocialRow() { setSocialRows((p) => [...p, { id: String(Date.now()), platform: '', url: '', personId: '' }]); }
  function removeSocialRow(id: string) { setSocialRows((p) => p.filter((r) => r.id !== id)); }

  async function handleInvite() {
    if (!activeOrgId || !inviteName.trim() || !inviteEmail.trim()) return;
    const { createInvitation } = await import('@/lib/invitation-repository');
    await createInvitation({ organizationId: activeOrgId, inviterId: user!.uid, email: inviteEmail.trim(), roleId: inviteRole || 'contributor' });
    if (inviteTarget?.key) setAssetDesigners((p) => ({ ...p, [inviteTarget!.key!]: inviteEmail }));
    setShowInviteForm(false); setInviteName(''); setInviteEmail(''); setInviteRole(''); setInviteTarget(null);
  }

  async function handleLaunch() {
    if (!user || !activeOrgId || !releaseTitle.trim()) return;
    if (!validateRemixTracks()) return;
    setLaunching(true); setError('');
    try {
      const rt = releaseType as 'single' | 'ep' | 'album';
      const { releaseId } = await createReleaseWithFullWorkflow(
        { title: releaseTitle, releaseType: rt, status: 'planning', organizationId: activeOrgId, createdBy: user.uid, targetReleaseDate: null },
        getStageTemplatesForReleaseType(rt), getRequirementNamesForReleaseType(rt), user.uid,
      );
      const validTracks = tracks.filter((t) => t.title.trim());
      if (validTracks.length > 0) {
        const { addArtistToTrack } = await import('@/lib/track-artist-repository');
        for (let i = 0; i < validTracks.length; i++) {
          const t = validTracks[i]!;
          const trackTitle = t.recordingType === 'remix' && t.displayTitle.trim()
            ? t.displayTitle.trim()
            : t.title.trim();
          const trackId = await createNewTrack({
            releaseId,
            position: i + 1,
            title: trackTitle,
            organizationId: activeOrgId,
            createdBy: user.uid,
            version: t.version.trim() || undefined,
            recordingType: t.recordingType,
            originalArtistId: t.recordingType === 'remix' ? t.originalArtistId : null,
            remixerArtistId: t.recordingType === 'remix' ? t.remixerArtistId : null,
            primaryArtistId: t.recordingType === 'original' ? t.primaryArtistId || null : null,
            featuredArtistIds: t.recordingType === 'original' ? t.featuredArtistIds : null,
            displayTitle: t.displayTitle.trim() || null,
            displayTitleEdited: t.displayTitleEdited,
          });
          if (t.recordingType === 'remix') {
            if (t.originalArtistId) await addArtistToTrack({ trackId, artistId: t.originalArtistId, artistType: 'original_artist' });
            if (t.remixerArtistId) await addArtistToTrack({ trackId, artistId: t.remixerArtistId, artistType: 'remixer' });
          } else {
            if (t.primaryArtistId) await addArtistToTrack({ trackId, artistId: t.primaryArtistId, artistType: 'original_artist' });
            for (const featuredId of t.featuredArtistIds) {
              await addArtistToTrack({ trackId, artistId: featuredId, artistType: 'featured_artist' });
            }
          }
        }
      }
      router.push(`/releases/${releaseId}`);
    } catch { setError('Could not create release.'); setLaunching(false); }
  }

  return (
    <div className="mx-auto max-w-lg px-5 sm:px-7 py-12 page-transition">
      <div className="flex items-center justify-center gap-2 mb-10">
        {STEPS.map((_, i) => (
          <span key={i} className={`block rounded-full transition-all duration-300 ${i < step ? 'h-2 w-2 bg-primary-500/40' : i === step ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_6px_rgba(204,85,0,0.4)]' : 'h-1.5 w-1.5 bg-surface-700'}`} />
        ))}
      </div>

      <StepTitle step={currentStepKey ?? 'type'} />

      {currentStepKey === 'type' && <ReleaseTypeStep releaseType={releaseType} setReleaseType={setReleaseType} next={next} />}
      {currentStepKey === 'details' && <DetailsStep releaseTitle={releaseTitle} setReleaseTitle={setReleaseTitle} version={version} setVersion={setVersion} releaseNotes={releaseNotes} setReleaseNotes={setReleaseNotes} back={back} next={next} />}
      {currentStepKey === 'artwork' && <ArtworkStep hasArtwork={hasArtwork} setHasArtwork={setHasArtwork} commissionArtwork={commissionArtwork} setCommissionArtwork={setCommissionArtwork} artworkDesigner={artworkDesigner} setArtworkDesigner={setArtworkDesigner} people={people} inviteName={inviteName} setInviteName={setInviteName} inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} inviteRole={inviteRole} setInviteRole={setInviteRole} showInviteForm={showInviteForm} setShowInviteForm={setShowInviteForm} handleInvite={handleInvite} back={back} next={next} />}
      {currentStepKey === 'tracks' && (
        <TracksStep
          tracks={tracks}
          artists={artists}
          activeOrgId={activeOrgId}
          addTrack={addTrack}
          updateTrack={updateTrack}
          removeTrack={removeTrack}
          addFeaturedArtist={addFeaturedArtist}
          removeFeaturedArtist={removeFeaturedArtist}
          onArtistCreated={onArtistCreated}
          openAssigner={openAssigner}
          validateRemixTracks={validateRemixTracks}
          setSectionStatus={setSectionStatus}
          currentStepKey={currentStepKey}
          people={people}
          back={back}
          next={next}
        />
      )}
      {currentStepKey === 'release_info' && <ReleaseInfoStep primaryArtist={primaryArtist} setPrimaryArtist={setPrimaryArtist} featuredArtists={featuredArtists} setFeaturedArtists={setFeaturedArtists} recordLabel={recordLabel} setRecordLabel={setRecordLabel} catalogueNumber={catalogueNumber} setCatalogueNumber={setCatalogueNumber} upc={upc} setUpc={setUpc} primaryGenre={primaryGenre} setPrimaryGenre={setPrimaryGenre} secondaryGenre={secondaryGenre} setSecondaryGenre={setSecondaryGenre} language={language} setLanguage={setLanguage} copyrightOwner={copyrightOwner} setCopyrightOwner={setCopyrightOwner} copyrightYear={copyrightYear} setCopyrightYear={setCopyrightYear} releaseOwner={releaseOwner} setReleaseOwner={setReleaseOwner} back={back} next={next} />}
      {currentStepKey === 'promotion' && <PromoStep promoAssets={promoAssets} setPromoAssets={setPromoAssets} assetDesigners={assetDesigners} setAssetDesigners={setAssetDesigners} people={people} socialRows={socialRows} setSocialRows={setSocialRows} addSocialRow={addSocialRow} removeSocialRow={removeSocialRow} inviteName={inviteName} setInviteName={setInviteName} inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} inviteRole={inviteRole} setInviteRole={setInviteRole} showInviteForm={showInviteForm} setShowInviteForm={setShowInviteForm} handleInvite={handleInvite} setInviteTarget={setInviteTarget} back={back} next={next} />}
      {currentStepKey === 'email' && <EmailStep hasEmail={hasEmail} setHasEmail={setHasEmail} emailSubject={emailSubject} setEmailSubject={setEmailSubject} emailPreviewText={emailPreviewText} setEmailPreviewText={setEmailPreviewText} emailBody={emailBody} setEmailBody={setEmailBody} emailCampaignManager={emailCampaignManager} setEmailCampaignManager={setEmailCampaignManager} emailSendDate={emailSendDate} setEmailSendDate={setEmailSendDate} emailSendTime={emailSendTime} setEmailSendTime={setEmailSendTime} emailTimezone={emailTimezone} setEmailTimezone={setEmailTimezone} openAssigner={openAssigner} back={back} next={next} onLater={() => later('email')} />}
      {currentStepKey === 'review' && <ReviewStep releaseTitle={releaseTitle} releaseType={releaseType} tracks={tracks} hasArtwork={hasArtwork} commissionArtwork={commissionArtwork} promoAssets={promoAssets} hasEmail={hasEmail} primaryArtist={primaryArtist} primaryGenre={primaryGenre} language={language} sectionStatus={sectionStatus} error={error} launching={launching} back={back} launch={handleLaunch} />}
      <PersonAssigner
        open={assignerOpen}
        onClose={() => setAssignerOpen(false)}
        onAssign={(r: { personId?: string; personName?: string }) => {
          if (assignerCallback.current) { assignerCallback.current({ personId: r.personId }); assignerCallback.current = null; }
          else updateTrack(assignerTrackId, assignerField as string, r.personId ?? '');
          setAssignerOpen(false);
        }}
        contextLabel={assignerLabel}
        contextRole={assignerRole}
        organizationId={activeOrgId}
        currentUserId={user?.uid ?? ''}
      />
    </div>
  );
}

function StepTitle({ step }: { step: string }) {
  const titles: Record<string, string> = {
    type: 'What are you releasing?', details: 'What is your release called?', remix: 'Tell us about this remix',
    artwork: 'Do you already have artwork?', tracks: "Let's add your tracks",
    release_info: 'Release Information', promotion: 'How will you promote this release?',
    email: 'Will you send an email announcement?', review: 'Ready to launch?',
  };
  return <h1 className="text-[1.75rem] font-semibold tracking-tight text-surface-50 text-center">{titles[step] ?? step}</h1>;
}

function Btn({ label = 'Continue', onClick, disabled, secondary }: { label?: string; onClick: () => void; disabled?: boolean; secondary?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled || false}
      className={`flex-1 h-12 rounded-xl font-semibold text-[15px] active:scale-[0.98] disabled:opacity-40 transition-all duration-150 ${secondary ? 'border border-surface-700 bg-transparent text-text-400 hover:text-text-200' : 'bg-primary-500 text-white hover:bg-primary-400 shadow-[0_4px_24px_rgba(204,85,0,0.25)]'}`}>{label}</button>
  );
}

function Nav({ back, next, canNext = true, optional, onLater }: { back: () => void; next: () => void; canNext?: boolean; optional?: boolean; onLater?: () => void }) {
  function later() { if (onLater) onLater(); next(); }
  return (
    <div className="flex items-center gap-3 mt-8">
      <Btn label="Back" onClick={back} secondary />
      {optional && <Btn label="Complete Later" onClick={later} secondary />}
      <Btn onClick={next} disabled={optional ? false : !canNext} />
    </div>
  );
}

function PersonSelect({ value, onChange, people, onInvite }: { value: string; onChange: (v: string) => void; people: PersonOption[]; onInvite: () => void }) {
  return (
    <select value={value} onChange={(e) => { if (e.target.value === '__invite__') onInvite(); else onChange(e.target.value); }}
      className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none">
      <option value="">Choose person...</option>
      {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
      <option value="__invite__">+ Invite Someone New</option>
    </select>
  );
}

function InviteForm({ name, setName, email, setEmail, role, setRole, onSend, onCancel }: { name: string; setName: (v: string) => void; email: string; setEmail: (v: string) => void; role: string; setRole: (v: string) => void; onSend: () => void; onCancel: () => void }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4 space-y-3">
      <p className="text-sm font-semibold text-surface-100">Invite Someone New</p>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
      <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
      <div className="flex items-center gap-2">
        <button onClick={onSend} disabled={!name.trim() || !email.trim()} className="flex-1 h-10 rounded-xl bg-primary-500 text-white text-sm font-semibold active:scale-[0.98] disabled:opacity-40 transition-all duration-150">Send Invitation</button>
        <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-surface-700 bg-transparent text-sm text-text-400 active:scale-[0.98] transition-all duration-150">Cancel</button>
      </div>
    </div>
  );
}

function ReleaseTypeStep({ releaseType, setReleaseType, next }: { releaseType: string; setReleaseType: (v: ReleaseTypeVal) => void; next: () => void }) {
  return (
    <div className="mt-8 space-y-2.5">
      {RELEASE_TYPES.map((t) => (
        <button key={t.value} onClick={() => { setReleaseType(t.value); next(); }}
          className={`w-full text-left rounded-xl border px-5 py-4 transition-all duration-150 ${releaseType === t.value ? 'border-primary-500/60 bg-primary-500/10' : 'border-surface-700 bg-surface-900 hover:border-surface-600'}`}>
          <p className="text-[15px] font-medium text-surface-100">{t.label}</p><p className="text-xs text-text-500 mt-0.5">{t.description}</p>
        </button>
      ))}
    </div>
  );
}

function DetailsStep({ releaseTitle, setReleaseTitle, version, setVersion, releaseNotes, setReleaseNotes, back, next }: {
  releaseTitle: string;
  setReleaseTitle: (v: string) => void;
  version: string;
  setVersion: (v: string) => void;
  releaseNotes: string;
  setReleaseNotes: (v: string) => void;
  back: () => void;
  next: () => void;
}) {
  return (
    <>
      <input type="text" value={releaseTitle} onChange={(e) => setReleaseTitle(e.target.value)} placeholder="Release title" autoFocus
        className="mt-8 block w-full h-14 rounded-xl border border-surface-700 bg-surface-900 px-5 text-[18px] text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:outline-none" />
      <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version (optional)"
        className="mt-3 block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-5 text-sm text-surface-50 placeholder-text-500 text-center focus:border-primary-500/60 focus:outline-none" />
      <textarea value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} rows={2} placeholder="Release notes (optional)"
        className="mt-3 block w-full rounded-xl border border-surface-700 bg-surface-900 px-4 py-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none resize-none" />
      <Nav back={back} next={next} canNext={!!releaseTitle.trim()} />
    </>
  );
}

function ArtworkStep({ hasArtwork, setHasArtwork, commissionArtwork, setCommissionArtwork, artworkDesigner, setArtworkDesigner, people, inviteName, setInviteName, inviteEmail, setInviteEmail, inviteRole, setInviteRole, showInviteForm, setShowInviteForm, handleInvite, back, next }: {
  hasArtwork: boolean | null;
  setHasArtwork: (v: boolean) => void;
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
  back: () => void;
  next: () => void;
}) {
  return (
    <>
      <div className="mt-8 space-y-3">
        <button onClick={() => setHasArtwork(true)} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-[15px] font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]">Yes, I have artwork</button>
        <button onClick={() => setHasArtwork(false)} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-[15px] font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]">No, not yet</button>
      </div>
      {hasArtwork === false && (
        <div className="mt-6">
          <p className="text-sm text-text-400 text-center mb-4">Would you like to commission artwork?</p>
          <div className="space-y-3">
            <button onClick={() => setCommissionArtwork(true)} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-[15px] font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]">Yes, find a designer</button>
            <button onClick={() => { setCommissionArtwork(false); next(); }} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-[15px] font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]">I'll upload later</button>
          </div>
          {commissionArtwork && (
            <div className="mt-6">
              <PersonSelect value={artworkDesigner} onChange={setArtworkDesigner} people={people} onInvite={() => setShowInviteForm(true)} />
              {showInviteForm && <div className="mt-4"><InviteForm name={inviteName} setName={setInviteName} email={inviteEmail} setEmail={setInviteEmail} role={inviteRole} setRole={setInviteRole} onSend={handleInvite} onCancel={() => setShowInviteForm(false)} /></div>}
              <div className="flex items-center gap-3 mt-6"><Btn label="Back" onClick={back} secondary /><Btn onClick={next} /></div>
            </div>
          )}
        </div>
      )}
      {hasArtwork === true && <div className="flex items-center gap-3 mt-8"><Btn label="Back" onClick={back} secondary /><Btn onClick={next} /></div>}
    </>
  );
}

function TracksStep({ tracks, artists, activeOrgId, addTrack, updateTrack, removeTrack, addFeaturedArtist, removeFeaturedArtist, onArtistCreated, openAssigner, validateRemixTracks, people, setSectionStatus, currentStepKey, back, next }: {
  tracks: WizardTrack[];
  artists: ArtistOption[];
  activeOrgId: string | null;
  addTrack: () => void;
  updateTrack: (id: string, f: string, v: string | boolean | string[]) => void;
  removeTrack: (id: string) => void;
  addFeaturedArtist: (trackId: string, artistId: string) => void;
  removeFeaturedArtist: (trackId: string, artistId: string) => void;
  onArtistCreated: (artist: ArtistOption) => void;
  openAssigner: (label: string, role: string, trackId: string, field: AssignerField, cb?: (r: { personId?: string }) => void) => void;
  validateRemixTracks: () => boolean;
  people?: PersonOption[];
  setSectionStatus?: Dispatch<SetStateAction<SectionStatusMap>>;
  currentStepKey?: string;
  back: () => void;
  next: () => void;
}) {
  function handleNext() {
    if (!validateRemixTracks()) return;
    next();
  }

  return (
    <>
      <div className="mt-8 space-y-4">
        {tracks.map((t, i) => (
          <div key={t.id} className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Track {i + 1}</p>
              {tracks.length > 1 && <button onClick={() => removeTrack(t.id)} className="text-xs text-danger-400">Remove</button>}
            </div>
            <input type="text" value={t.title} onChange={(e) => updateTrack(t.id, 'title', e.target.value)} placeholder="Song title" className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-[15px] text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />

            <div>
              <p className="text-xs font-semibold text-text-500 uppercase tracking-wider mb-2">Recording Type</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-text-300">
                  <input type="radio" name={`recording-${t.id}`} checked={t.recordingType === 'original'} onChange={() => updateTrack(t.id, 'recordingType', 'original')} />
                  Original Recording
                </label>
                <label className="flex items-center gap-2 text-sm text-text-300">
                  <input type="radio" name={`recording-${t.id}`} checked={t.recordingType === 'remix'} onChange={() => updateTrack(t.id, 'recordingType', 'remix')} />
                  Remix
                </label>
              </div>
            </div>

            {t.recordingType === 'original' ? (
              <div key={`${t.id}-original-artists`} className="space-y-3">
                <ArtistFieldPicker
                  key={`${t.id}-primary-artist`}
                  instanceId={`${t.id}-primary-artist`}
                  label="Primary Artist"
                  value={t.primaryArtistId}
                  onChange={(v) => updateTrack(t.id, 'primaryArtistId', v)}
                  artists={artists}
                  organizationId={activeOrgId}
                  onArtistCreated={onArtistCreated}
                />
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Featuring Artists</p>
                  {t.featuredArtistIds.map((aid) => {
                    const name = artists.find((a) => a.id === aid)?.name ?? aid;
                    return (
                      <div key={aid} className="flex items-center justify-between rounded-xl border border-surface-700 bg-surface-950 px-3 py-2">
                        <span className="text-sm text-surface-100">{name}</span>
                        <button type="button" onClick={() => removeFeaturedArtist(t.id, aid)} className="text-xs text-danger-400">Remove</button>
                      </div>
                    );
                  })}
                  <FeaturedArtistsPicker
                    key={`${t.id}-featuring-artists`}
                    instanceId={`${t.id}-featuring-artists`}
                    artists={artists}
                    organizationId={activeOrgId}
                    primaryArtistId={t.primaryArtistId}
                    featuredArtistIds={t.featuredArtistIds}
                    onAdd={(artistId) => addFeaturedArtist(t.id, artistId)}
                    onArtistCreated={onArtistCreated}
                  />
                </div>
              </div>
            ) : (
              <div key={`${t.id}-remix-artists`} className="space-y-3">
                <ArtistFieldPicker
                  key={`${t.id}-original-artist`}
                  instanceId={`${t.id}-original-artist`}
                  label="Original Artist"
                  value={t.originalArtistId}
                  onChange={(v) => updateTrack(t.id, 'originalArtistId', v)}
                  artists={artists}
                  organizationId={activeOrgId}
                  onArtistCreated={onArtistCreated}
                  error={t.remixErrors.originalArtist}
                />
                <ArtistFieldPicker
                  key={`${t.id}-remixer`}
                  instanceId={`${t.id}-remixer`}
                  label="Remixer"
                  value={t.remixerArtistId}
                  onChange={(v) => updateTrack(t.id, 'remixerArtistId', v)}
                  artists={artists}
                  organizationId={activeOrgId}
                  onArtistCreated={onArtistCreated}
                  error={t.remixErrors.remixer}
                />
                <div className="rounded-xl border border-surface-700 bg-surface-950 p-3 space-y-2">
                  <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Suggested Display Title</p>
                  <input
                    type="text"
                    value={t.displayTitle}
                    onChange={(e) => updateTrack(t.id, 'displayTitle', e.target.value)}
                    placeholder={suggestRemixDisplayTitle(t.title, artists.find((a) => a.id === t.remixerArtistId)?.name ?? '')}
                    className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-900 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm text-text-400 flex items-center gap-2"><input type="checkbox" checked={t.mixed} onChange={(e) => updateTrack(t.id, 'mixed', e.target.checked)} /> Have you mixed it?</label>
                {!t.mixed && (
                  <button onClick={() => openAssigner('Assign Mixing Engineer', 'Mixing Engineer', t.id, 'mixingEngineer')}
                    className="mt-2 w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-left text-text-500 hover:border-surface-600 hover:text-surface-200 transition-all">
                    {t.mixingEngineer ? people?.find((p) => p.id === t.mixingEngineer)?.displayName || t.mixingEngineer : 'Assign Mixing Engineer'}
                  </button>
                )}
              </div>
              <div>
                <label className="text-sm text-text-400 flex items-center gap-2"><input type="checkbox" checked={t.mastered} onChange={(e) => updateTrack(t.id, 'mastered', e.target.checked)} /> Has it been mastered?</label>
                {!t.mastered && (
                  <button onClick={() => openAssigner('Assign Mastering Engineer', 'Mastering Engineer', t.id, 'masteringEngineer')}
                    className="mt-2 w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-left text-text-500 hover:border-surface-600 hover:text-surface-200 transition-all">
                    {t.masteringEngineer ? people?.find((p) => p.id === t.masteringEngineer)?.displayName || t.masteringEngineer : 'Assign Mastering Engineer'}
                  </button>
                )}
              </div>
            </div>
            <button onClick={() => updateTrack(t.id, 'pubOpen', !t.pubOpen)}
              className="w-full text-left flex items-center justify-between text-xs font-semibold text-text-500 uppercase tracking-wider hover:text-text-300 transition-colors">
              <span>Publishing Information</span>
              <svg className={`h-3.5 w-3.5 transition-transform ${t.pubOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
             {t.pubOpen && (
               <div className="space-y-3 pt-2">
                 <input type="text" value={t.isrc} onChange={(e) => updateTrack(t.id, 'isrc', e.target.value)} placeholder="ISRC"
                   className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
                 <input type="text" value={t.composer} onChange={(e) => updateTrack(t.id, 'composer', e.target.value)} placeholder="Composer(s)"
                   className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
                 <input type="text" value={t.lyricist} onChange={(e) => updateTrack(t.id, 'lyricist', e.target.value)} placeholder="Lyricist(s)"
                   className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
                 <input type="text" value={t.iswc} onChange={(e) => updateTrack(t.id, 'iswc', e.target.value)} placeholder="ISWC (optional)"
                   className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
              </div>
            )}
          </div>
        ))}
        <button onClick={addTrack} className="w-full h-12 rounded-xl border border-dashed border-surface-600 bg-transparent text-sm font-medium text-text-500 hover:text-text-300 active:scale-[0.98] transition-all">+ Add another track</button>
      </div>
      <Nav back={back} next={handleNext} canNext={tracks.some((t) => t.title.trim())} optional onLater={() => setSectionStatus?.((p) => ({ ...p, [currentStepKey ?? '']: 'skipped' }))} />
    </>
  );
}

function PromoStep({ promoAssets, setPromoAssets, assetDesigners, setAssetDesigners, people, socialRows, setSocialRows, addSocialRow, removeSocialRow, inviteName, setInviteName, inviteEmail, setInviteEmail, inviteRole, setInviteRole, showInviteForm, setShowInviteForm, inviteTarget, setInviteTarget, handleInvite, back, next }: {
  promoAssets: string[];
  setPromoAssets: Dispatch<SetStateAction<string[]>>;
  assetDesigners: Record<string, string>;
  setAssetDesigners: Dispatch<SetStateAction<Record<string, string>>>;
  people: PersonOption[];
  socialRows: SocialRow[];
  setSocialRows: Dispatch<SetStateAction<SocialRow[]>>;
  addSocialRow: () => void;
  removeSocialRow: (id: string) => void;
  inviteName: string;
  setInviteName: (v: string) => void;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: string;
  setInviteRole: (v: string) => void;
  showInviteForm: boolean;
  setShowInviteForm: (v: boolean) => void;
  inviteTarget?: InviteTarget;
  setInviteTarget: (v: InviteTarget) => void;
  handleInvite: () => void;
  back: () => void;
  next: () => void;
}) {
  return (
    <>
      <p className="mt-2 text-sm text-text-400 text-center">Select assets and assign designers.</p>
      <div className="mt-8 space-y-4">
        {PROMO_ASSETS.map((a) => {
          const selected = promoAssets.includes(a.key);
          return (
            <div key={a.key} className={`rounded-xl border transition-all ${selected ? 'border-primary-500/60 bg-primary-500/5' : 'border-surface-700 bg-surface-900'}`}>
              <button onClick={() => setPromoAssets((p: string[]) => p.includes(a.key) ? p.filter((x) => x !== a.key) : [...p, a.key])}
                className="w-full text-left px-5 py-3.5 flex items-center gap-3">
                <span className={`h-4 w-4 rounded border-2 flex items-center justify-center ${selected ? 'border-primary-500 bg-primary-500' : 'border-surface-600'}`}>
                  {selected && <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </span>
                <span className="text-sm font-medium text-surface-100">{a.label}</span>
              </button>
              {selected && (
                <div className="px-5 pb-4">
                  <PersonSelect value={assetDesigners[a.key] ?? ''} onChange={(v) => setAssetDesigners((p) => ({ ...p, [a.key]: v }))} people={people} onInvite={() => { setInviteTarget({ type: 'promo', key: a.key }); setShowInviteForm(true); }} />
                  {showInviteForm && inviteTarget?.key === a.key && (
                    <div className="mt-4"><InviteForm name={inviteName} setName={setInviteName} email={inviteEmail} setEmail={setInviteEmail} role={inviteRole} setRole={setInviteRole} onSend={handleInvite} onCancel={() => { setShowInviteForm(false); setInviteTarget(null); }} /></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm font-medium text-surface-100 text-center mb-3">Social Accounts</p>
      <div className="space-y-3">
        {socialRows.map((r) => (
          <div key={r.id} className="rounded-xl border border-surface-700 bg-surface-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-500 uppercase tracking-wider">Social Account</span>
              <button onClick={() => removeSocialRow(r.id)} className="text-xs text-danger-400">Remove</button>
            </div>
            <select value={r.platform} onChange={(e) => setSocialRows((p) => p.map((x) => x.id === r.id ? { ...x, platform: e.target.value } : x))}
              className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none">
              <option value="">Platform</option>
              {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="text" value={r.url} onChange={(e) => setSocialRows((p) => p.map((x) => x.id === r.id ? { ...x, url: e.target.value } : x))}
              placeholder="Page URL" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
            <PersonSelect value={r.personId} onChange={(v) => setSocialRows((p) => p.map((x) => x.id === r.id ? { ...x, personId: v } : x))} people={people} onInvite={() => {}} />
          </div>
        ))}
        <button onClick={addSocialRow} className="w-full h-12 rounded-xl border border-dashed border-surface-600 bg-transparent text-sm font-medium text-text-500 hover:text-text-300 active:scale-[0.98] transition-all">+ Add Social Account</button>
      </div>
      <Nav back={back} next={next}/>
    </>
  );
}

function EmailStep({ hasEmail, setHasEmail, emailSubject, setEmailSubject, emailPreviewText, setEmailPreviewText, emailBody, setEmailBody, emailCampaignManager, setEmailCampaignManager, emailSendDate, setEmailSendDate, emailSendTime, setEmailSendTime, emailTimezone, setEmailTimezone, openAssigner, back, next, onLater }: {
  hasEmail: boolean | null;
  setHasEmail: (v: boolean) => void;
  emailSubject: string;
  setEmailSubject: (v: string) => void;
  emailPreviewText: string;
  setEmailPreviewText: (v: string) => void;
  emailBody: string;
  setEmailBody: (v: string) => void;
  emailCampaignManager: string;
  setEmailCampaignManager: (v: string) => void;
  emailSendDate: string;
  setEmailSendDate: (v: string) => void;
  emailSendTime: string;
  setEmailSendTime: (v: string) => void;
  emailTimezone: string;
  setEmailTimezone: (v: string) => void;
  openAssigner: (label: string, role: string, trackId: string, field: AssignerField, cb?: (r: { personId?: string }) => void) => void;
  back: () => void;
  next: () => void;
  onLater?: () => void;
}) {
  return (
    <>
      <div className="mt-8 space-y-3">
        <button onClick={() => setHasEmail(true)} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-[15px] font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98] transition-all duration-150">Yes</button>
        <button onClick={() => { setHasEmail(false); if (onLater) onLater(); next(); }} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-[15px] font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98] transition-all duration-150">Not now</button>
      </div>
      {hasEmail && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
            <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Campaign Details</p>
            <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject"
              className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
            <input type="text" value={emailPreviewText} onChange={(e) => setEmailPreviewText(e.target.value)} placeholder="Preview text (optional)"
              className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
            <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={5} placeholder="Write your email copy..."
              className="block w-full rounded-xl border border-surface-700 bg-surface-950 px-4 py-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none resize-none" />
          </div>

          <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
            <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Campaign Manager</p>
            <button onClick={() => openAssigner('Assign Campaign Manager', 'Marketing Manager', '', 'emailManager', (r: { personId?: string }) => setEmailCampaignManager(r.personId ?? ''))}
              className="w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-left text-text-500 hover:border-surface-600 hover:text-surface-200 transition-all">
              {emailCampaignManager || 'Choose who will send this campaign'}
            </button>
          </div>

          <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
            <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Schedule</p>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={emailSendDate} onChange={(e) => setEmailSendDate(e.target.value)}
                className="h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none [color-scheme:dark]" />
              <input type="time" value={emailSendTime} onChange={(e) => setEmailSendTime(e.target.value)}
                className="h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none [color-scheme:dark]" />
            </div>
            <select value={emailTimezone} onChange={(e) => setEmailTimezone(e.target.value)}
              className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none">
              <option value="">Timezone</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Berlin">Berlin (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>

          <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-2">
            <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Attachments</p>
            <p className="text-xs text-text-500">Upload cover artwork, photos, press kits, logos and additional files.</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {['Cover Artwork', 'Artist Photo', 'Press Kit', 'Logo', 'Additional Files'].map((label) => (
                <div key={label} className="flex items-center gap-2 rounded-xl border border-surface-700 bg-surface-950 px-3 py-2.5 cursor-pointer hover:border-surface-600 transition-all">
                  <svg className="h-4 w-4 text-text-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                  <span className="text-xs text-text-500 truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <Nav back={back} next={next} canNext={hasEmail !== null} optional onLater={() => { if (onLater) onLater(); }} />
    </>
  );
}

function ReleaseInfoStep({ primaryArtist, setPrimaryArtist, featuredArtists, setFeaturedArtists, recordLabel, setRecordLabel, catalogueNumber, setCatalogueNumber, upc, setUpc, primaryGenre, setPrimaryGenre, secondaryGenre, setSecondaryGenre, language, setLanguage, copyrightOwner, setCopyrightOwner, copyrightYear, setCopyrightYear, releaseOwner, setReleaseOwner, back, next }: {
  primaryArtist: string;
  setPrimaryArtist: (v: string) => void;
  featuredArtists: string[];
  setFeaturedArtists: (v: string[]) => void;
  recordLabel: string;
  setRecordLabel: (v: string) => void;
  catalogueNumber: string;
  setCatalogueNumber: (v: string) => void;
  upc: string;
  setUpc: (v: string) => void;
  primaryGenre: string;
  setPrimaryGenre: (v: string) => void;
  secondaryGenre: string;
  setSecondaryGenre: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  copyrightOwner: string;
  setCopyrightOwner: (v: string) => void;
  copyrightYear: string;
  setCopyrightYear: (v: string) => void;
  releaseOwner: string;
  setReleaseOwner: (v: string) => void;
  back: () => void;
  next: () => void;
}) {
  return (
    <>
      <p className="mt-2 text-sm text-text-400 text-center">Tell streaming services and stores how this release should appear.</p>
      <div className="mt-8 space-y-6">

        {/* Release section */}
        <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
          <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Release</p>
          <input type="text" value={primaryArtist} onChange={(e) => setPrimaryArtist(e.target.value)} placeholder="Primary Artist"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          <input type="text" value={featuredArtists.join(', ')} onChange={(e) => setFeaturedArtists(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="Featured Artist(s) — comma separated" className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          <input type="text" value={recordLabel} onChange={(e) => setRecordLabel(e.target.value)} placeholder="Record Label"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={catalogueNumber} onChange={(e) => setCatalogueNumber(e.target.value)} placeholder="Catalogue Number"
              className="h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
            <input type="text" value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="UPC (optional)"
              className="h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={primaryGenre} onChange={(e) => setPrimaryGenre(e.target.value)} placeholder="Primary Genre"
              className="h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
            <input type="text" value={secondaryGenre} onChange={(e) => setSecondaryGenre(e.target.value)} placeholder="Secondary Genre"
              className="h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          </div>
          <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Language (e.g. English)"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        </div>

        {/* Rights section */}
        <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
          <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Rights</p>
          <input type="text" value={copyrightOwner} onChange={(e) => setCopyrightOwner(e.target.value)} placeholder="℗ Copyright Owner"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          <input type="text" value={copyrightYear} onChange={(e) => setCopyrightYear(e.target.value)} placeholder="Copyright Year"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          <input type="text" value={releaseOwner} onChange={(e) => setReleaseOwner(e.target.value)} placeholder="© Release Owner"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        </div>
      </div>
      <Nav back={back} next={next}/>
    </>
  );
}

function ReviewStep({ releaseTitle, releaseType, tracks, hasArtwork, commissionArtwork, promoAssets, hasEmail, primaryArtist, primaryGenre, language, sectionStatus, error, launching, back, launch }: {
  releaseTitle: string;
  releaseType: ReleaseTypeVal;
  tracks: WizardTrack[];
  hasArtwork: boolean | null;
  commissionArtwork: boolean | null;
  promoAssets: string[];
  hasEmail: boolean | null;
  primaryArtist: string;
  primaryGenre: string;
  language: string;
  sectionStatus: SectionStatusMap;
  error: string;
  launching: boolean;
  back: () => void;
  launch: () => void;
}) {
  return (
    <>
      <p className="mt-2 text-sm text-text-400 text-center">Everything looks good?</p>
      <div className="mt-8 rounded-xl border border-surface-700 bg-surface-900 divide-y divide-surface-800">
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Release</span><span className="text-sm font-medium text-surface-100">{releaseTitle || '—'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Type</span><span className="text-sm font-medium text-surface-100">{releaseTypeLabel(releaseType)}</span></div>
        {(() => {
          const counts = countRecordingTypes(tracks);
          return (
            <>
              {counts.originals > 0 && (
                <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Contains</span><span className="text-sm font-medium text-surface-100">{counts.originals} Original Recording{counts.originals === 1 ? '' : 's'}</span></div>
              )}
              {counts.remixes > 0 && (
                <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Contains</span><span className="text-sm font-medium text-surface-100">{counts.remixes} Remix{counts.remixes === 1 ? '' : 'es'}</span></div>
              )}
            </>
          );
        })()}
         <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Tracks</span><span className="text-sm font-medium text-surface-100">{tracks.filter((t) => t.title.trim()).length}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Mixed</span><span className="text-sm font-medium text-surface-100">{tracks.filter((t) => t.mixed && t.title.trim()).length}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Needs Mixing</span><span className="text-sm font-medium text-surface-100">{tracks.filter((t) => !t.mixed && t.title.trim()).length}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Mastered</span><span className="text-sm font-medium text-surface-100">{tracks.filter((t) => t.mastered && t.title.trim()).length}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Needs Mastering</span><span className="text-sm font-medium text-surface-100">{tracks.filter((t) => !t.mastered && t.title.trim()).length}</span></div>
      </div>
      <div className="mt-8 rounded-xl border border-surface-700 bg-surface-900 divide-y divide-surface-800">
        <p className="px-5 py-3 text-xs font-semibold text-text-500 uppercase tracking-wider">Track Publishing</p>
        {tracks.filter((t) => t.title.trim()).map((t, i) => (
          <div key={t.id} className="flex justify-between px-5 py-3">
            <span className="text-sm text-text-400">Track {i + 1}</span>
            <span className={`text-sm font-medium ${t.isrc ? 'text-success-400' : 'text-text-500'}`}>{t.isrc ? '✓ ISRC set' : '⚠ No ISRC'}</span>
          </div>
        ))}
        {tracks.filter((t) => t.title.trim()).length === 0 && (
          <p className="px-5 py-3 text-sm text-text-500">No tracks added</p>
        )}
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Artwork</span><span className="text-sm font-medium text-surface-100">{hasArtwork ? 'Ready' : commissionArtwork ? 'Commissioned' : 'Later'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Promotion</span><span className="text-sm font-medium text-surface-100">{promoAssets.length} assets</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Email</span><span className="text-sm font-medium text-surface-100">{hasEmail ? 'Enabled' : 'None'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Primary Artist</span><span className="text-sm font-medium text-surface-100">{primaryArtist || '—'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Genre</span><span className="text-sm font-medium text-surface-100">{primaryGenre || '—'}</span></div>
        <div className="flex justify-between px-5 py-3.5"><span className="text-sm text-text-400">Language</span><span className="text-sm font-medium text-surface-100">{language || '—'}</span></div>
      </div>
      <div className="mt-8 rounded-xl border border-surface-700 bg-surface-900 divide-y divide-surface-800">
        <p className="px-5 py-3 text-xs font-semibold text-text-500 uppercase tracking-wider">Section Status</p>
        {(['artwork', 'tracks', 'release_info', 'promotion', 'email'] as const).map((s) => {
          const status = sectionStatus[s] ?? 'incomplete';
          const color = status === 'complete' ? 'text-success-400' : status === 'skipped' ? 'text-text-500' : 'text-warning-400';
          return (
            <div key={s} className="flex justify-between px-5 py-3">
              <span className="text-sm text-text-400 capitalize">{s.replace('_', ' ')}</span>
              <span className={`text-sm font-medium ${color}`}>{status}</span>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 text-sm text-danger-400 text-center">{error}</p>}
      <div className="flex items-center gap-3 mt-8">
        <Btn label="Back" onClick={back} secondary />
        <Btn label={launching ? 'Creating...' : 'Launch Release'} onClick={launch} disabled={launching || !releaseTitle.trim()} />
      </div>
    </>
  );
}
