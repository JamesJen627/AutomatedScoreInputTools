import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve('src/shared'),
      '@domain': resolve('src/domain'),
      '@app': resolve('src/app')
    }
  },
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/scoring/**/*.ts'],
      exclude: ['src/domain/scoring/index.ts']
    }
  }
})
