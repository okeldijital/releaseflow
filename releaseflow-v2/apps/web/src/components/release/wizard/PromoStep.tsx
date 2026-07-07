'use client';

import { type Dispatch, type SetStateAction } from 'react';
import { PROMO_ASSETS, SOCIAL_PLATFORMS, type PersonOption, type SocialRow, type InviteTarget } from './release-wizard-types';
import { PersonSelect, InviteForm, Nav } from './wizard-ui';

export function PromoStep({ promoAssets, setPromoAssets, assetDesigners, setAssetDesigners, people, socialRows, setSocialRows, addSocialRow, removeSocialRow, inviteName, setInviteName, inviteEmail, setInviteEmail, inviteRole, setInviteRole, showInviteForm, setShowInviteForm, inviteTarget, setInviteTarget, handleInvite, back, next }: {
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
                  {selected && <svg className="h-3 w-3 text-surface-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
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
