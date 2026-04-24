
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: 'cjs',
  fixedExtension: true,
  target: 'node18',
  clean: true,
  platform: 'node',
  skipNodeModulesBundle: true,
  shims: true,
  bundleDts: true,
  onSuccess() {
    console.info('🙏 Build succeeded!')
  },
})
