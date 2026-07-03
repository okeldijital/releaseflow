'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-surface-950 text-surface-50">
      <div className="relative flex-1 flex items-center justify-center px-6 py-16">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(204,85,0,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 w-full max-w-md animate-scale-in">
          {children}
        </div>
      </div>
    </div>
  );
}
