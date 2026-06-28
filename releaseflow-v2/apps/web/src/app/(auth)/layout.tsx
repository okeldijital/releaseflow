import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4 py-12">
      {/* Subtle warm background pattern */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(204,85,0,0.06),transparent)]" aria-hidden="true" />

      <div className="relative w-full max-w-[360px] animate-scale-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-xl p-1 transition-opacity hover:opacity-80"
          >
            {/* Logo mark */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 shadow-sm">
              <svg viewBox="0 0 20 20" className="h-5 w-5 fill-white" aria-hidden="true">
                <path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" />
              </svg>
            </div>
            <span className="text-[18px] font-semibold text-text-900 tracking-tight">
              ReleaseFlow
            </span>
          </Link>
          <p className="text-xs text-text-400 tracking-wide">
            Professional Music Release Operations
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-surface-200/80 bg-white px-8 py-8 shadow-raised dark:bg-surface-900 dark:border-surface-700/80">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-text-400">
          &copy; {new Date().getFullYear()} ReleaseFlow. All rights reserved.
        </p>
      </div>
    </div>
  );
}
