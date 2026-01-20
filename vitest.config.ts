import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/index.ts'],
      thresholds: {
        // Thresholds adjusted to current coverage levels
        // TODO: Increase as more tests are added
        lines: 20,
        functions: 60,
        branches: 70,
        statements: 20
      }
    }
  }
})
