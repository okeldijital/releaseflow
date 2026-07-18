'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrgStore } from '@/stores/org-store';
import { useArtists } from '@/hooks/useArtist';
import { getPeopleByOrg } from '@/lib/people-repository';
import { createReleaseWithFullWorkflow, fetchRelease, editRelease, validateReleaseLink } from '@/lib/release-service';
import { createNewTrack } from '@/lib/track-service';
import { getStageTemplatesForReleaseType } from '@/lib/workflow-templates';
import { getRequirementNamesForReleaseType } from '@/lib/requirement-templates';
import { getLabelsByOrganization } from '@/lib/label-repository';
import { invitePerson } from '@/lib/invitation-service';
import { suggestRemixDisplayTitle } from '@/lib/recording-type';
import type { LabelOption } from '@/components/label-field-picker';
import type { ReleaseRecord } from '@/lib/release-repository';
import type { ReleaseTypeVal, WizardTrack, PersonOption, SocialRow, SectionStatusMap, AssignerField, InviteTarget } from './release-wizard-types';
import { createEmptyTrack } from './release-wizard-types';

export function useReleaseWizard({ mode = 'create', releaseId: editReleaseId }: { mode?: 'create' | 'edit'; releaseId?: string } = {}) {
  const { user } = useAuth();
  const { activeOrgId } = useOrgStore();
  const { artistOptions: artists, onArtistCreated } = useArtists();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const [people, setPeople] = useState<PersonOption[]>([]);

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

  const STEPS = ['type', 'details', 'artwork', 'tracks', 'release_info', 'promotion', 'email', 'review'];
  const totalSteps = STEPS.length;
  const currentStepKey = STEPS[step];

  function next() { if (step < totalSteps - 1) setStep(step + 1); }
  function back() { if (step > 0) setStep(step - 1); }
  function later(section: string) { setSectionStatus((p) => ({ ...p, [section]: 'skipped' })); }

  function addTrack() { setTracks((p) => [...p, createEmptyTrack()]); }

  function updateTrack(id: string, f: string, v: string | boolean | string[] | { id: string; artistId: string }[]) {
    setTracks((p) => p.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, [f]: v, remixErrors: { ...t.remixErrors } };
      if (f === 'recordingType' && v === 'original') {
        next.remixErrors = {};
        next.displayTitle = '';
        next.displayTitleEdited = false;
      }
      if ((f === 'title' || f === 'remixArtists') && next.recordingType === 'remix' && !next.displayTitleEdited) {
        const remixNames = (f === 'remixArtists' ? (v as { id: string; artistId: string }[]) : next.remixArtists)
          .map((e) => artists.find((a) => a.id === e.artistId)?.name)
          .filter(Boolean);
        next.displayTitle = suggestRemixDisplayTitle(
          f === 'title' ? String(v) : next.title,
          remixNames[0] ?? '',
        );
      }
      if (f === 'displayTitle') {
        next.displayTitle = String(v);
        next.displayTitleEdited = true;
        return next;
      }
      if (f === 'originalArtists' || f === 'remixArtists') {
        delete next.remixErrors[f === 'originalArtists' ? 'originalArtists' : 'remixArtists'];
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
      if (t.originalArtists.length === 0) {
        remixErrors.originalArtists = 'At least one Original Artist is required for remix recordings.';
        valid = false;
      }
      if (t.remixArtists.length === 0) {
        remixErrors.remixArtists = 'At least one Remix Artist is required for remix recordings.';
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
    await invitePerson({
      organizationId: activeOrgId,
      organizationName: orgName,
      inviteeName: inviteName.trim(),
      inviteeEmail: inviteEmail.trim(),
      // DOM-001: invite with platform security role only.
      platformRole: 'collaborator',
      professionalRole: '',
      invitedByUserId: user!.uid,
      invitedByName: user!.displayName || user!.email?.split('@')[0] || 'Administrator',
    });
    if (inviteTarget?.key) setAssetDesigners((p) => ({ ...p, [inviteTarget!.key!]: inviteEmail }));
    setShowInviteForm(false); setInviteName(''); setInviteEmail(''); setInviteRole(''); setInviteTarget(null);
  }

  async function handleLaunch() {
    if (!user || !activeOrgId || !releaseTitle.trim()) return;
    if (!validateRemixTracks()) return;
    const linkError = validateReleaseLink(releaseLink);
    if (linkError) { setError(linkError); return; }
    setLaunching(true); setError('');

    const trimmedReleaseLink = releaseLink.trim() || null;

    if (mode === 'edit' && editReleaseId) {
      // Edit mode
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

    // Create mode
    try {
      const rt = releaseType as 'single' | 'ep' | 'album';
      const labelValue = recordLabel === '__org__' ? (orgName || undefined) : (recordLabel ? (labelOptions.find((l) => l.id === recordLabel)?.name || recordLabel) : undefined);
      const { releaseId } = await createReleaseWithFullWorkflow(
        { title: releaseTitle, releaseType: rt, status: 'planning', organizationId: activeOrgId, createdBy: user.uid, targetReleaseDate: targetReleaseDate ? new Date(targetReleaseDate) : null, estimatedReleaseDate: estimatedReleaseDate ? new Date(estimatedReleaseDate) : null, label: labelValue, releaseLink: trimmedReleaseLink },
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
            originalArtistId: t.recordingType === 'remix' ? (t.originalArtists[0]?.artistId ?? null) : null,
            remixerArtistId: t.recordingType === 'remix' ? (t.remixArtists[0]?.artistId ?? null) : null,
            primaryArtistId: t.recordingType === 'original' ? t.primaryArtistId || null : null,
            originalArtistIds: t.recordingType === 'remix'
              ? t.originalArtists.map((e) => e.artistId).filter(Boolean)
              : (t.primaryArtistId ? [t.primaryArtistId] : []),
            featuredArtistIds: t.featuredArtistIds,
            remixArtistIds: t.remixArtists.map((e) => e.artistId).filter(Boolean),
            displayTitle: t.displayTitle.trim() || null,
            displayTitleEdited: t.displayTitleEdited,
          });
          if (t.recordingType === 'remix') {
            for (let idx = 0; idx < t.originalArtists.length; idx++) {
              const entry = t.originalArtists[idx]!;
              if (entry.artistId) await addArtistToTrack({ trackId, artistId: entry.artistId, role: 'ORIGINAL_ARTIST', position: idx + 1 });
            }
            for (let idx = 0; idx < t.remixArtists.length; idx++) {
              const entry = t.remixArtists[idx]!;
              if (entry.artistId) await addArtistToTrack({ trackId, artistId: entry.artistId, role: 'REMIX_ARTIST', position: idx + 1 });
            }
          } else if (t.primaryArtistId) {
            await addArtistToTrack({ trackId, artistId: t.primaryArtistId, role: 'PRIMARY_ARTIST', position: 1, isPrimary: true });
          }
          // EPIC-202 — Featured Artists on original and remix
          for (let idx = 0; idx < t.featuredArtistIds.length; idx++) {
            const fid = t.featuredArtistIds[idx]!;
            if (fid) await addArtistToTrack({ trackId, artistId: fid, role: 'FEATURED_ARTIST', position: idx + 1 });
          }
        }
      }
      router.push(`/releases/${releaseId}`);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      setLaunching(false);
    }
  }

  const stepProps = {
    releaseType, setReleaseType,
    releaseTitle, setReleaseTitle,
    releaseLink, setReleaseLink,
    releaseNotes, setReleaseNotes,
    targetReleaseDate, setTargetReleaseDate,
    estimatedReleaseDate, setEstimatedReleaseDate,
    hasArtwork, setHasArtwork,
    commissionArtwork, setCommissionArtwork,
    artworkDesigner, setArtworkDesigner,
    tracks,
    promoAssets, setPromoAssets,
    assetDesigners, setAssetDesigners,
    socialRows, setSocialRows,
    hasEmail, setHasEmail,
    emailSubject, setEmailSubject,
    emailPreviewText, setEmailPreviewText,
    emailBody, setEmailBody,
    emailCampaignManager, setEmailCampaignManager,
    emailSendDate, setEmailSendDate,
    emailSendTime, setEmailSendTime,
    emailTimezone, setEmailTimezone,
    primaryArtist, setPrimaryArtist,
    featuredArtists, setFeaturedArtists,
    recordLabel, setRecordLabel,
    catalogueNumber, setCatalogueNumber,
    upc, setUpc,
    primaryGenre, setPrimaryGenre,
    secondaryGenre, setSecondaryGenre,
    language, setLanguage,
    copyrightOwner, setCopyrightOwner,
    copyrightYear, setCopyrightYear,
    releaseOwner, setReleaseOwner,
    people,
    inviteName, setInviteName,
    inviteEmail, setInviteEmail,
    inviteRole, setInviteRole,
    showInviteForm, setShowInviteForm,
    inviteTarget, setInviteTarget,
    artists,
    activeOrgId,
    labelOptions, setLabelOptions,
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
    updateTrack,
    removeTrack,
    addFeaturedArtist,
    removeFeaturedArtist,
    validateRemixTracks,
    addSocialRow,
    removeSocialRow,
    openAssigner,
    handleLaunch,
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
  };
}
