'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { LoadingState } from '@releaseflow/ui';

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

  if (loading) return <LoadingState />;

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((s) => (
              <div key={s.step} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      s.step < currentStep
                        ? 'bg-primary-500 text-white'
                        : s.step === currentStep
                          ? 'border-2 border-primary-500 text-primary-500'
                          : 'border-2 border-surface-300 text-text-400'
                    }`}
                  >
                    {s.step < currentStep ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.step}
                  </div>
                  <span className={`text-sm font-medium ${s.step <= currentStep ? 'text-text-900' : 'text-text-400'}`}>{s.label}</span>
                </div>
                {s.step < steps.length && (
                  <div className={`mx-4 h-px w-16 ${s.step < currentStep ? 'bg-primary-500' : 'bg-surface-200'}`} />
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
