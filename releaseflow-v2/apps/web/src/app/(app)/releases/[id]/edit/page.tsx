'use client';

import { useParams } from 'next/navigation';
import { ReleaseWizard } from '@/components/release/wizard/ReleaseWizard';

export default function EditReleasePage() {
  const params = useParams();
  const id = params.id as string;

  return <ReleaseWizard mode="edit" releaseId={id} />;
}
