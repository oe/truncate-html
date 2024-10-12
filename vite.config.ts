/// <reference types="vitest" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  root: './',
  test: {
    watch: false,
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    exclude: ['node_modules', 'scripts', 'dist'],
  },
  build: {
    minify: false,
    outDir: 'dist',
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: 'src/truncate.ts',
      name: 'truncate',
      // the proper extensions will be added
      formats: ['es', 'cjs'],
      fileName: (format) => `truncate.${format}.js`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['cheerio'],
    },
  },
  plugins: [dts()],
})
