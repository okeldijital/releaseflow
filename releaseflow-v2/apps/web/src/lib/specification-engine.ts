import type { SpecType } from './specification-repository';

export interface SpecFieldDef {
  key: string;
  label: string;
  type: 'string' | 'text';
  placeholder?: string;
}

export interface SpecTemplate {
  label: string;
  fields: SpecFieldDef[];
}

export const SPEC_TEMPLATES: Record<SpecType, SpecTemplate> = {
  mastering: {
    label: 'Mastering',
    fields: [
      { key: 'targetLoudness', label: 'Target Loudness', type: 'string', placeholder: '-14 LUFS' },
      { key: 'peakCeiling', label: 'Peak Ceiling', type: 'string', placeholder: '-1.0 dBTP' },
      { key: 'deliveryFormats', label: 'Delivery Formats', type: 'string', placeholder: 'WAV 24-bit, MP3 320kbps' },
      { key: 'sampleRate', label: 'Sample Rate', type: 'string', placeholder: '48 kHz' },
      { key: 'bitDepth', label: 'Bit Depth', type: 'string', placeholder: '24-bit' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'dueDate', label: 'Due Date', type: 'text' },
    ],
  },
  mixing: {
    label: 'Mixing',
    fields: [
      { key: 'referenceMix', label: 'Reference Mix URL', type: 'string' },
      { key: 'deliveryFormats', label: 'Delivery Formats', type: 'string', placeholder: 'WAV 24-bit stems' },
      { key: 'exportFormat', label: 'Export Format', type: 'string', placeholder: 'WAV 24-bit, 48 kHz' },
      { key: 'revisionPolicy', label: 'Revision Policy', type: 'string', placeholder: '2 rounds included' },
      { key: 'notes', label: 'Notes', type: 'text' },
    ],
  },
  artwork: {
    label: 'Artwork',
    fields: [
      { key: 'deliverables', label: 'Deliverables', type: 'string', placeholder: 'Cover, back cover, booklet' },
      { key: 'canvasSizes', label: 'Canvas Sizes', type: 'string', placeholder: '3000x3000px' },
      { key: 'colourProfile', label: 'Colour Profile', type: 'string', placeholder: 'sRGB' },
      { key: 'platformVariants', label: 'Platform Variants', type: 'string', placeholder: 'Spotify Canvas, Apple Motion' },
      { key: 'notes', label: 'Notes', type: 'text' },
    ],
  },
};

export function getTemplate(type: SpecType): SpecTemplate {
  return SPEC_TEMPLATES[type];
}
