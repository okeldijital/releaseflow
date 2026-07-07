'use client';

import type { AssignerField } from './release-wizard-types';
import { Nav } from './wizard-ui';

export function EmailStep({ hasEmail, setHasEmail, emailSubject, setEmailSubject, emailPreviewText, setEmailPreviewText, emailBody, setEmailBody, emailCampaignManager, setEmailCampaignManager, emailSendDate, setEmailSendDate, emailSendTime, setEmailSendTime, emailTimezone, setEmailTimezone, openAssigner, back, next, onLater }: {
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
        <button onClick={() => setHasEmail(true)} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98] transition-all duration-150">Yes</button>
        <button onClick={() => { setHasEmail(false); if (onLater) onLater(); next(); }} className="w-full h-14 rounded-xl border border-surface-700 bg-surface-900 text-body font-medium text-surface-100 hover:border-surface-600 active:scale-[0.98] transition-all duration-150">Not now</button>
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
