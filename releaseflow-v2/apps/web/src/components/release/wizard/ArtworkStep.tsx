'use client';

import type { PersonOption } from './release-wizard-types';
import { PersonSelect, InviteForm, Btn } from './wizard-ui';

export function ArtworkStep({ hasArtwork, setHasArtwork, commissionArtwork, setCommissionArtwork, artworkDesigner, setArtworkDesigner, people, inviteName, setInviteName, inviteEmail, setInviteEmail, inviteRole, setInviteRole, showInviteForm, setShowInviteForm, handleInvite, back, next }: {
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
        <button onClick={() => setHasArtwork(true)} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]">Yes, I have artwork</button>
        <button onClick={() => setHasArtwork(false)} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]">No, not yet</button>
      </div>
      {hasArtwork === false && (
        <div className="mt-6">
          <p className="text-sm text-text-400 text-center mb-4">Would you like to commission artwork?</p>
          <div className="space-y-3">
            <button onClick={() => setCommissionArtwork(true)} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]">Yes, find a designer</button>
            <button onClick={() => { setCommissionArtwork(false); next(); }} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98]">I&apos;ll upload later</button>
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
