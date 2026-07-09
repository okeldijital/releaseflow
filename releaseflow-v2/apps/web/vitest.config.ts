import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Subpath aliases must precede the package root alias so the more
      // specific mapping wins over the prefix match.
      '@releaseflow/core/auth/permissions': path.resolve(__dirname, '../../packages/core/src/auth/permissions.ts'),
      '@releaseflow/core/auth/roles': path.resolve(__dirname, '../../packages/core/src/auth/roles.ts'),
      '@releaseflow/core/auth/registry': path.resolve(__dirname, '../../packages/core/src/auth/registry.ts'),
      '@releaseflow/core/auth/authorization': path.resolve(__dirname, '../../packages/core/src/auth/authorization.ts'),
      '@releaseflow/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
});
