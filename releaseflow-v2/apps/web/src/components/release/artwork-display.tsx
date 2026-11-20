import type { Artwork } from '@/lib/artwork/artwork-types';

const SLEEVE_STYLES = ['grooves', 'prism', 'dusk', 'wave'] as const;

function sleeveStyle(title: string) {
  const hash = Array.from(title).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 0);
  return SLEEVE_STYLES[hash % SLEEVE_STYLES.length];
}

interface ArtworkPlaceholderProps {
  title: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ArtworkPlaceholder({ title, size = 'md' }: ArtworkPlaceholderProps) {
  const sizeClass =
    size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-full aspect-square' : 'w-12 h-12';
  return (
    <div
      aria-label={`Artwork placeholder for ${title}`}
      className={`${sizeClass} studio-sleeve sleeve-${sleeveStyle(title)} rounded-xl shrink-0`}
    >
      <span className={size === 'lg' ? 'sleeve-title' : 'sleeve-initial'}>
        {size === 'lg' ? title : title.charAt(0).toUpperCase() || 'R'}
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

export function ArtworkDisplay({
  artwork,
  src,
  releaseTitle,
  size = 'md',
  className = '',
}: ArtworkDisplayProps) {
  const sizeClass =
    size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-full aspect-square' : 'w-12 h-12';
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
