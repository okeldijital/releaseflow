'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdministrationMembersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/organizations');
  }, [router]);
  return null;
}
