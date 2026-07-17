import { ReleaseFlowLogo } from '@/components/branding/releaseflow-logo';

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
        <div className="mb-10 flex flex-col items-center">
          <ReleaseFlowLogo width={112} priority />
        </div>

        {children}

        <p className="mt-8 text-center text-xs text-text-500">
          &copy; {new Date().getFullYear()} ReleaseFlow.
        </p>
      </div>
    </div>
  );
}
