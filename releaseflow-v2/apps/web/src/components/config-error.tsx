'use client';

interface ConfigErrorProps {
  missing: string[];
  present: string[];
}

export function ConfigErrorScreen({ missing, present }: ConfigErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-danger-200 bg-layer-2 shadow-modal p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-danger-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-surface-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-900">Configuration Error</h1>
            <p className="text-sm text-text-500">Firebase has not been configured.</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-2">Missing Variables</p>
            <div className="space-y-1">
              {missing.map((v) => (
                <div key={v} className="flex items-center gap-2 text-sm">
                  <span className="text-danger-500">✗</span>
                  <code className="text-danger-500 text-xs font-mono">{v}</code>
                </div>
              ))}
            </div>
          </div>

          {present.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-text-400 uppercase tracking-wider mb-2">Configured</p>
              <div className="space-y-1">
                {present.map((v) => (
                  <div key={v} className="flex items-center gap-2 text-sm">
                    <span className="text-success-500">✓</span>
                    <code className="text-success-500 text-xs font-mono">{v}</code>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg bg-surface-100 p-4 text-sm text-text-600">
          <p className="font-medium mb-1">To fix this:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-text-500">
            <li>Copy <code className="text-text-700 font-mono">.env.local.example</code> to <code className="text-text-700 font-mono">.env.local</code></li>
            <li>Fill in values from your Firebase project console</li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
