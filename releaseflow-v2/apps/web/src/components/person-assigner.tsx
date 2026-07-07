'use client';

import { useState, useEffect } from 'react';
import { getPeopleByOrg } from '@/lib/people-repository';
import { createAssignment } from '@/lib/assignment-repository';
import { createInvitation } from '@/lib/invitation-repository';

export interface PersonAssignerResult {
  personId?: string;
  personName?: string;
  invitationEmail?: string;
}

interface PersonAssignerProps {
  open: boolean;
  onClose: () => void;
  onAssign: (result: PersonAssignerResult) => void;
  contextLabel: string;
  contextRole: string;
  organizationId: string | null;
  currentUserId: string;
}

export function PersonAssigner({
  open, onClose, onAssign, contextLabel, contextRole, organizationId, currentUserId,
}: PersonAssignerProps) {
  const [people, setPeople] = useState<{ id: string; displayName: string }[]>([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'choose' | 'invite'>('choose');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [company, setCompany] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open && organizationId) {
      getPeopleByOrg(organizationId).then(setPeople);
    }
  }, [open, organizationId]);

  if (!open && !closing) return null;

  const filtered = people.filter((p) =>
    p.displayName.toLowerCase().includes(search.toLowerCase())
  );

  function handleClose() {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 200);
  }

  async function handleAssignExisting() {
    if (!selectedPerson || !organizationId) return;
    setSaving(true);
    try {
      await createAssignment(selectedPerson, 'track', '', contextRole, instructions || undefined);
    } catch { /* assignment best-effort */ }
    onAssign({ personId: selectedPerson, personName: people.find((p) => p.id === selectedPerson)?.displayName });
    setSaving(false);
  }

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim() || !organizationId) return;
    setSaving(true);
    try {
      await createInvitation({
        organizationId,
        inviterId: currentUserId,
        email: inviteEmail.trim(),
        roleId: contextRole,
      });
    } catch { /* invite best-effort */ }
    onAssign({ invitationEmail: inviteEmail.trim(), personName: inviteName.trim() });
    setSaving(false);
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`}>
      <div className={`fixed inset-0 bg-surface-900/60 backdrop-blur-sm ${closing ? 'opacity-0 transition-opacity duration-200' : ''}`} onClick={handleClose} />
      <div className={`relative z-10 w-full max-w-md bg-surface-900 rounded-xl border border-surface-700 shadow-modal ${closing ? 'opacity-0 scale-95 transition-all duration-200' : 'animate-scale-in'}`}>
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-semibold text-surface-50">{contextLabel}</h2>
          <p className="text-sm text-text-400 mt-1">Who should do this work?</p>
        </div>

        <div className="px-6 pb-1 flex gap-2">
          <button onClick={() => setMode('choose')}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${mode === 'choose' ? 'bg-primary-500/15 text-primary-400' : 'bg-surface-800 text-text-400 hover:text-surface-200'}`}>
            Existing Person
          </button>
          <button onClick={() => setMode('invite')}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${mode === 'invite' ? 'bg-primary-500/15 text-primary-400' : 'bg-surface-800 text-text-400 hover:text-surface-200'}`}>
            Invite Someone New
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {mode === 'choose' ? (
            <>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people..." className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filtered.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPerson(p.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                      selectedPerson === p.id ? 'border-primary-500/60 bg-primary-500/10' : 'border-surface-700 bg-surface-800 hover:border-surface-600'
                    }`}>
                    <p className="text-sm font-medium text-surface-100">{p.displayName}</p>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-text-500 text-center py-4">No people found.</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full Name" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email Address" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                placeholder="Company (optional)" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
              <p className="text-xs text-text-500">Role: <span className="text-text-400">{contextRole}</span></p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-500 uppercase tracking-wider mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-500 uppercase tracking-wider mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as never)}
                className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-500 uppercase tracking-wider mb-1">Instructions</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3}
              placeholder="Describe exactly what you need. Include references, requirements, links, expectations, technical specifications, etc."
              className="block w-full rounded-xl border border-surface-700 bg-surface-950 px-3 py-2 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none resize-none" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-surface-700 flex items-center gap-3">
          <button onClick={handleClose} className="flex-1 h-10 rounded-xl border border-surface-700 bg-transparent text-sm font-medium text-text-400 hover:text-text-200 active:scale-[0.98] transition-all">Cancel</button>
          {mode === 'choose' ? (
            <button onClick={handleAssignExisting} disabled={!selectedPerson || saving}
              className="flex-1 h-10 rounded-xl bg-primary-500 text-surface-50 text-sm font-semibold active:scale-[0.98] disabled:opacity-40 transition-all shadow-[0_4px_24px_rgba(204,85,0,0.2)]">
              {saving ? 'Assigning...' : 'Assign'}
            </button>
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
