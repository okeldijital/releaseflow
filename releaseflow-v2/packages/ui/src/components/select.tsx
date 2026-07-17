import { useState, useRef, useEffect, useId } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  error,
  hint,
  disabled,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && activeIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      (items[activeIndex] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((p) => (p + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((p) => (p - 1 + options.length) % options.length);
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt) { onChange?.(opt.value); setOpen(false); }
        break;
      }
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label ? (
        <label
          htmlFor={generatedId}
          className="mb-2 block text-sm font-medium text-content-label"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <button
          id={generatedId}
          type="button"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={error ? true : undefined}
          onClick={() => !disabled && setOpen((p) => !p)}
          onKeyDown={handleKeyDown}
          className={`
            h-10 w-full flex items-center justify-between rounded-md border border-divider bg-layer-3
            px-3 text-sm transition-colors duration-100 ease-out

            ${error
              ? 'border-danger-500 focus:ring-2 focus:ring-danger-500'
              : 'hover:border-border-strong focus:border-primary-500 focus:ring-2 focus:ring-primary-500'}
            ${disabled
              ? 'cursor-not-allowed bg-layer-2 text-content-label opacity-50'
              : 'cursor-pointer'}
            focus:outline-none
          `}
        >
          <span className={selectedOption ? 'text-content-primary' : 'text-content-label'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`h-4 w-4 text-content-secondary shrink-0 transition-transform duration-100 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71.79-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open ? (
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-20 mt-2 w-full rounded-md border border-divider bg-layer-3 py-1 shadow-raised max-h-60 overflow-auto animate-slide-down"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={`
                  mx-1 rounded-sm px-3 py-2 text-sm cursor-pointer transition-colors duration-100
                  ${option.value === value
                    ? 'bg-layer-2 text-content-primary font-medium'
                    : 'text-content-secondary'}
                  ${index === activeIndex && option.value !== value
                    ? 'bg-layer-2 hover:text-content-primary'
                    : option.value !== value
                    ? 'hover:bg-layer-2 hover:text-content-primary'
                    : ''}
                `}
                onClick={() => { onChange?.(option.value); setOpen(false); }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-xs text-danger-500">{error}</p>
      ) : null}
      {hint && !error ? (
        <p className="mt-2 text-xs text-content-label">{hint}</p>
      ) : null}
    </div>
  );
}
