'use client';

import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { getPeopleByOrg } from '@/lib/people-repository';
import { createNewTrack, editTrack } from '@/lib/track-service';
import { fetchRelease } from '@/lib/release-service';
import { addArtistToTrack } from '@/lib/track-artist-repository';
import { createNewAssignment } from '@/lib/assignment-service';
import {
  createRequestedAsset,
  assignAsset,
  startAssetWork,
  deliverAsset,
  type AssetType,
} from '@/lib/asset-lifecycle-service';
import { invitePerson } from '@/lib/invitation-service';
import { getOrganization } from '@/lib/organization-repository';
import { PersonPickerDialog } from '@/components/person-picker-dialog';
import type { ArtistOption, RepeatableArtistEntry } from '@/components/artist-field-picker';
import { TrackEditor, type TrackEditorValue } from '@/components/track-editor';
import { useArtists } from '@/hooks/useArtist';
import {
  recordingTypeLabel,
  type RecordingType,
} from '@/lib/recording-type';
import { EmptyState, LoadingState } from '@releaseflow/ui';

const STEPS = ['basics', 'recording', 'production', 'credits', 'deliverables', 'metadata', 'review'] as const;
type StepKey = typeof STEPS[number];
type SectionStatus = 'complete' | 'incomplete' | 'skipped';
type SectionStatusMap = Record<string, SectionStatus>;
type PersonOption = { id: string; displayName: string };
type ProductionStage = 'demo' | 'recording' | 'editing' | 'mixed' | 'mastered';

type EngineerAssignment = {
  personId: string;
  comment: string;
  expectedDelivery: string;
  inviteName?: string;
  inviteEmail?: string;
};

type ContributorEntry = {
  id: string;
  name: string;
};

type CreditRoleKey = 'producer' | 'composer' | 'lyricist' | 'songwriter' | 'publisher' | 'performer';

type DeliverableKey =
  | 'master_wav'
  | 'session_files'
  | 'lyrics'
  | 'instrumental'
  | 'clean_version';

type DeliverableItem = {
  status: 'none' | 'uploaded' | 'assigned' | 'invited' | 'deferred';
  personId?: string;
  inviteName?: string;
  inviteEmail?: string;
  comment?: string;
  file?: File | null;
  fileUrl?: string;
  filename?: string;
  contentType?: string;
  sizeBytes?: number;
  lyricsText?: string;
};

const PRODUCTION_STAGES: { value: ProductionStage; label: string }[] = [
  { value: 'demo', label: 'Demo' },
  { value: 'recording', label: 'Recording' },
  { value: 'editing', label: 'Editing' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'mastered', label: 'Mastered' },
];

const CREDIT_ROLES: { key: CreditRoleKey; label: string }[] = [
  { key: 'producer', label: 'Producer' },
  { key: 'composer', label: 'Composer' },
  { key: 'lyricist', label: 'Lyricist' },
  { key: 'songwriter', label: 'Songwriters' },
  { key: 'publisher', label: 'Publishers' },
  { key: 'performer', label: 'Performers' },
];

const DELIVERABLE_DEFS: {
  key: DeliverableKey;
  label: string;
  type: AssetType;
  canAssign: boolean;
  canPaste?: boolean;
}[] = [
  { key: 'master_wav', label: 'Master WAV', type: 'audio', canAssign: true },
  { key: 'session_files', label: 'Session Files', type: 'document', canAssign: false },
  { key: 'lyrics', label: 'Lyrics', type: 'document', canAssign: false, canPaste: true },
  { key: 'instrumental', label: 'Instrumental', type: 'audio', canAssign: false },
  { key: 'clean_version', label: 'Clean Version', type: 'audio', canAssign: false },
];

function emptyDeliverables(): Record<DeliverableKey, DeliverableItem> {
  return {
    master_wav: { status: 'none' },
    session_files: { status: 'none' },
    lyrics: { status: 'none' },
    instrumental: { status: 'none' },
    clean_version: { status: 'none' },
  };
}

function emptyCredits(): Record<CreditRoleKey, ContributorEntry[]> {
  return {
    producer: [],
    composer: [],
    lyricist: [],
    songwriter: [],
    publisher: [],
    performer: [],
  };
}

function emptyEngineer(): EngineerAssignment {
  return { personId: '', comment: '', expectedDelivery: '' };
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function needsMixing(stage: ProductionStage) {
  return stage !== 'mixed' && stage !== 'mastered';
}

function needsMastering(stage: ProductionStage) {
  return stage !== 'mastered';
}

async function extractAudioDuration(file: File): Promise<number | undefined> {
  if (!file.type.startsWith('audio/')) return undefined;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = url;
    audio.addEventListener('loadedmetadata', () => {
      const d = Number.isFinite(audio.duration) ? Math.round(audio.duration) : undefined;
      URL.revokeObjectURL(url);
      resolve(d);
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    });
  });
}

