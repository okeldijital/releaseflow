'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdministrationDiagnosticsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/diagnostics');
  }, [router]);
  return null;
}
