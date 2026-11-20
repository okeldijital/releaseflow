'use client';

import { RELEASE_TYPES, type ReleaseTypeVal } from './release-wizard-types';

interface ReleaseTypeStepProps {
  releaseType: string;
  setReleaseType: (type: ReleaseTypeVal) => void;
  next: () => void;
}

export function ReleaseTypeStep({ releaseType, setReleaseType, next }: ReleaseTypeStepProps) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {RELEASE_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          aria-pressed={releaseType === type.value}
          className="studio-format"
          onClick={() => {
            setReleaseType(type.value);
            next();
          }}
        >
          <span className={`studio-format-art studio-format-${type.value}`} aria-hidden="true" />
          <span className="block text-lg font-semibold">{type.label}</span>
          <span className="text-sm text-content-label">{type.description}</span>
        </button>
      ))}
    </div>
  );
}
