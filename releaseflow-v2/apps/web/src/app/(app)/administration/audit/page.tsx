'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdministrationAuditPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/audit');
  }, [router]);
  return null;
}
