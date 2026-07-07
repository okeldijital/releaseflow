import { type ReactNode, useState } from 'react';

const PDS_CATEGORIES = [
  'Audio',
  'Artwork',
  'Metadata',
  'Rights',
  'Distribution',
  'Marketing',
  'Legal',
] as const;

type ReadinessCategory = typeof PDS_CATEGORIES[number];

interface ReadinessStackProps {
  categories: Record<string, { status: 'ready' | 'not-ready'; description?: string; guidance?: string }>;
  className?: string;
}

const defaultGuidance: Record<ReadinessCategory, string> = {
  Audio: 'Provide final audio files',
  Artwork: 'Upload approved artwork',
  Metadata: 'Complete release metadata',
  Rights: 'Resolve rights and publishing information',
  Distribution: 'Select distribution platforms',
  Marketing: 'Prepare marketing assets',
  Legal: 'Complete legal review',
};

function AudioIcon() {
  return (
    <svg className="h-4 w-4 text-text-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12V4l7-1v9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="11" cy="12" r="1.5" />
    </svg>
  );
}

function ArtworkIcon() {
  return (
    <svg className="h-4 w-4 text-text-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <circle cx="6" cy="6" r="1.5" />
      <path d="M2 12.5l3.5-3.5 2 2 3.5-3.5 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetadataIcon() {
  return (
    <svg className="h-4 w-4 text-text-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2h5l7 7-5 5-7-7V2z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="5" r="1" />
    </svg>
  );
}

function RightsIcon() {
  return (
    <svg className="h-4 w-4 text-text-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2l5 2.5v4c0 3.5-2.24 5.5-5 6.5-2.76-1-5-3-5-6.5v-4L8 2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7v3M7 8.5l2-1M9 8.5l-2-1" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  );
}

function DistributionIcon() {
  return (
    <svg className="h-4 w-4 text-text-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12M8 2c1.67 2 2 4 2 6s-.33 4.5-2 6M8 2C6.33 4 6 6 6 8s.33 4.5 2 6" strokeLinecap="round" />
    </svg>
  );
}

function MarketingIcon() {
  return (
    <svg className="h-4 w-4 text-text-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3.5 6.5l6.5-3v9l-6.5-3H2.5a1 1 0 01-1-1v-1a1 1 0 011-1h1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 5.5l3-1.5v8l-3-1.5" strokeLinecap="round" />
    </svg>
  );
}

function LegalIcon() {
  return (
    <svg className="h-4 w-4 text-text-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 1h6l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 1v4h4" />
      <circle cx="8" cy="9" r="2" />
      <path d="M7 8.5L8 9l1-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const categoryIconMap: Record<ReadinessCategory, () => ReactNode> = {
  Audio: AudioIcon,
  Artwork: ArtworkIcon,
  Metadata: MetadataIcon,
  Rights: RightsIcon,
  Distribution: DistributionIcon,
  Marketing: MarketingIcon,
  Legal: LegalIcon,
};

function ReadyIcon() {
  return (
    <div className="h-5 w-5 rounded-full bg-success-500 flex items-center justify-center shrink-0">
      <svg className="h-3 w-3 text-surface-50" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function NotReadyIcon() {
  return (
    <div className="h-5 w-5 rounded-full bg-surface-200 flex items-center justify-center shrink-0">
      <svg className="h-3 w-3 text-text-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6h4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function getStatusPill(readyCount: number, totalCount: number) {
  if (readyCount === totalCount) {
    return { text: 'Release Ready', className: 'bg-success-500/15 text-success-500' };
  }
  if (readyCount < 4) {
    return { text: 'Attention Needed', className: 'bg-danger-500/15 text-danger-500' };
  }
  return { text: 'Action Required', className: 'bg-primary-500/15 text-primary-400' };
}

export function ReadinessStack({ categories, className = '' }: ReadinessStackProps) {
  const [showReady, setShowReady] = useState(false);

  const categoryEntries = PDS_CATEGORIES
    .filter((cat): cat is ReadinessCategory => cat in categories)
    .map((cat) => ({
      category: cat,
      data: categories[cat]!,
    }));

  if (categoryEntries.length === 0) return null;

  const notReady = categoryEntries.filter((e) => e.data.status === 'not-ready');
  const ready = categoryEntries.filter((e) => e.data.status === 'ready');
  const totalCount = categoryEntries.length;
  const readyCount = ready.length;
  const percentage = Math.round((readyCount / totalCount) * 100);
  const pill = getStatusPill(readyCount, totalCount);

  return (
    <div className={`rounded-xl border border-divider bg-layer-2 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-content-primary">Readiness</h3>
        <span className={`inline-flex items-center text-xs font-medium rounded-full px-3 py-1 ${pill.className}`}>
          {pill.text}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3 mb-2">
        <p className="text-3xl font-semibold text-content-primary leading-none">{percentage}%</p>
        <p className="text-xs text-content-label">
          {readyCount} of {totalCount} ready
        </p>
      </div>

      <div className="bg-layer-3 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {notReady.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-text-500">{pill.text}</span>
          </div>
          <div className="border-t border-surface-100 mb-2" />
        </div>
      )}

      <div role="list" aria-label="Readiness Checklist">
        {notReady.map(({ category, data }) => {
          const IconComponent = categoryIconMap[category];
          const guidance = data.guidance ?? defaultGuidance[category];
          return (
            <div
              key={category}
              role="listitem"
              aria-label={`${category}: not ready`}
              className="flex items-start gap-3 py-2 border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-all duration-300 rounded-lg -mx-2 px-2"
            >
              <NotReadyIcon />
              <IconComponent />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-700">{category}</span>
                  <span className="text-xs font-medium text-text-400 shrink-0 ml-2">Not Ready</span>
                </div>
                <p className="text-xs text-text-500 mt-0.5">{guidance}</p>
              </div>
            </div>
          );
        })}

        {ready.length > 0 && showReady && (
          <>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 border-t border-surface-100" />
              <span className="text-xs font-medium text-text-400 shrink-0">Ready</span>
              <div className="flex-1 border-t border-surface-100" />
            </div>

            {ready.map(({ category, data }) => {
              const IconComponent = categoryIconMap[category];
              return (
                <div
                  key={category}
                  role="listitem"
                  aria-label={`${category}: ready`}
                  className="flex items-start gap-3 py-2 border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-all duration-300 rounded-lg -mx-2 px-2"
                >
                  <ReadyIcon />
                  <IconComponent />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-700">{category}</span>
                      <span className="text-xs font-medium text-success-500 shrink-0 ml-2">Ready</span>
                    </div>
                    {data.description && (
                      <p className="text-xs text-text-500 mt-0.5">{data.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {ready.length > 0 && (
        <button
          type="button"
          onClick={() => setShowReady(!showReady)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-medium text-text-500 hover:text-text-700 transition-colors duration-200 py-2 rounded-lg hover:bg-surface-50"
        >
          {showReady ? 'Hide' : `Show ${ready.length}`} ready {ready.length === 1 ? 'category' : 'categories'}
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${showReady ? 'rotate-180' : ''}`}
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M3 5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
