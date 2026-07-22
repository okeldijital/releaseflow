'use client';

import { Nav } from './wizard-ui';
import { RichTextEditor } from '@/components/rich-text/RichTextEditor';
import type { RichTextDocument } from '@/lib/rich-text';
import { emptyRichTextDocument } from '@/lib/rich-text';

export function LinerNotesStep({
  linerNotes,
  setLinerNotes,
  back,
  next,
}: {
  linerNotes: RichTextDocument | null;
  setLinerNotes: (doc: RichTextDocument | null) => void;
  back: () => void;
  next: () => void;
}) {
  return (
    <>
      <p className="mt-3 text-sm text-text-400 text-center max-w-md mx-auto">
        Add editorial notes, acknowledgements, recording information, or the story behind this
        release. These notes become part of the release record and can be exported as a PDF after
        the release has been created.
      </p>
      <div className="mt-8">
        <RichTextEditor
          value={linerNotes ?? emptyRichTextDocument()}
          onChange={(doc) => setLinerNotes(doc)}
          placeholder="Write liner notes…"
          minHeightClass="min-h-[240px]"
        />
      </div>
      <p className="mt-3 text-xs text-text-500 text-center">Optional — you can skip this step.</p>
      <Nav back={back} next={next} canNext />
    </>
  );
}
