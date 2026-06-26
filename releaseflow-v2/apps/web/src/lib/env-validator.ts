const REQUIRED_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

export interface EnvValidation {
  valid: boolean;
  missing: string[];
  present: string[];
  message: string;
}

export function validateEnvironment(): EnvValidation {
  const missing: string[] = [];
  const present: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (process.env[key]) {
      present.push(key);
    } else {
      missing.push(key);
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