export default function NewTrackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const releaseId = searchParams.get('releaseId') ?? '';
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const { artistOptions: artists, onArtistCreated: handleArtistCreated } = useArtists();
  console.log('[TrackWizard] artists received by picker:', artists.length);

  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const [releaseTitle, setReleaseTitle] = useState<string | null>(null);
  const [loadingRelease, setLoadingRelease] = useState(!!releaseId);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [sectionStatus, setSectionStatus] = useState<SectionStatusMap>({});

  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [recordingType, setRecordingType] = useState<RecordingType>('original');
  // BUILD-011C Group A — Original Work (original song). Never bind to track.primaryArtistId.
  // Kept in memory when switching type away from remix.
  const [originalWorkTitle, setOriginalWorkTitle] = useState('');
  const [originalWorkPrimaryArtistId, setOriginalWorkPrimaryArtistId] = useState('');
  const [originalWorkFeaturedArtists, setOriginalWorkFeaturedArtists] = useState<RepeatableArtistEntry[]>([]);
  // BUILD-011C Group B — Primary Artist of the recording being released (Original or Remix).
  // Same UI field + track.primaryArtistId binding for both types; meaning is always the released recording, never originalWork.
  const [primaryArtistId, setPrimaryArtistId] = useState('');
  const [featuredArtists, setFeaturedArtists] = useState<RepeatableArtistEntry[]>([]);
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayTitleEdited, setDisplayTitleEdited] = useState(false);
  const [remixErrors, setRemixErrors] = useState<{
    featuredArtists?: string;
    originalWorkTitle?: string;
    originalWorkPrimaryArtist?: string;
  }>({});

  const [productionStage, setProductionStage] = useState<ProductionStage>('demo');
  const [mixingEngineer, setMixingEngineer] = useState<EngineerAssignment>(emptyEngineer());
  const [masteringEngineer, setMasteringEngineer] = useState<EngineerAssignment>(emptyEngineer());

  const [credits, setCredits] = useState(emptyCredits());
  const [deliverables, setDeliverables] = useState(emptyDeliverables());

  const [isrc, setIsrc] = useState('');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [subgenre, setSubgenre] = useState('');
  const [explicit, setExplicit] = useState('false');
  const [label, setLabel] = useState('');
  const [copyrightYear, setCopyrightYear] = useState(String(new Date().getFullYear()));
  const [publishingYear, setPublishingYear] = useState(String(new Date().getFullYear()));
  const [derivedDuration, setDerivedDuration] = useState<number | undefined>();

  const [assignerOpen, setAssignerOpen] = useState(false);
  const [assignerLabel, setAssignerLabel] = useState('');
  const [assignerRole, setAssignerRole] = useState('');
  const assignerCallback = useRef<((r: { personId?: string; personName?: string; invitationEmail?: string }) => void) | null>(null);

  const currentStepKey = STEPS[step]!;

  useEffect(() => {
    if (!user) router.push('/sign-in');
  }, [user, router]);

  useEffect(() => {
    if (!activeOrgId) return;
    getPeopleByOrg(activeOrgId).then((p) => setPeople(p.map((x) => ({ id: x.id, displayName: x.displayName }))));
  }, [activeOrgId]);

  useEffect(() => {
    if (!releaseId) {
      router.push('/tracks');
      return;
    }
    if (!activeOrgId) {
      setLoadingRelease(false);
      return;
    }
    let cancelled = false;
    async function loadRelease() {
      setLoadingRelease(true);
      try {
        const release = await fetchRelease(releaseId);
        if (cancelled) return;
        if (!release) setError('Release not found.');
        else if (activeOrgId && release.organizationId !== activeOrgId) setError('You do not have access to this release.');
        else setReleaseTitle(release.title);
      } catch {
        if (!cancelled) setError('Could not load release.');
      } finally {
        if (!cancelled) setLoadingRelease(false);
      }
    }
    loadRelease();
    return () => { cancelled = true; };
  }, [releaseId, activeOrgId]);

  function openAssigner(
    label: string,
    role: string,
    cb: (r: { personId?: string; personName?: string; invitationEmail?: string }) => void,
  ) {
    setAssignerLabel(label);
    setAssignerRole(role);
    assignerCallback.current = cb;
    setAssignerOpen(true);
  }

  function next() {
    if (currentStepKey === 'basics' && !validateBasics()) return;
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function later(section: string) {
    setSectionStatus((p) => ({ ...p, [section]: 'skipped' }));
    next();
  }

  function validateBasics(): boolean {
    if (!title.trim()) return false;
    if (recordingType !== 'remix') return true;
    const errors: {
      originalWorkTitle?: string;
      originalWorkPrimaryArtist?: string;
    } = {};
    // BUILD-011C — Original Work validation only (match Edit Track messages)
    if (!originalWorkTitle.trim()) {
      errors.originalWorkTitle = 'Original Song Title is required for remix tracks.';
    }
    if (!originalWorkPrimaryArtistId.trim()) {
      errors.originalWorkPrimaryArtist = 'Original Primary Artist is required for remix tracks.';
    }
    setRemixErrors(errors);
    return !errors.originalWorkTitle && !errors.originalWorkPrimaryArtist;
  }

  function addCredit(role: CreditRoleKey, name: string) {
    if (!name.trim()) return;
    setCredits((p) => ({
      ...p,
      [role]: [...p[role], { id: uid(), name: name.trim() }],
    }));
  }

  function removeCredit(role: CreditRoleKey, id: string) {
    setCredits((p) => ({
      ...p,
      [role]: p[role].filter((c) => c.id !== id),
    }));
  }

  async function handleDeliverableFile(key: DeliverableKey, file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const item: DeliverableItem = {
      status: 'uploaded',
      file,
      fileUrl: url,
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    };
    setDeliverables((p) => ({ ...p, [key]: item }));
    if (key === 'master_wav') {
      const duration = await extractAudioDuration(file);
      if (duration) setDerivedDuration(duration);
    }
  }

  function setDeliverableDeferred(key: DeliverableKey) {
    setDeliverables((p) => ({ ...p, [key]: { status: 'deferred' } }));
  }

  async function persistDeliverable(trackId: string, key: DeliverableKey, def: typeof DELIVERABLE_DEFS[number], item: DeliverableItem) {
    if (!activeOrgId || item.status === 'none') return;
    const assetId = await createRequestedAsset(
      trackId,
      activeOrgId,
      def.label,
      def.type,
      item.comment || item.lyricsText || undefined,
    );
    if (item.status === 'assigned' && item.personId) {
      await assignAsset(assetId, item.personId);
    }
    if (item.status === 'uploaded' && item.fileUrl) {
      const assignPerson = item.personId || mixingEngineer.personId || masteringEngineer.personId;
      if (assignPerson) {
        await assignAsset(assetId, assignPerson);
        await startAssetWork(assetId);
        await deliverAsset(
          assetId,
          item.fileUrl,
          item.filename,
          item.contentType,
          item.sizeBytes,
        );
      }
    }
    if (item.status === 'invited' && item.inviteEmail && user) {
      const org = await getOrganization(activeOrgId);
      await invitePerson({
        organizationId: activeOrgId,
        organizationName: org?.name ?? '',
        inviteeName: '',
        inviteeEmail: item.inviteEmail,
        platformRole: 'collaborator',
        professionalRole: 'Contributor',
        invitedByUserId: user.uid,
        invitedByName: user.displayName || user.email?.split('@')[0] || 'Administrator',
      });
    }
  }

  async function handleFinish() {
    if (!activeOrgId || !user || !title.trim()) return;
    if (!validateBasics()) {
      setStep(0);
      return;
    }
    setLaunching(true);
    setError('');
    try {
      const resolvedTitle = recordingType === 'remix' && displayTitle.trim()
        ? displayTitle.trim()
        : title.trim();

      const featuredIds = featuredArtists.map((e) => e.artistId).filter(Boolean);
      // BUILD-011C — Group B Remix Recording uses existing track primary/featured only.
      // No originalArtists / remixArtists intermediate state.
      const recordingPrimaryId = primaryArtistId || null;
      const originalIds = recordingPrimaryId ? [recordingPrimaryId] : [];

      const trackId = await createNewTrack({
        releaseId,
        organizationId: activeOrgId,
        title: resolvedTitle,
        createdBy: user.uid,
        version: version.trim() || undefined,
        recordingType,
        originalArtistId: null,
        remixerArtistId: null,
        primaryArtistId: recordingPrimaryId,
        originalArtistIds: originalIds,
        featuredArtistIds: featuredIds,
        remixArtistIds: [],
        // BUILD-011C Group A — bind only to nested originalWork for remix
        originalWork: recordingType === 'remix'
          ? {
              title: originalWorkTitle.trim(),
              primaryArtistId: originalWorkPrimaryArtistId,
              featuredArtistIds: originalWorkFeaturedArtists.map((e) => e.artistId).filter(Boolean),
            }
          : null,
        displayTitle: displayTitle.trim() || null,
        displayTitleEdited,
        isrc: isrc.trim() || undefined,
        language: language.trim() || undefined,
        genre: genre.trim() || undefined,
        explicit: explicit === 'true',
        duration: derivedDuration,
      });

      if (recordingPrimaryId) {
        await addArtistToTrack({
          trackId,
          artistId: recordingPrimaryId,
          role: 'PRIMARY_ARTIST',
          position: 1,
          isPrimary: true,
        });
      }
      for (let idx = 0; idx < featuredArtists.length; idx++) {
        const entry = featuredArtists[idx]!;
        if (entry.artistId) {
          await addArtistToTrack({
            trackId,
            artistId: entry.artistId,
            role: 'FEATURED_ARTIST',
            position: idx + 1,
          });
        }
      }

      if (needsMixing(productionStage) && mixingEngineer.personId) {
        await createNewAssignment({
          organizationId: activeOrgId ?? '',
          title: `Mix - ${title}`,
          entityType: 'track',
          entityId: trackId,
          assigneeId: mixingEngineer.personId,
          assignerId: user?.uid ?? '',
          role: 'Mixing Engineer',
          description: [mixingEngineer.comment, mixingEngineer.expectedDelivery ? `Expected: ${mixingEngineer.expectedDelivery}` : ''].filter(Boolean).join(' · ') || undefined,
        });
      }
      if (needsMastering(productionStage) && masteringEngineer.personId) {
        await createNewAssignment({
          organizationId: activeOrgId ?? '',
          title: `Master - ${title}`,
          entityType: 'track',
          entityId: trackId,
          assigneeId: masteringEngineer.personId,
          assignerId: user?.uid ?? '',
          role: 'Mastering Engineer',
          description: [masteringEngineer.comment, masteringEngineer.expectedDelivery ? `Expected: ${masteringEngineer.expectedDelivery}` : ''].filter(Boolean).join(' · ') || undefined,
        });
      }

      const allCredits = CREDIT_ROLES.flatMap((role) =>
        credits[role.key]
          .filter((e) => e.name.trim())
          .map((e) => ({ role: role.label, name: e.name.trim() })),
      );
      if (allCredits.length > 0) {
        await editTrack(trackId, { credits: allCredits });
      }

      for (const def of DELIVERABLE_DEFS) {
        await persistDeliverable(trackId, def.key, def, deliverables[def.key]);
      }

      router.push(`/releases/${releaseId}`);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      setLaunching(false);
      throw error;
    }
  }

  if (!user) return null;

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-lg px-5 sm:px-7 py-12 page-transition">
        <EmptyState title="No organization selected" description="Select an organization to create a track." />
      </div>
    );
  }

  if (loadingRelease) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  return (
    <div className="mx-auto max-w-lg px-5 sm:px-7 py-12 page-transition">
      <div className="flex items-center justify-center gap-2 mb-10">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-300 ${
              i < step
                ? 'h-2 w-2 bg-primary-500/40'
                : i === step
                  ? 'h-2.5 w-2.5 bg-primary-500 shadow-[0_0_6px_rgba(204,85,0,0.4)]'
                  : 'h-1.5 w-1.5 bg-surface-700'
            }`}
          />
        ))}
      </div>

      {releaseTitle ? (
        <p className="text-xs font-medium text-text-500 uppercase tracking-widest text-center mb-2">
          {releaseTitle}
        </p>
      ) : null}

      <StepTitle step={currentStepKey} />

      {currentStepKey === 'basics' && (
        <BasicsStep
          editorValue={{
            title,
            version,
            recordingType,
            originalWorkTitle,
            originalWorkPrimaryArtistId,
            originalWorkFeaturedArtists,
            primaryArtistId,
            featuredArtists,
            displayTitle,
            displayTitleEdited,
            mixed: true,
            mastered: true,
            mixingEngineer: '',
            masteringEngineer: '',
            isrc: '',
            composer: '',
            lyricist: '',
            iswc: '',
            pubOpen: false,
          }}
          onEditorChange={(patch: Partial<TrackEditorValue>) => {
            if (patch.title !== undefined) setTitle(patch.title);
            if (patch.version !== undefined) setVersion(patch.version);
            if (patch.recordingType !== undefined) setRecordingType(patch.recordingType);
            if (patch.originalWorkTitle !== undefined) setOriginalWorkTitle(patch.originalWorkTitle);
            if (patch.originalWorkPrimaryArtistId !== undefined) {
              setOriginalWorkPrimaryArtistId(patch.originalWorkPrimaryArtistId);
            }
            if (patch.originalWorkFeaturedArtists !== undefined) {
              setOriginalWorkFeaturedArtists(patch.originalWorkFeaturedArtists);
            }
            if (patch.primaryArtistId !== undefined) setPrimaryArtistId(patch.primaryArtistId);
            if (patch.featuredArtists !== undefined) setFeaturedArtists(patch.featuredArtists);
            if (patch.displayTitle !== undefined) setDisplayTitle(patch.displayTitle);
            if (patch.displayTitleEdited !== undefined) {
              setDisplayTitleEdited(patch.displayTitleEdited);
            }
          }}
          remixErrors={remixErrors}
          setRemixErrors={setRemixErrors}
          artists={artists}
          activeOrgId={activeOrgId}
          onArtistCreated={handleArtistCreated}
          back={back}
          next={next}
        />
      )}

      {currentStepKey === 'recording' && (
        <RecordingStep
          productionStage={productionStage}
          setProductionStage={setProductionStage}
          back={back}
          next={next}
          onLater={() => later('recording')}
        />
      )}

      {currentStepKey === 'production' && (
        <ProductionStep
          productionStage={productionStage}
          mixingEngineer={mixingEngineer}
          setMixingEngineer={setMixingEngineer}
          masteringEngineer={masteringEngineer}
          setMasteringEngineer={setMasteringEngineer}
          people={people}
          openAssigner={openAssigner}
          back={back}
          next={next}
          onLater={() => later('production')}
        />
      )}

      {currentStepKey === 'credits' && (
        <CreditsStep
          credits={credits}
          addCredit={addCredit}
          removeCredit={removeCredit}
          back={back}
          next={next}
          onLater={() => later('credits')}
        />
      )}

      {currentStepKey === 'deliverables' && (
        <DeliverablesStep
          deliverables={deliverables}
          setDeliverables={setDeliverables}
          onFile={handleDeliverableFile}
          onDeferred={setDeliverableDeferred}
          people={people}
          openAssigner={openAssigner}
          back={back}
          next={next}
          onLater={() => later('deliverables')}
        />
      )}

      {currentStepKey === 'metadata' && (
        <MetadataStep
          isrc={isrc}
          setIsrc={setIsrc}
          language={language}
          setLanguage={setLanguage}
          genre={genre}
          setGenre={setGenre}
          subgenre={subgenre}
          setSubgenre={setSubgenre}
          explicit={explicit}
          setExplicit={setExplicit}
          label={label}
          setLabel={setLabel}
          copyrightYear={copyrightYear}
          setCopyrightYear={setCopyrightYear}
          publishingYear={publishingYear}
          setPublishingYear={setPublishingYear}
          derivedDuration={derivedDuration}
          back={back}
          next={next}
          onLater={() => later('metadata')}
        />
      )}

      {currentStepKey === 'review' && (
        <ReviewStep
          title={title}
          version={version}
          recordingType={recordingType}
          artists={artists}
          primaryArtistId={primaryArtistId}
          featuredArtists={featuredArtists}
          originalWorkTitle={originalWorkTitle}
          originalWorkPrimaryArtistId={originalWorkPrimaryArtistId}
          productionStage={productionStage}
          mixingEngineer={mixingEngineer}
          masteringEngineer={masteringEngineer}
          people={people}
          credits={credits}
          deliverables={deliverables}
          isrc={isrc}
          language={language}
          genre={genre}
          subgenre={subgenre}
          explicit={explicit}
          label={label}
          copyrightYear={copyrightYear}
          publishingYear={publishingYear}
          derivedDuration={derivedDuration}
          sectionStatus={sectionStatus}
          error={error}
          launching={launching}
          back={back}
          onFinish={handleFinish}
        />
      )}

      <PersonPickerDialog
        open={assignerOpen}
        onClose={() => setAssignerOpen(false)}
        onSelectPerson={(result) => {
          assignerCallback.current?.({ personId: result.personId });
          assignerCallback.current = null;
          setAssignerOpen(false);
        }}
        contextLabel={assignerLabel}
        contextRole={assignerRole}
        organizationId={activeOrgId}
        currentUserId={user.uid}
      />
    </div>
  );
}

function StepTitle({ step }: { step: StepKey }) {
  const titles: Record<StepKey, string> = {
    basics: 'What is this track called?',
    recording: 'Where are you in production?',
    production: 'Who is handling the audio?',
    credits: 'Who contributed to this recording?',
    deliverables: 'What deliverables do you already have?',
    metadata: 'Publishing metadata',
    review: 'Ready to create this track?',
  };
  return <h1 className="text-display-md font-semibold tracking-tight text-primary-400 text-center">{titles[step]}</h1>;
}

function Btn({ label = 'Continue', onClick, disabled, secondary }: { label?: string; onClick: () => void; disabled?: boolean; secondary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled ?? false}
      className={`flex-1 h-12 rounded-xl font-semibold text-body active:scale-[0.98] disabled:opacity-40 transition-all duration-150 ${
        secondary
          ? 'border border-surface-700 bg-transparent text-text-400 hover:text-text-200'
          : 'bg-primary-500 text-surface-50 hover:bg-primary-400 shadow-[0_4px_24px_rgba(204,85,0,0.25)]'
      }`}
    >
      {label}
    </button>
  );
}

function Nav({ back, next, canNext = true, optional, onLater }: { back: () => void; next: () => void; canNext?: boolean; optional?: boolean; onLater?: () => void }) {
  function later() { if (onLater) onLater(); next(); }
  return (
    <div className="flex items-center gap-3 mt-8">
      <Btn label="Back" onClick={back} secondary />
      {optional && onLater ? <Btn label="Complete Later" onClick={later} secondary /> : null}
      <Btn onClick={next} disabled={optional ? false : !canNext} />
    </div>
  );
}

function PersonSelect({ value, onChange, people, onInvite }: { value: string; onChange: (v: string) => void; people: PersonOption[]; onInvite: () => void }) {
  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === '__invite__') onInvite();
        else onChange(e.target.value);
      }}
      className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none"
    >
      <option value="">Select...</option>
      {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
      <option value="__invite__">+ Invite Someone New</option>
    </select>
  );
}

function SectionStatusBadge({ status }: { status?: SectionStatus }) {
  if (!status) return <span className="text-xs text-text-500">Incomplete</span>;
  const labels: Record<SectionStatus, string> = {
    complete: 'Complete',
    incomplete: 'Incomplete',
    skipped: 'Skipped',
  };
  const colors: Record<SectionStatus, string> = {
    complete: 'text-success-400',
    incomplete: 'text-warning-400',
    skipped: 'text-text-500',
  };
  return <span className={`text-xs font-medium ${colors[status]}`}>{labels[status]}</span>;
}

function BasicsStep({
  editorValue,
  onEditorChange,
  remixErrors,
  setRemixErrors,
  artists,
  activeOrgId,
  onArtistCreated,
  back,
  next,
}: {
  editorValue: TrackEditorValue;
  onEditorChange: (patch: Partial<TrackEditorValue>) => void;
  remixErrors: {
    featuredArtists?: string;
    originalWorkTitle?: string;
    originalWorkPrimaryArtist?: string;
  };
  setRemixErrors: Dispatch<
    SetStateAction<{
      featuredArtists?: string;
      originalWorkTitle?: string;
      originalWorkPrimaryArtist?: string;
    }>
  >;
  artists: ArtistOption[];
  activeOrgId: string | null;
  onArtistCreated: (a: ArtistOption) => void;
  back: () => void;
  next: () => void;
}) {
  return (
    <>
      {/*
        BUILD-011C via canonical TrackEditor:
        Track Title → Recording Type → [Original Work if remix] → Recording metadata
      */}
      <TrackEditor
        instanceId="new-track"
        value={editorValue}
        onChange={onEditorChange}
        errors={remixErrors}
        onClearError={(key) => setRemixErrors((p) => ({ ...p, [key]: undefined }))}
        artists={artists}
        organizationId={activeOrgId}
        onArtistCreated={onArtistCreated}
        variant="dark"
        titlePlaceholder="Track title"
        titleAutoFocus
        titleCentered
      />
      <Nav back={back} next={next} canNext={!!editorValue.title.trim()} />
    </>
  );
}

function RecordingStep({
  productionStage, setProductionStage, back, next, onLater,
}: {
  productionStage: ProductionStage;
  setProductionStage: (v: ProductionStage) => void;
  back: () => void;
  next: () => void;
  onLater: () => void;
}) {
  return (
    <>
      <p className="mt-3 text-sm text-text-400 text-center">Current Stage</p>
      <div className="mt-6 space-y-2">
        {PRODUCTION_STAGES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setProductionStage(s.value)}
            className={`w-full text-left rounded-xl border px-5 py-4 transition-all duration-150 ${
              productionStage === s.value
                ? 'border-primary-500/60 bg-primary-500/10'
                : 'border-surface-700 bg-surface-900 hover:border-surface-600'
            }`}
          >
            <p className="text-body font-medium text-surface-100">{s.label}</p>
          </button>
        ))}
      </div>
      <Nav back={back} next={next} optional onLater={onLater} />
    </>
  );
}

function EngineerBlock({
  label,
  role,
  value,
  onChange,
  people,
  openAssigner,
}: {
  label: string;
  role: string;
  value: EngineerAssignment;
  onChange: (v: EngineerAssignment) => void;
  people: PersonOption[];
  openAssigner: (label: string, role: string, cb: (r: { personId?: string }) => void) => void;
}) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
      <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">{label}</p>
      <PersonSelect
        value={value.personId}
        onChange={(v) => onChange({ ...value, personId: v })}
        people={people}
        onInvite={() => openAssigner(label, role, (r) => onChange({ ...value, personId: r.personId ?? '' }))}
      />
      <input
        type="text"
        value={value.comment}
        onChange={(e) => onChange({ ...value, comment: e.target.value })}
        placeholder="Comment (optional)"
        className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none"
      />
      <input
        type="date"
        value={value.expectedDelivery}
        onChange={(e) => onChange({ ...value, expectedDelivery: e.target.value })}
        className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none"
      />
      <p className="text-xs text-text-500">Expected Delivery</p>
    </div>
  );
}

function ProductionStep({
  productionStage, mixingEngineer, setMixingEngineer, masteringEngineer, setMasteringEngineer,
  people, openAssigner, back, next, onLater,
}: {
  productionStage: ProductionStage;
  mixingEngineer: EngineerAssignment;
  setMixingEngineer: (v: EngineerAssignment) => void;
  masteringEngineer: EngineerAssignment;
  setMasteringEngineer: (v: EngineerAssignment) => void;
  people: PersonOption[];
  openAssigner: (label: string, role: string, cb: (r: { personId?: string }) => void) => void;
  back: () => void;
  next: () => void;
  onLater: () => void;
}) {
  return (
    <>
      <div className="mt-8 space-y-4">
        {needsMixing(productionStage) ? (
          <EngineerBlock
            label="Assign Mixing Engineer"
            role="Mixing Engineer"
            value={mixingEngineer}
            onChange={setMixingEngineer}
            people={people}
            openAssigner={openAssigner}
          />
        ) : null}
        {needsMastering(productionStage) ? (
          <EngineerBlock
            label="Assign Mastering Engineer"
            role="Mastering Engineer"
            value={masteringEngineer}
            onChange={setMasteringEngineer}
            people={people}
            openAssigner={openAssigner}
          />
        ) : null}
        {!needsMixing(productionStage) && !needsMastering(productionStage) ? (
          <p className="text-sm text-text-400 text-center py-6">This track is already mixed and mastered. Continue to credits.</p>
        ) : null}
      </div>
      <Nav back={back} next={next} optional onLater={onLater} />
    </>
  );
}

function CreditsStep({
  credits, addCredit, removeCredit, back, next, onLater,
}: {
  credits: Record<CreditRoleKey, ContributorEntry[]>;
  addCredit: (role: CreditRoleKey, name: string) => void;
  removeCredit: (role: CreditRoleKey, id: string) => void;
  back: () => void;
  next: () => void;
  onLater: () => void;
}) {
  const [nameInputs, setNameInputs] = useState<Record<CreditRoleKey, string>>({
    producer: '', composer: '', lyricist: '', songwriter: '', publisher: '', performer: '',
  });

  return (
    <>
      <div className="mt-8 space-y-4">
        {CREDIT_ROLES.map((role) => (
          <div key={role.key} className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
            <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">{role.label}</p>
            {credits[role.key].map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-surface-700 bg-surface-950 px-3 py-2">
                <span className="text-sm text-surface-100">{entry.name}</span>
                <button type="button" onClick={() => removeCredit(role.key, entry.id)} className="text-xs text-danger-400">Remove</button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInputs[role.key]}
                onChange={(e) => setNameInputs((p) => ({ ...p, [role.key]: e.target.value }))}
                placeholder={`Enter ${role.label.toLowerCase()} name...`}
                className="block flex-1 h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (nameInputs[role.key]?.trim()) {
                    addCredit(role.key, nameInputs[role.key]);
                    setNameInputs((p) => ({ ...p, [role.key]: '' }));
                  }
                }}
                className="h-10 px-4 rounded-xl bg-primary-500/15 text-primary-400 text-sm font-medium hover:bg-primary-500/25 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
      <Nav back={back} next={next} optional onLater={onLater} />
    </>
  );
}

function DeliverablesStep({
  deliverables, setDeliverables, onFile, onDeferred, people, openAssigner, back, next, onLater,
}: {
  deliverables: Record<DeliverableKey, DeliverableItem>;
  setDeliverables: Dispatch<SetStateAction<Record<DeliverableKey, DeliverableItem>>>;
  onFile: (key: DeliverableKey, file: File | null) => void;
  onDeferred: (key: DeliverableKey) => void;
  people: PersonOption[];
  openAssigner: (label: string, role: string, cb: (r: { personId?: string }) => void) => void;
  back: () => void;
  next: () => void;
  onLater: () => void;
}) {
  return (
    <>
      <div className="mt-8 space-y-4">
        {DELIVERABLE_DEFS.map((def) => {
          const item = deliverables[def.key];
          return (
            <div key={def.key} className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-surface-100">{def.label}</p>
                {item.status !== 'none' ? (
                  <span className="text-xs text-primary-400 capitalize">{item.status}</span>
                ) : null}
              </div>

              <label className="block">
                <span className="sr-only">Upload {def.label}</span>
                <input
                  type="file"
                  onChange={(e) => onFile(def.key, e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-text-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-500/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-400"
                />
              </label>

              {def.canAssign ? (
                <PersonSelect
                  value={item.personId ?? ''}
                  onChange={(v) => setDeliverables((p) => ({
                    ...p,
                    [def.key]: { ...p[def.key], status: 'assigned', personId: v },
                  }))}
                  people={people}
                  onInvite={() => openAssigner(def.label, 'Contributor', (r) => setDeliverables((p) => ({
                    ...p,
                    [def.key]: { ...p[def.key], status: 'invited', personId: r.personId },
                  })))}
                />
              ) : null}

              {def.canPaste ? (
                <textarea
                  value={item.lyricsText ?? ''}
                  onChange={(e) => setDeliverables((p) => ({
                    ...p,
                    [def.key]: { ...p[def.key], status: e.target.value ? 'uploaded' : p[def.key].status, lyricsText: e.target.value },
                  }))}
                  rows={3}
                  placeholder="Paste lyrics..."
                  className="block w-full rounded-xl border border-surface-700 bg-surface-950 px-3 py-2 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none resize-none"
                />
              ) : null}

              <button
                type="button"
                onClick={() => onDeferred(def.key)}
                className="text-xs text-text-400 hover:text-text-200"
              >
                Complete Later
              </button>
            </div>
          );
        })}
      </div>
      <Nav back={back} next={next} optional onLater={onLater} />
    </>
  );
}

function MetadataStep({
  isrc, setIsrc, language, setLanguage, genre, setGenre, subgenre, setSubgenre,
  explicit, setExplicit, label, setLabel, copyrightYear, setCopyrightYear,
  publishingYear, setPublishingYear, derivedDuration, back, next, onLater,
}: {
  isrc: string;
  setIsrc: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  genre: string;
  setGenre: (v: string) => void;
  subgenre: string;
  setSubgenre: (v: string) => void;
  explicit: string;
  setExplicit: (v: string) => void;
  label: string;
  setLabel: (v: string) => void;
  copyrightYear: string;
  setCopyrightYear: (v: string) => void;
  publishingYear: string;
  setPublishingYear: (v: string) => void;
  derivedDuration?: number;
  back: () => void;
  next: () => void;
  onLater: () => void;
}) {
  return (
    <>
      <div className="mt-8 space-y-3">
        <input type="text" value={isrc} onChange={(e) => setIsrc(e.target.value)} placeholder="ISRC"
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Language"
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre"
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        <input type="text" value={subgenre} onChange={(e) => setSubgenre(e.target.value)} placeholder="Subgenre"
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        <select value={explicit} onChange={(e) => setExplicit(e.target.value)}
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none">
          <option value="false">Not Explicit</option>
          <option value="true">Explicit</option>
        </select>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label"
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        <input type="text" value={copyrightYear} onChange={(e) => setCopyrightYear(e.target.value)} placeholder="Copyright Year"
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        <input type="text" value={publishingYear} onChange={(e) => setPublishingYear(e.target.value)} placeholder="Publishing Year"
          className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-900 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        {derivedDuration ? (
          <p className="text-xs text-text-500 text-center">Duration will be set to {Math.floor(derivedDuration / 60)}:{String(derivedDuration % 60).padStart(2, '0')} from uploaded audio.</p>
        ) : (
          <p className="text-xs text-text-500 text-center">Duration will be derived automatically once audio is uploaded.</p>
        )}
      </div>
      <Nav back={back} next={next} optional onLater={onLater} />
    </>
  );
}

function ReviewStep({
  title, version, recordingType, artists, primaryArtistId, featuredArtists,
  originalWorkTitle, originalWorkPrimaryArtistId,
  productionStage, mixingEngineer, masteringEngineer, people, credits, deliverables,
  isrc, language, genre, subgenre, explicit, label, copyrightYear, publishingYear, derivedDuration,
  sectionStatus, error, launching, back, onFinish,
}: {
  title: string;
  version: string;
  recordingType: RecordingType;
  artists: ArtistOption[];
  primaryArtistId: string;
  featuredArtists: RepeatableArtistEntry[];
  originalWorkTitle: string;
  originalWorkPrimaryArtistId: string;
  productionStage: ProductionStage;
  mixingEngineer: EngineerAssignment;
  masteringEngineer: EngineerAssignment;
  people: PersonOption[];
  credits: Record<CreditRoleKey, ContributorEntry[]>;
  deliverables: Record<DeliverableKey, DeliverableItem>;
  isrc: string;
  language: string;
  genre: string;
  subgenre: string;
  explicit: string;
  label: string;
  copyrightYear: string;
  publishingYear: string;
  derivedDuration?: number;
  sectionStatus: SectionStatusMap;
  error: string;
  launching: boolean;
  back: () => void;
  onFinish: () => void;
}) {
  const creditCount = Object.values(credits).reduce((n, arr) => n + arr.length, 0);
  const deliverableCount = Object.values(deliverables).filter((d) => d.status !== 'none').length;
  const metadataFilled = Boolean(isrc || language || genre || subgenre || label);
  const originalWorkPrimaryName = artists.find((a) => a.id === originalWorkPrimaryArtistId)?.name;

  const sections: { key: string; label: string; value: string; status: SectionStatus }[] = [
    {
      key: 'basics',
      label: 'Track',
      value: `${title}${version ? ` (${version})` : ''}`,
      status: title.trim() ? 'complete' : 'incomplete',
    },
    {
      key: 'recording',
      label: 'Recording Type',
      value: recordingTypeLabel(recordingType),
      status: sectionStatus.recording ?? 'complete',
    },
    ...(recordingType === 'remix'
      ? [{
          key: 'original-work',
          label: 'Original Work',
          value: [originalWorkTitle.trim() || null, originalWorkPrimaryName || null].filter(Boolean).join(' · ') || '—',
          status: (originalWorkTitle.trim() && originalWorkPrimaryArtistId.trim()
            ? 'complete'
            : 'incomplete') as SectionStatus,
        }]
      : []),
    {
      key: 'artists',
      label: 'Artists',
      value: [
            artists.find((a) => a.id === primaryArtistId)?.name,
            ...featuredArtists.map((e) => artists.find((a) => a.id === e.artistId)?.name),
          ].filter(Boolean).join(' · ') || '—',
      status: 'complete',
    },
    {
      key: 'production',
      label: 'Production Status',
      value: PRODUCTION_STAGES.find((s) => s.value === productionStage)?.label ?? productionStage,
      status: sectionStatus.production ?? (needsMixing(productionStage) && !mixingEngineer.personId ? 'incomplete' : 'complete'),
    },
    {
      key: 'engineers',
      label: 'Assigned Engineers',
      value: [
        mixingEngineer.personId ? people.find((p) => p.id === mixingEngineer.personId)?.displayName : null,
        masteringEngineer.personId ? people.find((p) => p.id === masteringEngineer.personId)?.displayName : null,
      ].filter(Boolean).join(' · ') || '—',
      status: sectionStatus.production ?? 'incomplete',
    },
    {
      key: 'deliverables',
      label: 'Deliverables',
      value: `${deliverableCount} configured`,
      status: sectionStatus.deliverables ?? (deliverableCount > 0 ? 'complete' : 'incomplete'),
    },
    {
      key: 'metadata',
      label: 'Metadata',
      value: [isrc, genre, language, explicit === 'true' ? 'Explicit' : null].filter(Boolean).join(' · ') || '—',
      status: sectionStatus.metadata ?? (metadataFilled ? 'complete' : 'incomplete'),
    },
    {
      key: 'credits',
      label: 'Credits',
      value: `${creditCount} contributor${creditCount === 1 ? '' : 's'}`,
      status: sectionStatus.credits ?? (creditCount > 0 ? 'complete' : 'incomplete'),
    },
  ];

  return (
    <>
      <p className="mt-2 text-sm text-text-400 text-center">Everything look right?</p>
      <div className="mt-8 rounded-xl border border-surface-700 bg-surface-900 divide-y divide-surface-800">
        {sections.map((s) => (
          <div key={s.key} className="flex justify-between items-start gap-4 px-5 py-3.5">
            <div className="min-w-0">
              <span className="text-sm text-text-400 block">{s.label}</span>
              <span className="text-sm font-medium text-surface-100 block truncate">{s.value}</span>
            </div>
            <SectionStatusBadge status={s.status} />
          </div>
        ))}
        {derivedDuration ? (
          <div className="flex justify-between px-5 py-3.5">
            <span className="text-sm text-text-400">Duration</span>
            <span className="text-sm font-medium text-surface-100">{Math.floor(derivedDuration / 60)}:{String(derivedDuration % 60).padStart(2, '0')} (from audio)</span>
          </div>
        ) : null}
        {subgenre || label || copyrightYear || publishingYear ? (
          <div className="flex justify-between px-5 py-3.5">
            <span className="text-sm text-text-400">Additional Metadata</span>
            <span className="text-sm font-medium text-surface-100 text-right">
              {[subgenre, label, copyrightYear, publishingYear].filter(Boolean).join(' · ')}
            </span>
          </div>
        ) : null}
      </div>
      {error ? <p className="mt-4 text-sm text-danger-400 text-center">{error}</p> : null}
      <div className="flex items-center gap-3 mt-8">
        <Btn label="Back" onClick={back} secondary />
        <Btn label={launching ? 'Creating...' : 'Create Track'} onClick={onFinish} disabled={launching || !title.trim()} />
      </div>
    </>
  );
}