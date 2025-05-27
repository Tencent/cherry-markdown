import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(__dirname, './src')
        },
    },
    test: {
        testTransformMode: {
            web: ['\\.[jt]sx$'],
        },
        globals: true,
        environment: 'jsdom', // Use jsdom for browser-like tests
        coverage: {
            reporter: ['text', 'json', 'html'], // Optional: Add coverage reports
        },
    },
})