import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./Inventory/src/setupTests.js'],
    deps: {
      optimizer: {
        web: { include: ['@testing-library/react'] }
      }
    }
  }
})
