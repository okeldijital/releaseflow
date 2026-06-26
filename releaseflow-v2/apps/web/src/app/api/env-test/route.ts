import { NextResponse } from 'next/server';

export async function GET() {
  const vars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const present = Object.entries(vars).filter(([, v]) => v).map(([k]) => k);
  const missing = Object.entries(vars).filter(([, v]) => !v).map(([k]) => k);

  return NextResponse.json({
    valid: missing.length === 0,
    runtime: typeof window === 'undefined' ? 'server' : 'client',
    present,
    missing,
    count: { total: 6, present: present.length, missing: missing.length },
  });
}
