import buble from 'rollup-plugin-buble'
import typescript from 'rollup-plugin-typescript'
import pkg from './package.json'

export default {
  input: 'src/truncate.ts',
  output: {
    name: 'truncate-html',
    banner: `/*!
 * trancate-html v${pkg.version}
 * Copyright© ${new Date().getFullYear()} Saiya ${pkg.homepage}
 */`,
    format: process.env.format,
    file: `dist/truncate.${process.env.format}.js`
  },
  plugins: [
    typescript({
      typescript: require('typescript')
    }),
    buble()
  ]
}
