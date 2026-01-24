import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules',
      '.next',
      'dist',
      'src/**/__tests__/setup.ts',
      'src/**/__tests__/fixtures/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'src/**/*.d.ts',
        'src/types/**',
        'vitest.config.ts',
      ],
    },
    setupFiles: ['./src/lib/db/__tests__/setup.ts'],
    // Reset mocks between tests
    mockReset: true,
    // Restore mocks after each test
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
