export interface EnvValidation {
  valid: boolean;
  missing: string[];
  present: string[];
  message: string;
}

export function validateEnvironment(): EnvValidation {
  const checks: [string, string | undefined][] = [
    ['NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY],
    ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN],
    ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID],
    ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET],
    ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID],
    ['NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID],
  ];

  const missing: string[] = [];
  const present: string[] = [];

  for (const [name, value] of checks) {
    if (value) {
      present.push(name);
    } else {
      missing.push(name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
    message: missing.length === 0
      ? 'All required environment variables are configured.'
      : `Missing ${missing.length} required environment variable${missing.length > 1 ? 's' : ''}. Check .env.local`,
  };
}
