import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-text-900">
            <div className="h-7 w-7 rounded-md bg-primary-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            ReleaseFlow
          </Link>
        </div>
        {children}
        <div className="mt-6 text-center text-xs text-text-400">
          &copy; {new Date().getFullYear()} ReleaseFlow. All rights reserved.
        </div>
      </div>
    </div>
  );
}
