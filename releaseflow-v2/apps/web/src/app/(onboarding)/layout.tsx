'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

const steps = [
  { label: 'Organization', step: 1 },
  { label: 'Invite', step: 2 },
  { label: 'Done', step: 3 },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const currentStep = pathname === '/onboarding' ? 1 : 2;

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((s) => (
              <div key={s.step} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      s.step < currentStep
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : s.step === currentStep
                          ? 'border-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                          : 'border-2 border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500'
                    }`}
                  >
                    {s.step < currentStep ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.step
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      s.step <= currentStep
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {s.step < steps.length && (
                  <div
                    className={`mx-4 h-px w-16 ${
                      s.step < currentStep
                        ? 'bg-zinc-900 dark:bg-zinc-100'
                        : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
