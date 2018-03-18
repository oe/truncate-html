import buble from 'rollup-plugin-buble'
import pkg from './package.json'

export default {
  input: 'src/truncate.js',
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
    buble()
  ]
}
