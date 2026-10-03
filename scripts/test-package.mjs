import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temp = mkdtempSync(join(tmpdir(), 'truncate-html-package-'))
const env = { ...process.env, npm_config_cache: join(temp, 'npm-cache') }
const run = (command, args, cwd = temp) => execFileSync(command, args, {
  cwd, env, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8'
})

try {
  const packed = JSON.parse(run('npm', [
    'pack', '--json', '--ignore-scripts', '--pack-destination', temp
  ], root))[0]
  writeFileSync(join(temp, 'package.json'), JSON.stringify({ private: true }))
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', join(temp, packed.filename)])
  const installed = join(temp, 'node_modules', 'truncate-html')
  const manifest = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'))
  assert.equal(manifest.dependencies.cheerio, '1.2.0')
  assert.ok(manifest.dependencies.domhandler, 'Public declarations need a direct domhandler dependency')

  const checks = `
assert.equal(typeof truncate, 'function');
assert.equal(truncate('<p>Hello world</p>', 5), '<p>Hello...</p>');
assert.equal(truncate('<p>&amp;abcdef</p>', 3), '<p>&amp;ab...</p>');
assert.equal(truncate('<p>中文abc</p>', 3), '<p>中文a...</p>');
assert.equal(truncate(load('<p>Hello world</p>', {}, false), 5), '<p>Hello...</p>');
assert.equal(truncate('<i>keep</i><b>abcdef</b>', 3, {
  customNodeStrategy: node => node.is('i') ? 'keep' : undefined
}), '<i>keep</i><b>abc...</b>');
truncate.setup({length: 3});
assert.equal(truncate('abcdef'), 'abc...');
truncate.setup({});
`
  writeFileSync(join(temp, 'consumer.cjs'), `
const assert = require('node:assert/strict');
const truncate = require('truncate-html');
const {load} = require('cheerio');
${checks}`)
  writeFileSync(join(temp, 'consumer.mjs'), `
import assert from 'node:assert/strict';
import truncate from 'truncate-html';
import {load} from 'cheerio';
${checks}`)
  run(process.execPath, ['consumer.cjs'])
  run(process.execPath, ['consumer.mjs'])

  // Exercise the published `module` entry through a bundler, preserving its
  // existing .js filename and the package's CommonJS main entry.
  const { buildSync } = createRequire(require.resolve('vite'))('esbuild')
  const bundle = buildSync({
    entryPoints: [join(temp, 'consumer.mjs')],
    outfile: join(temp, 'consumer-bundled.mjs'),
    bundle: true, platform: 'node', format: 'esm',
    mainFields: ['module', 'main'], external: ['cheerio'], metafile: true
  })
  assert.ok(Object.keys(bundle.metafile.inputs).some(path => path.endsWith(manifest.module)))
  run(process.execPath, ['consumer-bundled.mjs'])

  writeFileSync(join(temp, 'consumer.ts'), `
import truncate, {type ICustomNodeStrategy, type IFullOptions, type IOptions} from 'truncate-html';
import {load, type Cheerio} from 'cheerio';
import type {AnyNode} from 'domhandler';
const customNodeStrategy: ICustomNodeStrategy = (node: Cheerio<AnyNode>) => {
  if (node.is('i')) return 'keep';
  if (node.is('img')) return 'remove';
  if (node.is('details')) return node.find('summary');
  return undefined;
};
const options: IOptions = {length: 3, decodeEntities: false, customNodeStrategy};
const fullOptions: Partial<IFullOptions> = options;
const a: string = truncate('<p>abcdef</p>', options);
const b: string = truncate(load('<p>abcdef</p>', {}, false), 3, fullOptions);
truncate.setup(options);
`)
  const tsc = join(dirname(require.resolve('typescript/package.json')), 'bin', 'tsc')
  run(process.execPath, [tsc, '--noEmit', '--strict', '--esModuleInterop',
    '--module', 'commonjs', '--moduleResolution', 'node', '--target', 'es2020',
    '--typeRoots', join(root, 'node_modules', '@types'), 'consumer.ts'])
  console.log('Packed package passed CommonJS, native ESM, bundled module-entry and TypeScript consumer checks.')
} finally {
  rmSync(temp, { recursive: true, force: true })
}
