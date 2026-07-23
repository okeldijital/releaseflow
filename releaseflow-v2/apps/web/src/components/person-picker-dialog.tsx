'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchPeople, toPersonCardModels } from '@/lib/person-service';
import type { PersonCardModel } from '@/lib/person-card-model';
import { PersonCard } from '@/components/people/PersonCard';
import { invitePerson } from '@/lib/invitation-service';
import type { PlatformRole } from '@/lib/invitation-service';
import { getOrganization } from '@/lib/organization-repository';
import { createNewAssignment } from '@/lib/assignment-service';
import { toPersonOptions, filterPeopleForSearch, type PersonOption } from '@/lib/person-field-picker-logic';

export interface PersonPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectPerson?: (result: { personId: string; personName: string; role: string }) => void;
  onInvitePerson?: (result: { email: string; name: string; role: string }) => void;
  organizationId: string | null;
  currentUserId: string;
  contextLabel: string;
  contextRole: string;
  roles?: readonly string[];
}

export function PersonPickerDialog({
  open, onClose, onSelectPerson, onInvitePerson,
  organizationId, currentUserId, contextLabel, contextRole, roles,
}: PersonPickerDialogProps) {
  const [mode, setMode] = useState<'select' | 'invite'>('select');
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [personCards, setPersonCards] = useState<PersonCardModel[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<PersonOption | null>(null);
  const [selectedRole, setSelectedRole] = useState(contextRole);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const roleOptions = roles && roles.length > 0 ? roles : [contextRole];
  const filtered = filterPeopleForSearch(people, search);
  const filteredCards = useMemo(() => {
    const ids = new Set(filtered.map((p) => p.id));
    return personCards.filter((c) => ids.has(c.id));
  }, [personCards, filtered]);
  const showRoleSelector = selectedPerson !== null;
  const optionById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  useEffect(() => {
    if (open) {
      setMode('select');
      setSearch('');
      setSelectedPerson(null);
      setSelectedRole(contextRole);
      setInviteName('');
      setInviteEmail('');
      setSaving(false);
      setClosing(false);
      setActiveIndex(-1);
      if (organizationId) {
        setLoadingPeople(true);
        fetchPeople(organizationId)
          .then(async (records) => {
            const active = records.filter((r) => r.status !== 'archived');
            setPeople(toPersonOptions(active));
            setPersonCards(
              await toPersonCardModels(organizationId, active, {
                includeCounts: false,
              }),
            );
          })
          .finally(() => setLoadingPeople(false));
      }
    }
  }, [open, organizationId, contextRole]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [search]);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-person-index]');
      const target = items[activeIndex] as HTMLElement | undefined;
      target?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  function handleClose() {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  }

  function handleSelectPerson(person: PersonOption) {
    setSelectedPerson(person);
    setSelectedRole(contextRole);
  }

  function handleBackToSelect() {
    setSelectedPerson(null);
    setActiveIndex(-1);
  }

  async function handleSelectExisting() {
    if (!selectedPerson || !organizationId) return;
    setSaving(true);
    try {
      await createNewAssignment({
        organizationId,
        title: contextLabel,
        entityType: 'track',
        entityId: '',
        assigneeId: selectedPerson.id,
        assignerId: currentUserId,
        role: selectedRole,
      });
    } catch { /* best-effort */ }
    onSelectPerson?.({ personId: selectedPerson.id, personName: selectedPerson.name, role: selectedRole });
    handleClose();
    setSaving(false);
  }

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim() || !organizationId) return;
    setSaving(true);
    try {
      const org = await getOrganization(organizationId);
      await invitePerson({
        organizationId,
        organizationName: org?.name ?? '',
        inviteeName: inviteName.trim(),
        inviteeEmail: inviteEmail.trim(),
        // DOM-001: platform role for security; contribution role chosen at assignment time.
        platformRole: 'collaborator' as PlatformRole,
        professionalRole: '',
        invitedByUserId: currentUserId,
        invitedByName: 'Administrator',
      });
    } catch { /* best-effort */ }
    onInvitePerson?.({ email: inviteEmail.trim(), name: inviteName.trim(), role: selectedRole || contextRole });
    handleClose();
    setSaving(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (mode === 'select' && !selectedPerson) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < filtered.length) {
        e.preventDefault();
        const person = filtered[activeIndex];
        if (person) handleSelectPerson(person);
      } else if (e.key === 'Escape') {
        handleClose();
      }
    } else if (e.key === 'Escape') {
      if (selectedPerson) {
        handleBackToSelect();
      } else {
        handleClose();
      }
    }
  }

  if (!open && !closing) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`} onKeyDown={handleKeyDown}>
      <div className={`fixed inset-0 bg-surface-900/60 backdrop-blur-sm ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`} onClick={handleClose} />
      <div className={`relative z-10 w-full max-w-md bg-surface-900 rounded-xl border border-surface-700 shadow-modal ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}`}>
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-semibold text-surface-50">{contextLabel}</h2>
          <p className="text-sm text-text-400 mt-1">Who should do this work?</p>
        </div>

        <div className="px-6 pb-1 flex gap-2">
          <button onClick={() => { setMode('select'); setSelectedPerson(null); }}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${mode === 'select' && !selectedPerson ? 'bg-primary-500/15 text-primary-400' : 'bg-surface-800 text-text-400 hover:text-surface-200'}`}>
            Existing Person
          </button>
          <button onClick={() => { setMode('invite'); setSelectedPerson(null); }}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${mode === 'invite' ? 'bg-primary-500/15 text-primary-400' : 'bg-surface-800 text-text-400 hover:text-surface-200'}`}>
            Invite Someone New
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {mode === 'select' ? (
            <>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people..."
                disabled={loadingPeople}
                className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none disabled:opacity-50"
              />
              <div
                ref={listRef}
                data-person-search-results
                className="max-h-72 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {loadingPeople ? (
                  <p className="text-sm text-text-500 text-center py-4 col-span-full">Loading people...</p>
                ) : filteredCards.length === 0 ? (
                  <p className="text-sm text-text-500 text-center py-4 col-span-full">No people found.</p>
                ) : (
                  filteredCards.map((card, idx) => (
                    <div
                      key={card.id}
                      data-person-index={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={
                        selectedPerson?.id === card.id
                          ? 'ring-2 ring-primary-500/60 rounded-xl'
                          : activeIndex === idx
                            ? 'ring-1 ring-surface-600 rounded-xl'
                            : ''
                      }
                    >
                      <PersonCard
                        person={card}
                        size="compact"
                        showMenu={false}
                        showStats={false}
                        onSelect={(id) => {
                          const opt = optionById.get(id);
                          if (opt) handleSelectPerson(opt);
                        }}
                      />
                    </div>
                  ))
                )}
              </div>

              {showRoleSelector && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-text-500 uppercase tracking-wider">Role</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {roleOptions.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                          selectedRole === role ? 'border-primary-500/60 bg-primary-500/10 text-primary-300' : 'border-surface-700 bg-surface-800 text-content-secondary hover:border-surface-600'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full Name" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email Address" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
              <div className="space-y-2">
                <label className="block text-xs font-medium text-text-500 uppercase tracking-wider">Role</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {roleOptions.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                        selectedRole === role ? 'border-primary-500/60 bg-primary-500/10 text-primary-300' : 'border-surface-700 bg-surface-800 text-content-secondary hover:border-surface-600'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-surface-700 flex items-center gap-3">
          <button onClick={handleClose} className="flex-1 h-10 rounded-xl border border-surface-700 bg-transparent text-sm font-medium text-text-400 hover:text-text-200 active:scale-[0.98] transition-all">Cancel</button>
          {mode === 'select' ? (
            selectedPerson ? (
              <button onClick={handleSelectExisting} disabled={saving}
                className="flex-1 h-10 rounded-xl bg-primary-500 text-surface-50 text-sm font-semibold active:scale-[0.98] disabled:opacity-40 transition-all shadow-[0_4px_24px_rgba(204,85,0,0.2)]">
                {saving ? 'Adding...' : 'Add to Team'}
              </button>
            ) : (
              <button onClick={() => setMode('invite')} className="flex-1 h-10 rounded-xl bg-primary-500 text-surface-50 text-sm font-semibold active:scale-[0.98] transition-all shadow-[0_4px_24px_rgba(204,85,0,0.2)]">
                Invite Someone New
              </button>
            )
          ) : (
            <button onClick={handleInvite} disabled={!inviteName.trim() || !inviteEmail.trim() || saving}
              className="flex-1 h-10 rounded-xl bg-primary-500 text-surface-50 text-sm font-semibold active:scale-[0.98] disabled:opacity-40 transition-all shadow-[0_4px_24px_rgba(204,85,0,0.2)]">
              {saving ? 'Sending...' : 'Send Invitation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
