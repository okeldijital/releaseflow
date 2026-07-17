import type { Artwork } from '@/lib/artwork/artwork-types';

const PLACEHOLDER_COLORS = [
  'from-primary-600 to-primary-800',
  'from-workflow-mixing to-primary-800',
  'from-workflow-publishing to-workflow-publishing/80',
  'from-workflow-mastering to-primary-800',
  'from-warning-600 to-warning-800',
  'from-info-600 to-info-800',
  'from-success-600 to-success-800',
  'from-workflow-distribution to-workflow-distribution/80',
] as const;

function pickColor(title: string): string {
  const index = (title.charCodeAt(0) || 0) % PLACEHOLDER_COLORS.length;
  return PLACEHOLDER_COLORS[index]!;
}

function initials(title: string): string {
  return title.charAt(0).toUpperCase() || 'R';
}

interface ArtworkPlaceholderProps {
  title: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ArtworkPlaceholder({ title, size = 'md' }: ArtworkPlaceholderProps) {
  const sizeClass = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-full aspect-square' : 'w-12 h-12';
  const textClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-6xl' : 'text-xl';

  return (
    <div
      className={`${sizeClass} rounded-xl bg-gradient-to-br ${pickColor(title)} flex items-center justify-center shrink-0`}
    >
      <span className={`${textClass} font-bold text-surface-50 select-none`}>
        {initials(title)}
      </span>
    </div>
  );
}

interface ArtworkDisplayProps {
  artwork?: Artwork | null;
  src?: string;
  releaseTitle: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ArtworkDisplay({ artwork, src, releaseTitle, size = 'md', className = '' }: ArtworkDisplayProps) {
  const sizeClass = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-full aspect-square' : 'w-12 h-12';
  const imageUrl = artwork?.secureUrl ?? src;

  if (imageUrl) {
    return (
      <div className={`${sizeClass} rounded-xl overflow-hidden shrink-0 ${className}`}>
        <img
          src={imageUrl}
          alt={`${releaseTitle} artwork`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return <ArtworkPlaceholder title={releaseTitle} size={size} />;
}
