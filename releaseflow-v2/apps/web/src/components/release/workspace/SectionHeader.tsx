import { Button } from '@releaseflow/ui';

interface SectionHeaderProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function SectionHeader({ title, description, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-start sm:items-center justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-content-secondary tracking-tight">{title}</h2>
          <p className="text-xs text-content-label mt-0.5">{description}</p>
        </div>
        {action ? (
          <Button size="sm" variant="outline" onClick={action.onClick} className="shrink-0">
            {action.label}
          </Button>
        ) : null}
      </div>
      <hr className="border-0 border-t border-surface-200" />
    </div>
  );
}
