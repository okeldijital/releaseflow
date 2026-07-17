'use client';

import type { PersonOption } from './release-wizard-types';

export function StepTitle({ step }: { step: string }) {
  const titles: Record<string, string> = {
    type: 'What are you releasing?', details: 'What is your release called?', remix: 'Tell us about this remix',
    artwork: 'Do you already have artwork?', tracks: "Let's add your tracks",
    release_info: 'Release Information', promotion: 'How will you promote this release?',
    email: 'Will you send an email announcement?', review: 'Ready to launch?',
  };
  return <h1 className="text-display-md font-semibold tracking-tight text-primary-400 text-center">{titles[step] ?? step}</h1>;
}

export function Btn({ label = 'Continue', onClick, disabled, secondary }: { label?: string; onClick: () => void; disabled?: boolean; secondary?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled || false}
      className={`flex-1 h-12 rounded-xl font-semibold text-body active:scale-[0.98] disabled:opacity-40 transition-all duration-150 ${secondary ? 'border border-surface-700 bg-transparent text-text-400 hover:text-text-200' : 'bg-primary-500 text-surface-50 hover:bg-primary-400 shadow-[0_4px_24px_rgba(204,85,0,0.25)]'}`}>{label}</button>
  );
}

export function Nav({ back, next, canNext = true, optional, onLater }: { back: () => void; next: () => void; canNext?: boolean; optional?: boolean; onLater?: () => void }) {
  function later() { if (onLater) onLater(); next(); }
  return (
    <div className="flex items-center gap-3 mt-8">
      <Btn label="Back" onClick={back} secondary />
      {optional && <Btn label="Complete Later" onClick={later} secondary />}
      <Btn onClick={next} disabled={optional ? false : !canNext} />
    </div>
  );
}

export function PersonSelect({ value, onChange, people, onInvite }: { value: string; onChange: (v: string) => void; people: PersonOption[]; onInvite: () => void }) {
  return (
    <select value={value} onChange={(e) => { if (e.target.value === '__invite__') onInvite(); else onChange(e.target.value); }}
      className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 focus:border-primary-500/60 focus:outline-none">
      <option value="">Choose person...</option>
      {people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
      <option value="__invite__">+ Invite Someone New</option>
    </select>
  );
}

export function InviteForm({ name, setName, email, setEmail, role, setRole, onSend, onCancel }: { name: string; setName: (v: string) => void; email: string; setEmail: (v: string) => void; role: string; setRole: (v: string) => void; onSend: () => void; onCancel: () => void }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4 space-y-3">
      <p className="text-sm font-semibold text-surface-100">Invite Someone New</p>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
      <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="block w-full h-10 rounded-xl border border-surface-700 bg-surface-950 px-3 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
      <div className="flex items-center gap-2">
        <button onClick={onSend} disabled={!name.trim() || !email.trim()} className="flex-1 h-10 rounded-xl bg-primary-500 text-surface-50 text-sm font-semibold active:scale-[0.98] disabled:opacity-40 transition-all duration-150">Send Invitation</button>
        <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-surface-700 bg-transparent text-sm text-text-400 active:scale-[0.98] transition-all duration-150">Cancel</button>
      </div>
    </div>
  );
}
