'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useOrgStore } from '@/stores/org-store';
import {
  getPeopleByOrg,
  createPerson,
  updatePerson,
  archivePerson,
} from '@/lib/people-repository';
import type { PersonRecord } from '@/lib/people-repository';
import { resolveAvatar } from '@/lib/avatar-service';
import type { AvatarResult } from '@/lib/avatar-service';
import { Button, EmptyState, LoadingState, Input, StatusBadge } from '@releaseflow/ui';

function InfoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const els = dialogRef.current.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!els.length) return;
        const first = els[0]!;
        const last = els[els.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, handleClose]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  if (!open && !closing) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`}>
      <div className={`fixed inset-0 bg-surface-900/40 backdrop-blur-sm ${closing ? 'opacity-0 transition-opacity duration-200' : 'animate-fade-in'}`} onClick={handleClose} aria-hidden="true" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="invite-title" className={`relative z-10 w-full max-w-sm bg-layer-2 dark:bg-surface-800 rounded-lg shadow-modal border border-surface-200 dark:border-surface-600 ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}`}>
        <div className="px-6 pt-6 pb-4">
          <h2 id="invite-title" className="text-base font-semibold text-text-900 dark:text-text-100">Invite People</h2>
          <p className="mt-3 text-sm text-text-500 dark:text-text-400 leading-relaxed">
            Invitation workflow is scheduled for Sprint XX. This screen is intentionally unavailable.
          </p>
          <p className="mt-2 text-xs text-text-400 dark:text-text-500">
            Please use the Organisations page to create or join an organisation until the invitation system is available.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700">
          <button ref={closeBtnRef} type="button" onClick={handleClose} className="w-full h-10 px-4 text-sm font-medium text-text-700 dark:text-text-300 rounded-md border border-surface-200 dark:border-surface-600 bg-layer-2 dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors duration-100">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditDialogProps {
  person: PersonRecord;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditDialog({ person, open, onClose, onSaved }: EditDialogProps) {
  const [closing, setClosing] = useState(false);
  const [displayName, setDisplayName] = useState(person.displayName);
  const [email, setEmail] = useState(person.email);
  const [primaryRole, setPrimaryRole] = useState(person.primaryRole);
  const [avatarUrl, setAvatarUrl] = useState(person.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setDisplayName(person.displayName);
    setEmail(person.email);
    setPrimaryRole(person.primaryRole);
    setAvatarUrl(person.avatarUrl ?? '');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, person, handleClose]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  async function handleSave() {
    setSaving(true);
    await updatePerson(person.id, { displayName, email, primaryRole, avatarUrl: avatarUrl.trim() || null });
    setSaving(false);
    onSaved();
  }

  async function handleArchive() {
    setSaving(true);
    await archivePerson(person.id);
    setSaving(false);
    onSaved();
  }

  if (!open && !closing) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`}>
      <div className={`fixed inset-0 bg-surface-900/40 backdrop-blur-sm ${closing ? 'opacity-0 transition-opacity duration-200' : 'animate-fade-in'}`} onClick={handleClose} aria-hidden="true" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="edit-title" className={`relative z-10 w-full max-w-sm bg-layer-2 dark:bg-surface-800 rounded-lg shadow-modal border border-surface-200 dark:border-surface-600 ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}`}>
        <div className="px-6 pt-6 pb-4 space-y-4">
          <h2 id="edit-title" className="text-base font-semibold text-text-900 dark:text-text-100">Edit Person</h2>
          <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Primary Role" value={primaryRole} onChange={(e) => setPrimaryRole(e.target.value)} placeholder="e.g. Mastering Engineer, Producer, Photographer" />
          <Input label="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" />
        </div>
        <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={handleArchive} disabled={saving}>
            Archive
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !displayName.trim() || !email.trim()}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PeoplePage() {
  const { activeOrgId } = useOrgStore();
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editPerson, setEditPerson] = useState<PersonRecord | null>(null);

  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPrimaryRole, setNewPrimaryRole] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadPeople() {
    if (!activeOrgId) { setPeople([]); setLoading(false); return; }
    try {
      const data = await getPeopleByOrg(activeOrgId);
      console.log('[people-page] Data from repo:', data.length, data);
      setPeople(data);
    } catch (err) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.error('People page:', err);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeople();
  }, [activeOrgId]);

  async function handleAdd() {
    if (!activeOrgId || !newDisplayName.trim() || !newEmail.trim()) return;
    setSaving(true);
    await createPerson({
      organizationId: activeOrgId,
      displayName: newDisplayName.trim(),
      email: newEmail.trim(),
      primaryRole: newPrimaryRole.trim() || '—',
      avatarUrl: newAvatarUrl.trim() || null,
    });
    setNewDisplayName('');
    setNewEmail('');
    setNewPrimaryRole('');
    setNewAvatarUrl('');
    setShowAddForm(false);
    await loadPeople();
    setSaving(false);
  }

  if (!activeOrgId) {
    return (
      <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
        <div className="mb-8">
          <p className="text-[1.75rem] font-semibold text-primary-400 tracking-tight">People</p>
          <p className="mt-1 text-sm text-text-400">Your creative team, collaborators and contributors.</p>
        </div>
        <EmptyState title="No organization selected" description="Select an organization to manage people." />
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><LoadingState /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-7 py-8 page-transition">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-[1.75rem] font-semibold text-primary-400 tracking-tight">People</p>
          <p className="mt-1 text-sm text-text-400">Your creative team, collaborators and contributors.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setInfoOpen(true)}>Invite</Button>
          <Button variant="primary" size="sm" className="rounded-xl" onClick={() => setShowAddForm((v) => !v)}>Add Person</Button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 rounded-xl border border-surface-200/80 bg-layer-2 p-5 space-y-4">
          <p className="text-sm font-semibold text-text-900 dark:text-text-100">New Person</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Display Name" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} placeholder="Jane Doe" />
            <Input label="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <Input label="Primary Role" value={newPrimaryRole} onChange={(e) => setNewPrimaryRole(e.target.value)} placeholder="e.g. Mastering Engineer, Producer, Photographer" />
          <Input label="Avatar URL" value={newAvatarUrl} onChange={(e) => setNewAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" />
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={saving || !newDisplayName.trim() || !newEmail.trim()}>Save</Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {people.length === 0 ? (
        <>
        <EmptyState
          title="No people yet"
          description="Add your first team member to begin collaborating."
          action={{ label: 'Add Person', onClick: () => setShowAddForm(true) }}
        />
        <p className="text-xs text-text-400 mt-4 text-center">
          [debug] org: {activeOrgId?.slice(0, 8) ?? 'null'} | people: {people.length} | loading: {String(loading)}
        </p>
        </>
      ) : (
        <div className="space-y-1.5">
          {people.map((p) => {
            const avatar: AvatarResult = resolveAvatar(p);
            return (
            <button
              key={p.id}
              type="button"
              onClick={() => setEditPerson(p)}
              className="w-full text-left flex items-center justify-between rounded-xl border border-surface-200/80 bg-layer-2 px-4 py-3.5 hover:border-primary-200 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center gap-3 min-w-0">
                {avatar.type === 'uploaded' && avatar.url ? (
                  <img src={avatar.url} alt={p.displayName} className="h-8 w-8 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300 shrink-0">
                    {avatar.initials}
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium text-text-900 dark:text-text-100">{p.displayName}</p>
                  <p className="text-xs text-text-400">{p.email}</p>
                  {p.primaryRole && p.primaryRole !== '—' ? (
                    <p className="text-xs text-text-500 mt-0.5">{p.primaryRole}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={p.status} />
              </div>
            </button>
            );
          })}
        </div>
      )}

      <InfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} />
      {editPerson && (
        <EditDialog
          person={editPerson}
          open={!!editPerson}
          onClose={() => setEditPerson(null)}
          onSaved={() => { setEditPerson(null); loadPeople(); }}
        />
      )}
    </div>
  );
}
