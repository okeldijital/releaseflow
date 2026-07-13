import type { Artwork } from '@/lib/artwork/artwork-types';

const PLACEHOLDER_COLORS = [
  'from-primary-600 to-primary-800',
  'from-purple-600 to-purple-800',
  'from-teal-600 to-teal-600/80',
  'from-pink-600 to-pink-800',
  'from-amber-600 to-amber-800',
  'from-blue-600 to-blue-800',
  'from-emerald-600 to-emerald-800',
  'from-rose-600 to-rose-800',
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
