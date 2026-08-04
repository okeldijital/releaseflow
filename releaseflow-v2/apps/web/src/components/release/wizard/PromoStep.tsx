'use client';

import { type Dispatch, type SetStateAction } from 'react';
import {
  PROMO_ASSETS,
  PUBLISH_DESTINATIONS,
  type PersonOption,
  type PromotionAssetEntry,
  type InviteTarget,
} from './release-wizard-types';
import { PersonSelect, InviteForm, Nav } from './wizard-ui';

export function PromoStep({
  promotionAssets,
  setPromotionAssets,
  people,
  inviteName,
  setInviteName,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  showInviteForm,
  setShowInviteForm,
  inviteTarget,
  setInviteTarget,
  handleInvite,
  back,
  next,
}: {
  promotionAssets: PromotionAssetEntry[];
  setPromotionAssets: Dispatch<SetStateAction<PromotionAssetEntry[]>>;
  people: PersonOption[];
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
  function toggleAsset(type: string) {
    setPromotionAssets((prev) =>
      prev.map((a) => {
        if (a.type !== type) return a;
        const enabled = !a.enabled;
        return {
          ...a,
          enabled,
          // Disabled assets clear destinations (validation: no dest required when off)
          publishDestinations: enabled ? a.publishDestinations : [],
        };
      }),
    );
  }

  function setDesigner(type: string, designerId: string) {
    setPromotionAssets((prev) =>
      prev.map((a) =>
        a.type === type
          ? { ...a, designerId: designerId.trim() ? designerId : null }
          : a,
      ),
    );
  }

  function toggleDestination(type: string, destination: string) {
    setPromotionAssets((prev) =>
      prev.map((a) => {
        if (a.type !== type) return a;
        const has = a.publishDestinations.includes(destination);
        return {
          ...a,
          publishDestinations: has
            ? a.publishDestinations.filter((d) => d !== destination)
            : [...a.publishDestinations, destination],
        };
      }),
    );
  }

  return (
    <>
      <p className="mt-2 text-sm text-text-400 text-center">
        Select assets, assign designers, and choose where each asset will be published.
      </p>
      <div className="mt-8 space-y-4">
        {PROMO_ASSETS.map((meta) => {
          const asset =
            promotionAssets.find((a) => a.type === meta.key)
            ?? {
              type: meta.key,
              enabled: false,
              designerId: null,
              publishDestinations: [] as string[],
            };
          const selected = asset.enabled;

          return (
            <div
              key={meta.key}
              className={`rounded-xl border transition-all ${
                selected
                  ? 'border-primary-500/60 bg-primary-500/5'
                  : 'border-surface-700 bg-surface-900'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAsset(meta.key)}
                className="w-full text-left px-5 py-3.5 flex items-center gap-3"
              >
                <span
                  className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                    selected
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-surface-600'
                  }`}
                >
                  {selected ? (
                    <svg
                      className="h-3 w-3 text-surface-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : null}
                </span>
                <span className="text-sm font-medium text-surface-100">
                  {meta.label}
                </span>
              </button>

              {selected ? (
                <div className="px-5 pb-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-text-500 uppercase tracking-wider mb-2">
                      Designer
                    </p>
                    <PersonSelect
                      value={asset.designerId ?? ''}
                      onChange={(v) => setDesigner(meta.key, v)}
                      people={people}
                      onInvite={() => {
                        setInviteTarget({ type: 'promo', key: meta.key });
                        setShowInviteForm(true);
                      }}
                    />
                    {showInviteForm && inviteTarget?.key === meta.key ? (
                      <div className="mt-4">
                        <InviteForm
                          name={inviteName}
                          setName={setInviteName}
                          email={inviteEmail}
                          setEmail={setInviteEmail}
                          role={inviteRole}
                          setRole={setInviteRole}
                          onSend={handleInvite}
                          onCancel={() => {
                            setShowInviteForm(false);
                            setInviteTarget(null);
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* Reuses destination list as multi-select checkboxes (no second selector component) */}
                  <div>
                    <p className="text-xs font-semibold text-text-500 uppercase tracking-wider mb-2">
                      Publish To
                    </p>
                    <div className="space-y-2">
                      {PUBLISH_DESTINATIONS.map((dest) => {
                        const on = asset.publishDestinations.includes(dest.key);
                        return (
                          <button
                            key={dest.key}
                            type="button"
                            onClick={() => toggleDestination(meta.key, dest.key)}
                            className={`w-full text-left px-3 py-2 rounded-lg border flex items-center gap-3 transition-colors ${
                              on
                                ? 'border-primary-500/50 bg-primary-500/10'
                                : 'border-surface-700 bg-surface-950 hover:border-surface-600'
                            }`}
                          >
                            <span
                              className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                on
                                  ? 'border-primary-500 bg-primary-500'
                                  : 'border-surface-600'
                              }`}
                            >
                              {on ? (
                                <svg
                                  className="h-3 w-3 text-surface-50"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : null}
                            </span>
                            <span className="text-sm text-surface-100">
                              {dest.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <Nav back={back} next={next} />
    </>
  );
}
