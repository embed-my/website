import { defineConfig } from 'vitest/config'

// The Worker runs as Cloudflare runs it, in its runtime on this computer, which wrangler starts:
// a bundle of the server and the 15 MB it carries, built once for the file's tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000
  }
})
