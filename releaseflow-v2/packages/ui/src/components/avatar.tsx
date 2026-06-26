interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-20 w-20 text-3xl',
};

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-surface-200 flex items-center justify-center font-medium text-text-500 shrink-0 ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface AvatarGroupProps {
  users: { name: string; src?: string }[];
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function AvatarGroup({ users, max = 5, size = 'md', className = '' }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;
  return (
    <div className={`flex items-center -space-x-2 ${className}`}>
      {visible.map((u, i) => (
        <Avatar key={i} name={u.name} src={u.src} size={size} className="ring-2 ring-white dark:ring-surface-900" />
      ))}
      {remaining > 0 ? (
        <div className={`${size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-xs'} rounded-full bg-surface-300 flex items-center justify-center font-medium text-text-500 shrink-0 ring-2 ring-white dark:ring-surface-900`}>
          +{remaining}
        </div>
      ) : null}
    </div>
  );
}
