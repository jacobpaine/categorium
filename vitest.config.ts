import { defineConfig } from 'vitest/config';

// Pure config for the test runner. No Vite plugins are needed because the
// foundation tests cover the React-free domain / validation / schema layers.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
