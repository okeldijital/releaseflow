'use client';

/**
 * Alias route for password reset — redirects query to /auth/action.
 * Some email templates may use /reset-password as the action URL.
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Redirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/auth/action?${qs}` : '/forgot-password');
  }, [router, searchParams]);

  return (
    <div className="flex justify-center py-8">
      <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
    </div>
  );
}

export default function ResetPasswordAliasPage() {
  return (
    <Suspense fallback={null}>
      <Redirect />
    </Suspense>
  );
}
