'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from '@firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { validateEnvironment } from '@/lib/env-validator';
import { ConfigErrorScreen } from '@/components/config-error';

interface AuthContextValue {
  user: User | null | undefined;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: undefined, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [env] = useState(() => {
  const result = validateEnvironment();

  console.log("Environment validation:", result);

  console.log("Direct env:", {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  return result;
});;
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!env.valid) {
      setLoading(false);
      return;
    }

    const auth = getAuthInstance();
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsub;
  }, [env.valid]);

  if (!env.valid) {
    return <ConfigErrorScreen missing={env.missing} present={env.present} />;
  }

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
