import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(__dirname, './src')
        },
    },
    test: {
        testTimeout: 60000, 
        globals: true,
        environment: 'jsdom'
    },
})