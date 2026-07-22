'use client';

import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useArtists } from '@/hooks/useArtist';
import { getPeopleByOrg } from '@/lib/people-repository';
import { createReleaseWithFullWorkflow, fetchRelease, editRelease, validateReleaseLink, saveReleaseDraft, createNewReleaseDraft, finalizeDraft, addWorkflowToRelease } from '@/lib/release-service';
import { createNewTrack } from '@/lib/track-service';
import { getStageTemplatesForReleaseType } from '@/lib/workflow-templates';
import { getRequirementNamesForReleaseType } from '@/lib/requirement-templates';
import { getLabelsByOrganization } from '@/lib/label-repository';
import { invitePerson } from '@/lib/invitation-service';
import { uploadArtwork, getArtworkByRelease, removeArtwork, replaceArtwork } from '@/lib/artwork/artwork-service';
import type { Artwork } from '@/lib/artwork/artwork-types';
import type { UploadState } from '@/components/release/ReleaseArtwork';
import { toast } from '@/stores/toast-store';
import type { LabelOption } from '@/components/label-field-picker';
import type { ReleaseRecord } from '@/lib/release-repository';
import type { ReleaseTypeVal, WizardTrack, PersonOption, SocialRow, SectionStatusMap, AssignerField, InviteTarget, WizardDraftData } from './release-wizard-types';
import { createEmptyTrack, normalizeWizardTrack } from './release-wizard-types';

export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'conflict';

function dirty<T>(setHasUnsavedChanges: Dispatch<SetStateAction<boolean>>, setter: Dispatch<SetStateAction<T>>, value: SetStateAction<T>) {
  setHasUnsavedChanges(true);
  setter(value);
}

