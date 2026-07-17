interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-5 w-5 text-xs',
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-base',
  xl: 'h-14 w-14 text-xl',
  /** PROF-001 profile header — ~80px */
  '2xl': 'h-20 w-20 text-2xl',
};

const avatarColors: readonly string[] = [
  'bg-primary-100 text-primary-700',
  'bg-secondary-100 text-secondary-700',
  'bg-info-50 text-info-700',
  'bg-success-50 text-success-700',
  'bg-warning-50 text-warning-700',
  'bg-danger-50 text-danger-700',
] as const;

function avatarColor(name: string): string {
  const idx = (name.charCodeAt(0) ?? 0) % avatarColors.length;
  return avatarColors[idx]!;
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 ring-2 ring-surface-0 ${className}`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses[size]} ${avatarColor(name)} rounded-full flex items-center justify-center font-semibold shrink-0 select-none ${className}`}
      role="img"
      aria-label={name}
    >
      <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

interface AvatarGroupProps {
  users: { name: string; src?: string }[];
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function AvatarGroup({
  users,
  max = 5,
  size = 'md',
  className = '',
}: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;
  const label = users.map((u) => u.name).join(', ');

  return (
    <div
      className={`flex items-center -space-x-2 ${className}`}
      role="group"
      aria-label={label}
    >
      {visible.map((u, i) => (
        <Avatar
          key={i}
          name={u.name}
          src={u.src}
          size={size}
          className="ring-2 ring-surface-0"
        />
      ))}
      {remaining > 0 ? (
        <div
          className={`${
            size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-xs'
          } rounded-full bg-surface-200 flex items-center justify-center font-semibold text-text-600 shrink-0 ring-2 ring-surface-0`}
          aria-label={`${remaining} more`}
        >
          +{remaining}
        </div>
      ) : null}
    </div>
  );
}
