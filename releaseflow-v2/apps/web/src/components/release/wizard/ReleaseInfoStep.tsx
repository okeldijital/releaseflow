'use client';

import type { LabelOption } from '@/components/label-field-picker';
import { LabelFieldPicker } from '@/components/label-field-picker';
import { isValidReleaseLink } from '@/lib/release-service';
import { SearchableGenreSelect } from '@/components/shared/searchable-genre-select';
import { Nav } from './wizard-ui';

export function ReleaseInfoStep({ primaryArtist, setPrimaryArtist, featuredArtists, setFeaturedArtists, releaseLink, setReleaseLink, recordLabel, setRecordLabel, catalogueNumber, setCatalogueNumber, upc, setUpc, primaryGenre, setPrimaryGenre, secondaryGenre, setSecondaryGenre, language, setLanguage, copyrightOwner, setCopyrightOwner, copyrightYear, setCopyrightYear, releaseOwner, setReleaseOwner, labelOptions, activeOrgId, orgName, onLabelCreated, userId, back, next }: {
  primaryArtist: string;
  setPrimaryArtist: (v: string) => void;
  featuredArtists: string[];
  setFeaturedArtists: (v: string[]) => void;
  releaseLink: string;
  setReleaseLink: (v: string) => void;
  recordLabel: string;
  setRecordLabel: (v: string) => void;
  catalogueNumber: string;
  setCatalogueNumber: (v: string) => void;
  upc: string;
  setUpc: (v: string) => void;
  primaryGenre: string;
  setPrimaryGenre: (v: string) => void;
  secondaryGenre: string;
  setSecondaryGenre: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  copyrightOwner: string;
  setCopyrightOwner: (v: string) => void;
  copyrightYear: string;
  setCopyrightYear: (v: string) => void;
  releaseOwner: string;
  setReleaseOwner: (v: string) => void;
  labelOptions: LabelOption[];
  activeOrgId: string | null;
  orgName: string;
  onLabelCreated: (label: LabelOption) => void;
  userId: string;
  back: () => void;
  next: () => void;
}) {
  const releaseLinkError = releaseLink.trim() && !isValidReleaseLink(releaseLink) ? 'Enter a valid URL (http:// or https://)' : '';

  return (
    <>
      <p className="mt-2 text-sm text-text-400 text-center">Tell streaming services and stores how this release should appear.</p>
      <div className="mt-8 space-y-6">

        {/* Release section */}
        <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
          <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Release</p>
          <div>
            <input type="url" value={releaseLink} onChange={(e) => setReleaseLink(e.target.value)} placeholder="https://"
              className={`block w-full h-12 rounded-xl border bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none ${releaseLinkError ? 'border-danger-500' : 'border-surface-700'}`} />
            <p className="mt-1.5 text-xs text-text-500">Optional. Add the public link once your release is available.</p>
            {releaseLinkError ? <p className="mt-1 text-xs text-danger-400">{releaseLinkError}</p> : null}
          </div>
          <input type="text" value={primaryArtist} onChange={(e) => setPrimaryArtist(e.target.value)} placeholder="Primary Artist"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          <input type="text" value={featuredArtists.join(', ')} onChange={(e) => setFeaturedArtists(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="Featured Artist(s) — comma separated" className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          <LabelFieldPicker
            instanceId="release-label"
            label="Label"
            value={recordLabel}
            onChange={setRecordLabel}
            labels={labelOptions}
            organizationId={activeOrgId}
            orgName={orgName}
            onLabelCreated={onLabelCreated}
          />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={catalogueNumber} onChange={(e) => setCatalogueNumber(e.target.value)} placeholder="Catalogue Number"
              className="h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
            <input type="text" value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="UPC (optional)"
              className="h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SearchableGenreSelect
              value={primaryGenre}
              onChange={setPrimaryGenre}
              orgId={activeOrgId}
              userId={userId}
              presets={[]}
              placeholder="Primary Genre"
              label="Primary Genre"
            />
            <SearchableGenreSelect
              value={secondaryGenre}
              onChange={setSecondaryGenre}
              orgId={activeOrgId}
              userId={userId}
              presets={[]}
              placeholder="Secondary Genre"
              label="Secondary Genre"
            />
          </div>
          <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Language (e.g. English)"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        </div>

        {/* Rights section */}
        <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
          <p className="text-xs font-semibold text-text-500 uppercase tracking-wider">Rights</p>
          <input type="text" value={copyrightOwner} onChange={(e) => setCopyrightOwner(e.target.value)} placeholder="℗ Copyright Owner"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          <input type="text" value={copyrightYear} onChange={(e) => setCopyrightYear(e.target.value)} placeholder="Copyright Year"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
          <input type="text" value={releaseOwner} onChange={(e) => setReleaseOwner(e.target.value)} placeholder="© Release Owner"
            className="block w-full h-12 rounded-xl border border-surface-700 bg-surface-950 px-4 text-sm text-surface-50 placeholder-text-500 focus:border-primary-500/60 focus:outline-none" />
        </div>
      </div>
      <Nav back={back} next={next}/>
    </>
  );
}
