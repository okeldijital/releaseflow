export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-6 py-12">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(204,85,0,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[360px] animate-scale-in">
        <div className="mb-10 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 shadow-[0_4px_24px_rgba(204,85,0,0.25)]">
            <svg viewBox="0 0 20 20" className="h-5 w-5 fill-white" aria-hidden="true">
              <path d="M4 3h6.5c2.485 0 4 1.343 4 3.5 0 1.5-.8 2.7-2 3.2L15 17h-2.7l-2.3-6.8H6.6V17H4V3zm2.6 2.2v3.5h3.7c1 0 1.7-.65 1.7-1.75S11.3 5.2 10.3 5.2H6.6z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-surface-50 tracking-tight">ReleaseFlow</span>
        </div>

        {children}

        <p className="mt-8 text-center text-xs text-text-500">
          &copy; {new Date().getFullYear()} ReleaseFlow.
        </p>
      </div>
    </div>
  );
}