export function useReleaseWizard({ mode = 'create', releaseId: editReleaseId, draftId: resumeDraftId }: { mode?: 'create' | 'edit'; releaseId?: string; draftId?: string } = {}) {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const { artistOptions: artists, onArtistCreated } = useArtists();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveVersion, setSaveVersion] = useState(0);
  const [offlineQueue, setOfflineQueue] = useState<Array<{ data: WizardDraftData; version: number }>>([]);
  const [conflictData, setConflictData] = useState<{ server: WizardDraftData; local: WizardDraftData } | null>(null);

  const [releaseType, setReleaseType] = useState<ReleaseTypeVal>('single');
  const [releaseTitle, setReleaseTitle] = useState('');
  const [releaseLink, setReleaseLink] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [targetReleaseDate, setTargetReleaseDate] = useState('');
  const [estimatedReleaseDate, setEstimatedReleaseDate] = useState('');
  const [labelOptions, setLabelOptions] = useState<LabelOption[]>([]);
  const [orgName, setOrgName] = useState('');

  const [hasArtwork, setHasArtwork] = useState<boolean | null>(null);
  const [commissionArtwork, setCommissionArtwork] = useState<boolean | null>(null);
  const [artworkDesigner, setArtworkDesigner] = useState('');
  // BUILD-010 — wizard artwork step only (persisted via existing artwork service on release/draft id)
  const [wizardArtwork, setWizardArtwork] = useState<Artwork | null>(null);
  const [artworkUploadState, setArtworkUploadState] = useState<UploadState>('idle');
  const [artworkFileName, setArtworkFileName] = useState<string | null>(null);
  const [artworkRemoving, setArtworkRemoving] = useState(false);

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

  const [sectionStatus, setSectionStatus] = useState<SectionStatusMap>({});
  void (setSectionStatus as unknown);

  const [loadingEdit, setLoadingEdit] = useState(mode === 'edit');
  const [editForbidden, setEditForbidden] = useState(false);

  const currentDraftId = useRef<string | undefined>(resumeDraftId);
  /** BUILD-010A: single-flight draft create — prevents a second Release when upload/save race. */
  const draftCreateInFlight = useRef<Promise<string | null> | null>(null);
  const wizardArtworkRef = useRef<Artwork | null>(null);
  wizardArtworkRef.current = wizardArtwork;
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedData = useRef<string>('');
  const isOnline = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const previousStep = useRef(step);

  function openAssigner(label: string, role: string, trackId: string, field: AssignerField, cb?: (r: { personId?: string }) => void) {
    setAssignerLabel(label); setAssignerRole(role); setAssignerTrackId(trackId); setAssignerField(field);
    assignerCallback.current = cb || null;
    setAssignerOpen(true);
  }

  useEffect(() => {
    if (!user) { router.push('/sign-in'); return; }
    if (activeOrgId) {
      getPeopleByOrg(activeOrgId).then((p) => setPeople(p.map((x) => ({ id: x.id, displayName: x.displayName }))));
      getLabelsByOrganization(activeOrgId).then((labels) => {
        setLabelOptions(labels.map((l) => ({ id: l.id, name: l.name })));
      });
    }
  }, [user, router, activeOrgId]);

  useEffect(() => {
    if (!activeOrgId) return;
    import('@/lib/organization-repository').then(({ getOrganization }) => {
      getOrganization(activeOrgId).then((org) => {
        if (org) setOrgName(org.name);
      });
    });
  }, [activeOrgId]);

  // Edit mode: fetch release data and pre-populate
  useEffect(() => {
    if (mode !== 'edit' || !editReleaseId) return;
    async function load() {
      const data = await fetchRelease(editReleaseId!);
      if (!data) { setLoadingEdit(false); return; }
      if (activeOrgId && data.organizationId && data.organizationId !== activeOrgId) {
        setEditForbidden(true);
        setLoadingEdit(false);
        return;
      }
      setReleaseTitle(data.title ?? '');
      setReleaseType((data.releaseType as ReleaseTypeVal) ?? 'single');
      setReleaseLink(data.releaseLink ?? '');
      if (data.targetReleaseDate) {
        const d = (data.targetReleaseDate as { toDate?: () => Date; seconds?: number }).toDate
          ? (data.targetReleaseDate as { toDate: () => Date }).toDate()
          : new Date((data.targetReleaseDate as { seconds: number }).seconds * 1000);
        setTargetReleaseDate(d.toISOString().split('T')[0] ?? '');
      }
      if (data.estimatedReleaseDate) {
        const d = (data.estimatedReleaseDate as { toDate?: () => Date; seconds?: number }).toDate
          ? (data.estimatedReleaseDate as { toDate: () => Date }).toDate()
          : new Date((data.estimatedReleaseDate as { seconds: number }).seconds * 1000);
        setEstimatedReleaseDate(d.toISOString().split('T')[0] ?? '');
      }
      setUpc(data.upc ?? '');
      setCatalogueNumber(data.catalogNumber ?? '');
      setRecordLabel(data.label ?? '');
      setCopyrightOwner(data.copyright ?? '');
      setPrimaryGenre(data.genre ?? '');
      setSecondaryGenre(data.subgenre ?? '');
      setLanguage(data.language ?? '');
      setLoadingEdit(false);
    }
    load();
  }, [mode, editReleaseId, activeOrgId]);

  // Draft resume mode: hydrate from persisted draft data
  useEffect(() => {
    if (mode !== 'create' || !resumeDraftId) return;
    // BUG-009: always bind resume id so Continue updates the same draft (never creates a new one).
    currentDraftId.current = resumeDraftId;
    async function load() {
      if (!resumeDraftId) return;
      setLoadingEdit(true);
      const data = await fetchRelease(resumeDraftId);
      if (!data || !data.wizardData) { setLoadingEdit(false); return; }
      const wd = data.wizardData as unknown as WizardDraftData;
      setReleaseTitle(wd.releaseTitle ?? '');
      setReleaseType(wd.releaseType ?? 'single');
      setReleaseLink(wd.releaseLink ?? '');
      setReleaseNotes(wd.releaseNotes ?? '');
      setTargetReleaseDate(wd.targetReleaseDate ?? '');
      setEstimatedReleaseDate(wd.estimatedReleaseDate ?? '');
      setHasArtwork(wd.hasArtwork ?? null);
      setCommissionArtwork(wd.commissionArtwork ?? null);
      setArtworkDesigner(wd.artworkDesigner ?? '');
      setTracks(
        (wd.tracks ?? [createEmptyTrack('1')]).map((t) =>
          normalizeWizardTrack(t as Parameters<typeof normalizeWizardTrack>[0]),
        ),
      );
      setPromoAssets(wd.promoAssets ?? []);
      setAssetDesigners(wd.assetDesigners ?? {});
      setSocialRows(wd.socialRows ?? []);
      setHasEmail(wd.hasEmail ?? null);
      setEmailSubject(wd.emailSubject ?? '');
      setEmailPreviewText(wd.emailPreviewText ?? '');
      setEmailBody(wd.emailBody ?? '');
      setEmailCampaignManager(wd.emailCampaignManager ?? '');
      setEmailSendDate(wd.emailSendDate ?? '');
      setEmailSendTime(wd.emailSendTime ?? '');
      setEmailTimezone(wd.emailTimezone ?? '');
      setPrimaryArtist(wd.primaryArtist ?? '');
      setFeaturedArtists(wd.featuredArtists ?? []);
      setRecordLabel(wd.recordLabel ?? '');
      setCatalogueNumber(wd.catalogueNumber ?? '');
      setUpc(wd.upc ?? '');
      setPrimaryGenre(wd.primaryGenre ?? '');
      setSecondaryGenre(wd.secondaryGenre ?? '');
      setLanguage(wd.language ?? '');
      setCopyrightOwner(wd.copyrightOwner ?? '');
      setCopyrightYear(wd.copyrightYear ?? String(new Date().getFullYear()));
      setReleaseOwner(wd.releaseOwner ?? '');
      setInviteName(wd.inviteName ?? '');
      setInviteEmail(wd.inviteEmail ?? '');
      setInviteRole(wd.inviteRole ?? '');
      setShowInviteForm(wd.showInviteForm ?? false);
      setInviteTarget(wd.inviteTarget ?? null);
      if (typeof wd.currentStep === 'number') setStep(wd.currentStep);
      if (data.version !== undefined) setSaveVersion(data.version);
      setLoadingEdit(false);
    }
    load();
  }, [mode, resumeDraftId]);

  // BUILD-010: load existing release artwork for draft resume / edit (artwork is not in wizardData).
  useEffect(() => {
    const releaseId = mode === 'edit' ? editReleaseId : resumeDraftId;
    if (!activeOrgId || !releaseId) return;
    let cancelled = false;
    void getArtworkByRelease(activeOrgId, releaseId).then((art) => {
      if (cancelled || !art) return;
      setWizardArtwork(art);
      setArtworkUploadState('complete');
      setArtworkFileName(null);
    });
    return () => { cancelled = true; };
  }, [mode, editReleaseId, resumeDraftId, activeOrgId]);

  // Track online status
  useEffect(() => {
    const goOnline = () => { isOnline.current = true; processOfflineQueue(); };
    const goOffline = () => { isOnline.current = false; setSaveState('offline'); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Process offline queue when back online
  async function processOfflineQueue() {
    if (offlineQueue.length === 0 || !user || !activeOrgId) return;
    const queue = [...offlineQueue];
    setOfflineQueue([]);
    for (const item of queue) {
      try {
        if (currentDraftId.current) {
          await saveReleaseDraft(currentDraftId.current, item.data as unknown as Record<string, unknown>, user.uid, item.version);
        }
        setSaveState('saved');
        setLastSavedAt(new Date());
      } catch {
        setOfflineQueue((p) => [...p, item]);
        setSaveState('offline');
        break;
      }
    }
  }

  // Auto-save on dirty state changes (debounced)
  useEffect(() => {
    if (!hasUnsavedChanges || mode !== 'create') return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      triggerAutoSave();
    }, 30000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [hasUnsavedChanges, step, tracks, promoAssets, socialRows, hasArtwork, mode]);

  // Auto-save on step change
  useEffect(() => {
    if (mode !== 'create' || !hasUnsavedChanges || !currentDraftId.current) return;
    if (previousStep.current === step) return;
    previousStep.current = step;
    triggerAutoSave();
  }, [step]);

  // Auto-save on visibility change
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges && mode === 'create') {
        triggerAutoSave(true);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [hasUnsavedChanges, mode]);

  // Auto-save on beforeunload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && mode === 'create') {
        triggerAutoSave(true);
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges, mode]);

  function serializeWizardState(): { data: WizardDraftData; raw: string } {
    const data: WizardDraftData = {
      currentStep: step,
      releaseType,
      releaseTitle,
      releaseLink,
      releaseNotes,
      targetReleaseDate,
      estimatedReleaseDate,
      hasArtwork,
      commissionArtwork,
      artworkDesigner,
      tracks,
      promoAssets,
      assetDesigners,
      socialRows,
      hasEmail,
      emailSubject,
      emailPreviewText,
      emailBody,
      emailCampaignManager,
      emailSendDate,
      emailSendTime,
      emailTimezone,
      primaryArtist,
      featuredArtists,
      recordLabel,
      catalogueNumber,
      upc,
      primaryGenre,
      secondaryGenre,
      language,
      copyrightOwner,
      copyrightYear,
      releaseOwner,
      inviteName,
      inviteEmail,
      inviteRole,
      showInviteForm,
      inviteTarget: inviteTarget ?? null,
    };
    return { data, raw: JSON.stringify(data) };
  }

  function calculateCompletionPercentage(): number {
    let completed = 0;
    const total = 7;
    if (releaseTitle.trim()) completed++;
    if (hasArtwork !== null || commissionArtwork !== null) completed++;
    if (tracks.some((t) => t.title.trim())) completed++;
    if (primaryArtist || featuredArtists.length > 0) completed++;
    if (recordLabel || upc || primaryGenre) completed++;
    if (promoAssets.length > 0 || socialRows.some((r) => r.url)) completed++;
    if (hasEmail !== null) completed++;
    return Math.round((completed / total) * 100);
  }

  /**
   * BUILD-010A — create at most one draft for this wizard session.
   * Shared by Save Draft, auto-save, and artwork upload so concurrent paths
   * cannot mint a second Release document.
   * On first create: writes wizard snapshot and bumps local saveVersion once.
   */
  async function ensureSingleDraftId(): Promise<string | null> {
    if (mode === 'edit' && editReleaseId) return editReleaseId;
    if (currentDraftId.current) return currentDraftId.current;
    if (draftCreateInFlight.current) return draftCreateInFlight.current;
    if (!user || !activeOrgId || !releaseTitle.trim()) return null;

    draftCreateInFlight.current = (async () => {
      try {
        if (currentDraftId.current) return currentDraftId.current;
        const rt = releaseType as 'single' | 'ep' | 'album';
        const labelValue = recordLabel === '__org__'
          ? (orgName || undefined)
          : (recordLabel ? (labelOptions.find((l) => l.id === recordLabel)?.name || recordLabel) : undefined);
        const fields = {
          title: releaseTitle,
          releaseType: rt,
          status: 'planning' as const,
          lifecycle: 'draft' as const,
          organizationId: activeOrgId,
          createdBy: user.uid,
          targetReleaseDate: targetReleaseDate ? new Date(targetReleaseDate) : null,
          estimatedReleaseDate: estimatedReleaseDate ? new Date(estimatedReleaseDate) : null,
          label: labelValue,
          releaseLink: releaseLink.trim() || null,
        };
        const snapshot = serializeWizardState();
        const id = await createNewReleaseDraft(
          fields,
          snapshot.data as unknown as Record<string, unknown>,
          user.uid,
        );
        currentDraftId.current = id;
        lastSavedData.current = snapshot.raw;
        setSaveVersion((v) => v + 1);
        setHasUnsavedChanges(false);
        setSaveState('saved');
        setLastSavedAt(new Date());
        return id;
      } catch {
        return null;
      } finally {
        draftCreateInFlight.current = null;
      }
    })();

    return draftCreateInFlight.current;
  }

  async function triggerAutoSave(isBestEffort = false) {
    if (!user || !activeOrgId || savingDraft) return;
    if (!releaseTitle.trim()) return;
    const snapshot = serializeWizardState();
    if (snapshot.raw === lastSavedData.current && currentDraftId.current) return;
    setSaveState('saving');
    try {
      if (currentDraftId.current) {
        await saveReleaseDraft(currentDraftId.current, snapshot.data as unknown as Record<string, unknown>, user.uid, saveVersion);
        lastSavedData.current = snapshot.raw;
        setSaveVersion((v) => v + 1);
      } else {
        // BUILD-010A: single-flight create (shared with artwork upload).
        const id = await ensureSingleDraftId();
        if (!id) throw new Error('Could not create draft');
        if (snapshot.raw !== lastSavedData.current) {
          await saveReleaseDraft(id, snapshot.data as unknown as Record<string, unknown>, user.uid, saveVersion);
          lastSavedData.current = snapshot.raw;
          setSaveVersion((v) => v + 1);
        }
      }
      setHasUnsavedChanges(false);
      setSaveState('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      if (isBestEffort || !isOnline.current) {
        setOfflineQueue((p) => [...p, { data: snapshot.data, version: saveVersion }]);
        setSaveState('offline');
      } else if ((err as Error).message?.includes('updated elsewhere')) {
        setSaveState('conflict');
        setConflictData({ server: {} as WizardDraftData, local: snapshot.data });
      } else {
        setSaveState('idle');
      }
    }
  }

  async function saveDraft() {
    // BUG-009B: never silently no-op — user must know why draft is not discoverable.
    if (!user) {
      setError('You must be signed in to save a draft.');
      return;
    }
    if (!activeOrgId) {
      setError('Select an organisation before saving a draft.');
      return;
    }
    if (!releaseTitle.trim()) {
      setError('Release title is required to save a draft.');
      return;
    }
    setSavingDraft(true);
    setError('');
    setSaveState('saving');

    const snapshot = serializeWizardState();

    try {
      if (currentDraftId.current) {
        await saveReleaseDraft(currentDraftId.current, snapshot.data as unknown as Record<string, unknown>, user.uid, saveVersion);
        lastSavedData.current = snapshot.raw;
        setSaveVersion((v) => v + 1);
      } else {
        // BUILD-010A: create once (or wait for in-flight artwork/auto-save create).
        const id = await ensureSingleDraftId();
        if (!id) throw new Error('Could not create draft');
        if (snapshot.raw !== lastSavedData.current) {
          await saveReleaseDraft(id, snapshot.data as unknown as Record<string, unknown>, user.uid, saveVersion);
          lastSavedData.current = snapshot.raw;
          setSaveVersion((v) => v + 1);
        }
      }
      setHasUnsavedChanges(false);
      setSaveState('saved');
      setLastSavedAt(new Date());
      toast.success('Draft saved successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      if ((err as Error).message?.includes('updated elsewhere')) {
        setSaveState('conflict');
      } else if (!isOnline.current) {
        setOfflineQueue((p) => [...p, { data: snapshot.data, version: saveVersion }]);
        setSaveState('offline');
      } else {
        setSaveState('idle');
      }
    } finally {
      setSavingDraft(false);
    }
  }

  /** BUILD-010: resolve release/draft id for artwork upload (create draft if needed). */
  async function resolveArtworkReleaseId(): Promise<string | null> {
    if (mode === 'edit' && editReleaseId) return editReleaseId;
    if (currentDraftId.current) return currentDraftId.current;
    if (!user || !activeOrgId) {
      toast.error('Cannot upload artwork', 'You must be signed in to an organisation.');
      return null;
    }
    if (!releaseTitle.trim()) {
      toast.error('Cannot upload artwork', 'Release title is required before uploading artwork.');
      return null;
    }
    // BUILD-010A: single-flight — never creates a second Release if one already exists / is creating.
    const id = await ensureSingleDraftId();
    if (!id) {
      toast.error('Cannot upload artwork', 'Could not create draft for artwork upload.');
      return null;
    }
    return id;
  }

  async function handleArtworkUpload(file: File) {
    if (!user || !activeOrgId) {
      toast.error('Cannot upload artwork', 'You must be signed in to an organisation.');
      setArtworkUploadState('idle');
      return;
    }
    setArtworkUploadState('uploading');
    setArtworkFileName(file.name);
    try {
      const releaseId = await resolveArtworkReleaseId();
      if (!releaseId) {
        setArtworkUploadState('idle');
        return;
      }
      // BUILD-010A: replace updates the same artwork doc (no second Release, no orphan).
      const existing = wizardArtworkRef.current;
      if (existing) {
        const replaced = await replaceArtwork(existing.id, file, activeOrgId, user.uid);
        if ('error' in replaced) {
          throw new Error(replaced.error);
        }
        const refreshed = await getArtworkByRelease(activeOrgId, releaseId);
        if (!refreshed) {
          throw new Error('Artwork not found after replace');
        }
        if (refreshed.releaseId !== releaseId) {
          throw new Error('Artwork release identity mismatch after replace');
        }
        setWizardArtwork(refreshed);
      } else {
        const result = await uploadArtwork(file, releaseId, activeOrgId, user.uid);
        if (result.releaseId !== releaseId) {
          throw new Error('Artwork release identity mismatch after upload');
        }
        setWizardArtwork(result);
      }
      setArtworkUploadState('complete');
      toast.success('Artwork uploaded successfully.');
    } catch (err) {
      setArtworkUploadState('idle');
      toast.error('Artwork upload failed', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  async function handleArtworkRemove() {
    if (!wizardArtwork || !user || !activeOrgId) return;
    const releaseIdBefore = wizardArtwork.releaseId;
    setArtworkRemoving(true);
    try {
      const result = await removeArtwork(wizardArtwork.id, activeOrgId, user.uid);
      if ('error' in result) {
        toast.error('Could not remove artwork', result.error);
        return;
      }
      // BUILD-010A: release identity must remain; only artwork is cleared.
      if (currentDraftId.current && releaseIdBefore && currentDraftId.current !== releaseIdBefore && mode !== 'edit') {
        console.error('[BUILD-010A] release identity drift on remove', {
          draftId: currentDraftId.current,
          artworkReleaseId: releaseIdBefore,
        });
      }
      setWizardArtwork(null);
      setArtworkFileName(null);
      setArtworkUploadState('idle');
      toast.success('Artwork removed.');
    } catch (err) {
      toast.error(
        'Could not remove artwork',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setArtworkRemoving(false);
    }
  }

  async function handleConflictReload() {
    if (!conflictData || !currentDraftId.current || !user) return;
    try {
      await saveReleaseDraft(currentDraftId.current, conflictData.local as unknown as Record<string, unknown>, user.uid, saveVersion);
      setSaveState('saved');
      setLastSavedAt(new Date());
      setConflictData(null);
      setHasUnsavedChanges(false);
    } catch {
      setError('Could not resolve conflict. Please try again.');
    }
  }

  function handleConflictDiscard() {
    setConflictData(null);
    setSaveState('idle');
  }

  async function handleLaunch() {
    if (!user || !activeOrgId || !releaseTitle.trim()) return;
    if (!validateRemixTracks()) return;
    const linkError = validateReleaseLink(releaseLink);
    if (linkError) { setError(linkError); return; }
    setLaunching(true); setError('');

    const trimmedReleaseLink = releaseLink.trim() || null;

    if (mode === 'edit' && editReleaseId) {
      try {
        await editRelease(editReleaseId, {
          title: releaseTitle,
          releaseType: releaseType as ReleaseRecord['releaseType'],
          targetReleaseDate: targetReleaseDate ? new Date(targetReleaseDate) : null,
          estimatedReleaseDate: estimatedReleaseDate ? new Date(estimatedReleaseDate) : null,
          upc: upc || null,
          catalogNumber: catalogueNumber || null,
          label: recordLabel || null,
          copyright: copyrightOwner || null,
          genre: primaryGenre || null,
          subgenre: secondaryGenre || null,
          language: language || null,
          releaseLink: trimmedReleaseLink,
        }, user.uid);
        router.push(`/releases/${editReleaseId}`);
      } catch (err) {
        setError((err as Error).message);
        setLaunching(false);
      }
      return;
    }

    // Create mode — supports both fresh creation and draft finalization
    const releaseIdToUse = currentDraftId.current ?? editReleaseId;
    try {
      const rt = releaseType as 'single' | 'ep' | 'album';
      const labelValue = recordLabel === '__org__' ? (orgName || undefined) : (recordLabel ? (labelOptions.find((l) => l.id === recordLabel)?.name || recordLabel) : undefined);

      if (releaseIdToUse) {
        await editRelease(releaseIdToUse, {
          title: releaseTitle,
          releaseType: rt,
          targetReleaseDate: targetReleaseDate ? new Date(targetReleaseDate) : null,
          estimatedReleaseDate: estimatedReleaseDate ? new Date(estimatedReleaseDate) : null,
          upc: upc || null,
          catalogNumber: catalogueNumber || null,
          label: labelValue || null,
          copyright: copyrightOwner || null,
          genre: primaryGenre || null,
          subgenre: secondaryGenre || null,
          language: language || null,
          releaseLink: trimmedReleaseLink,
        }, user.uid);
        await finalizeDraft(releaseIdToUse, user.uid);
        await addWorkflowToRelease(releaseIdToUse, getStageTemplatesForReleaseType(rt), getRequirementNamesForReleaseType(rt), user.uid);
      } else {
        const { releaseId: newId } = await createReleaseWithFullWorkflow(
          { title: releaseTitle, releaseType: rt, status: 'planning', lifecycle: 'active', organizationId: activeOrgId, createdBy: user.uid, targetReleaseDate: targetReleaseDate ? new Date(targetReleaseDate) : null, estimatedReleaseDate: estimatedReleaseDate ? new Date(estimatedReleaseDate) : null, label: labelValue, releaseLink: trimmedReleaseLink },
          getStageTemplatesForReleaseType(rt), getRequirementNamesForReleaseType(rt), user.uid,
        );
        currentDraftId.current = newId;
      }

      const finalReleaseId = currentDraftId.current!;
      const validTracks = tracks.filter((t) => t.title.trim());
      if (validTracks.length > 0) {
        const { addArtistToTrack } = await import('@/lib/track-artist-repository');
        for (let i = 0; i < validTracks.length; i++) {
          const t = validTracks[i]!;
          const trackTitle = t.recordingType === 'remix' && t.displayTitle.trim()
            ? t.displayTitle.trim()
            : t.title.trim();
          // BUILD-011C — same bindings as standalone TrackEditor /tracks/new
          const recordingPrimaryId = t.primaryArtistId || null;
          const featuredIds = t.featuredArtists.map((e) => e.artistId).filter(Boolean);
          const trackId = await createNewTrack({
            releaseId: finalReleaseId,
            position: i + 1,
            title: trackTitle,
            organizationId: activeOrgId,
            createdBy: user.uid,
            version: t.version.trim() || undefined,
            recordingType: t.recordingType,
            originalArtistId: null,
            remixerArtistId: null,
            primaryArtistId: recordingPrimaryId,
            originalArtistIds: recordingPrimaryId ? [recordingPrimaryId] : [],
            featuredArtistIds: featuredIds,
            remixArtistIds: [],
            originalWork:
              t.recordingType === 'remix'
                ? {
                    title: t.originalWorkTitle.trim(),
                    primaryArtistId: t.originalWorkPrimaryArtistId,
                    featuredArtistIds: t.originalWorkFeaturedArtists
                      .map((e) => e.artistId)
                      .filter(Boolean),
                  }
                : null,
            displayTitle: t.displayTitle.trim() || null,
            displayTitleEdited: t.displayTitleEdited,
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
          for (let idx = 0; idx < t.featuredArtists.length; idx++) {
            const entry = t.featuredArtists[idx]!;
            if (entry.artistId) {
              await addArtistToTrack({
                trackId,
                artistId: entry.artistId,
                role: 'FEATURED_ARTIST',
                position: idx + 1,
              });
            }
          }
        }
      }
      router.push(`/releases/${finalReleaseId}`);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      setLaunching(false);
    }
  }

  const STEPS = ['type', 'details', 'artwork', 'tracks', 'release_info', 'promotion', 'email', 'review'];
  const totalSteps = STEPS.length;
  const currentStepKey = STEPS[step];

  function next() { if (step < totalSteps - 1) setStep(step + 1); }
  function back() { if (step > 0) setStep(step - 1); }
  function later(section: string) { setSectionStatus((p) => ({ ...p, [section]: 'skipped' })); }

  function addTrack() { setTracks((p) => [...p, createEmptyTrack()]); }

  /** TrackEditor drives field UI; wizard only merges patches into tracks[]. */
  function updateTrackFields(id: string, patch: Partial<WizardTrack>) {
    setHasUnsavedChanges(true);
    setTracks((p) =>
      p.map((t) => {
        if (t.id !== id) return t;
        return { ...t, ...patch, remixErrors: patch.remixErrors ?? t.remixErrors };
      }),
    );
  }

  function removeTrack(id: string) { if (tracks.length > 1) setTracks((p) => p.filter((t) => t.id !== id)); }

  function validateRemixTracks(): boolean {
    let valid = true;
    setTracks((p) =>
      p.map((t) => {
        if (!t.title.trim() || t.recordingType !== 'remix') return t;
        const remixErrors: WizardTrack['remixErrors'] = {};
        // BUILD-011C — match Edit Track / TrackEditor messages
        if (!t.originalWorkTitle.trim()) {
          remixErrors.originalWorkTitle = 'Original Song Title is required for remix tracks.';
          valid = false;
        }
        if (!t.originalWorkPrimaryArtistId.trim()) {
          remixErrors.originalWorkPrimaryArtist =
            'Original Primary Artist is required for remix tracks.';
          valid = false;
        }
        return { ...t, remixErrors };
      }),
    );
    return valid;
  }

  function addSocialRow() { setSocialRows((p) => [...p, { id: String(Date.now()), platform: '', url: '', personId: '' }]); }
  function removeSocialRow(id: string) { setSocialRows((p) => p.filter((r) => r.id !== id)); }

  async function handleInvite() {
    if (!activeOrgId || !inviteName.trim() || !inviteEmail.trim()) return;
    await invitePerson({
      organizationId: activeOrgId,
      organizationName: orgName,
      inviteeName: inviteName.trim(),
      inviteeEmail: inviteEmail.trim(),
      platformRole: 'collaborator',
      professionalRole: '',
      invitedByUserId: user!.uid,
      invitedByName: user!.displayName || user!.email?.split('@')[0] || 'Administrator',
    });
    if (inviteTarget?.key) setAssetDesigners((p) => ({ ...p, [inviteTarget!.key!]: inviteEmail }));
    setShowInviteForm(false); setInviteName(''); setInviteEmail(''); setInviteRole(''); setInviteTarget(null);
  }

  const stepProps = {
    releaseType, setReleaseType: (v: SetStateAction<ReleaseTypeVal>) => dirty(setHasUnsavedChanges, setReleaseType, v),
    releaseTitle, setReleaseTitle: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setReleaseTitle, v),
    releaseLink, setReleaseLink: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setReleaseLink, v),
    releaseNotes, setReleaseNotes: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setReleaseNotes, v),
    targetReleaseDate, setTargetReleaseDate: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setTargetReleaseDate, v),
    estimatedReleaseDate, setEstimatedReleaseDate: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setEstimatedReleaseDate, v),
    hasArtwork, setHasArtwork: (v: SetStateAction<boolean | null>) => dirty(setHasUnsavedChanges, setHasArtwork, v),
    commissionArtwork, setCommissionArtwork: (v: SetStateAction<boolean | null>) => dirty(setHasUnsavedChanges, setCommissionArtwork, v),
    artworkDesigner, setArtworkDesigner: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setArtworkDesigner, v),
    wizardArtwork,
    artworkUploadState,
    setArtworkUploadState,
    artworkFileName,
    artworkRemoving,
    handleArtworkUpload,
    handleArtworkRemove,
    tracks,
    promoAssets, setPromoAssets: (v: SetStateAction<string[]>) => dirty(setHasUnsavedChanges, setPromoAssets, v),
    assetDesigners, setAssetDesigners: (v: SetStateAction<Record<string, string>>) => dirty(setHasUnsavedChanges, setAssetDesigners, v),
    socialRows, setSocialRows: (v: SetStateAction<SocialRow[]>) => dirty(setHasUnsavedChanges, setSocialRows, v),
    hasEmail, setHasEmail: (v: SetStateAction<boolean | null>) => dirty(setHasUnsavedChanges, setHasEmail, v),
    emailSubject, setEmailSubject: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setEmailSubject, v),
    emailPreviewText, setEmailPreviewText: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setEmailPreviewText, v),
    emailBody, setEmailBody: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setEmailBody, v),
    emailCampaignManager, setEmailCampaignManager: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setEmailCampaignManager, v),
    emailSendDate, setEmailSendDate: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setEmailSendDate, v),
    emailSendTime, setEmailSendTime: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setEmailSendTime, v),
    emailTimezone, setEmailTimezone: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setEmailTimezone, v),
    primaryArtist, setPrimaryArtist: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setPrimaryArtist, v),
    featuredArtists, setFeaturedArtists: (v: SetStateAction<string[]>) => dirty(setHasUnsavedChanges, setFeaturedArtists, v),
    recordLabel, setRecordLabel: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setRecordLabel, v),
    catalogueNumber, setCatalogueNumber: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setCatalogueNumber, v),
    upc, setUpc: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setUpc, v),
    primaryGenre, setPrimaryGenre: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setPrimaryGenre, v),
    secondaryGenre, setSecondaryGenre: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setSecondaryGenre, v),
    language, setLanguage: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setLanguage, v),
    copyrightOwner, setCopyrightOwner: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setCopyrightOwner, v),
    copyrightYear, setCopyrightYear: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setCopyrightYear, v),
    releaseOwner, setReleaseOwner: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setReleaseOwner, v),
    people,
    inviteName, setInviteName: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setInviteName, v),
    inviteEmail, setInviteEmail: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setInviteEmail, v),
    inviteRole, setInviteRole: (v: SetStateAction<string>) => dirty(setHasUnsavedChanges, setInviteRole, v),
    showInviteForm, setShowInviteForm: (v: SetStateAction<boolean>) => dirty(setHasUnsavedChanges, setShowInviteForm, v),
    inviteTarget, setInviteTarget: (v: SetStateAction<InviteTarget>) => dirty(setHasUnsavedChanges, setInviteTarget, v),
    artists,
    activeOrgId,
    labelOptions, setLabelOptions: (v: SetStateAction<LabelOption[]>) => dirty(setHasUnsavedChanges, setLabelOptions, v),
    orgName,
    onArtistCreated,
    sectionStatus, setSectionStatus,
    error,
    launching,
    handleInvite,
  };

  function onLabelCreated(label: LabelOption) {
    setLabelOptions((p) => p.some((x) => x.id === label.id) ? p : [...p, label]);
  }

  const handlers = {
    next,
    back,
    later,
    addTrack,
    updateTrackFields,
    removeTrack,
    validateRemixTracks,
    addSocialRow,
    removeSocialRow,
    openAssigner,
    handleLaunch,
    saveDraft,
    handleConflictReload,
    handleConflictDiscard,
    onLabelCreated,
  };

  return {
    user,
    activeOrgId,
    step,
    setStep,
    STEPS,
    totalSteps,
    currentStepKey,
    stepProps,
    handlers,
    labelOptions,
    assignerOpen,
    setAssignerOpen,
    assignerLabel,
    assignerRole,
    assignerTrackId,
    assignerField,
    assignerCallback,
    loadingEdit,
    editForbidden,
    mode,
    hasUnsavedChanges,
    savingDraft,
    draftId: currentDraftId.current,
    saveState,
    lastSavedAt,
    saveVersion,
    offlineQueue,
    conflictData,
    calculateCompletionPercentage,
  };
}
