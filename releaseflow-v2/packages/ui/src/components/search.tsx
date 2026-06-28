import { useRef } from 'react';

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export function Search({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className = '',
}: SearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-400 pointer-events-none"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
          clipRule="evenodd"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        role="searchbox"
        aria-label={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-surface-50 border border-surface-200 rounded-md px-3 py-2 pl-9 pr-8 text-sm text-text-900 placeholder:text-text-400 transition-colors duration-100
          focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500
        `}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-400 hover:text-text-700 transition-colors duration-100"
        >
          <svg className="h-3 w-3" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3.646 3.646a.5.5 0 01.708 0L7 6.293l2.646-2.647a.5.5 0 01.708.708L7.707 7l2.647 2.646a.5.5 0 01-.708.708L7 7.707 4.354 10.354a.5.5 0 01-.708-.708L6.293 7 3.646 4.354a.5.5 0 010-.708z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
