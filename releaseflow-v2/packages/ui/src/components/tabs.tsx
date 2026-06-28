import { useRef, useCallback } from 'react';

type TabVariant = 'underline' | 'pill' | 'border';

interface Tab {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: TabVariant;
  className?: string;
}

const variantContainerClasses: Record<TabVariant, string> = {
  underline: 'border-b border-surface-200 dark:border-surface-700',
  pill: 'flex-wrap gap-1',
  border: 'gap-0 border-b border-surface-200 dark:border-surface-700',
};

const variantTabClasses: Record<TabVariant, string> = {
  underline: 'px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-100',
  pill: 'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-100',
  border: 'rounded-t-md px-6 py-2 text-sm font-medium transition-colors duration-100 border border-b-0 border-transparent',
};

const variantActiveClasses: Record<TabVariant, string> = {
  underline: 'border-primary-500 text-primary-600 dark:text-primary-400',
  pill: 'bg-primary-500 text-white shadow-sm',
  border: 'bg-white text-text-900 border-surface-200 dark:border-surface-700 shadow-card -mb-px',
};

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const focusTab = useCallback((id: string) => {
    tabRefs.current.get(id)?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const enabled = tabs.filter((t) => !t.disabled);
      const idx = enabled.findIndex((t) => t.id === activeTab);
      let next: string | null = null;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next = enabled[(idx + 1) % enabled.length]?.id ?? null;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        next = enabled[(idx - 1 + enabled.length) % enabled.length]?.id ?? null;
      } else if (e.key === 'Home') {
        e.preventDefault();
        next = enabled[0]?.id ?? null;
      } else if (e.key === 'End') {
        e.preventDefault();
        next = enabled[enabled.length - 1]?.id ?? null;
      }

      if (next) {
        onChange(next);
        setTimeout(() => focusTab(next!), 0);
      }
    },
    [tabs, activeTab, onChange, focusTab],
  );

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`flex overflow-x-auto ${variantContainerClasses[variant]} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            role="tab"
            aria-selected={active}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`
              inline-flex items-center gap-2 shrink-0 whitespace-nowrap
              ${variantTabClasses[variant]}
              ${active ? variantActiveClasses[variant] : variant === 'pill' ? 'text-text-600 hover:text-text-900 hover:bg-surface-100 dark:text-text-400 dark:hover:text-text-200 dark:hover:bg-surface-800' : variant === 'border' ? 'text-text-500 hover:text-text-700 hover:bg-surface-50' : 'border-transparent text-text-500 hover:text-text-800 hover:border-surface-300 dark:text-text-400 dark:hover:text-text-200 dark:hover:border-surface-600'}
              ${tab.disabled ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={`text-xs rounded-full px-2 py-1 font-semibold leading-none ${
                  variant === 'pill'
                    ? (active ? 'bg-white/20 text-white' : 'bg-surface-200 text-text-500 dark:bg-surface-700 dark:text-text-400')
                    : (active ? 'bg-primary-50 text-primary-600' : 'bg-surface-100 text-text-500 dark:bg-surface-800 dark:text-text-400')
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
