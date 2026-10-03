import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { afterEach, describe, expect, it } from 'vitest'
import truncate from '../src/truncate'

const require = createRequire(import.meta.url)
const readme = readFileSync(new URL('../readme.md', import.meta.url), 'utf8')
const examples = [...readme.matchAll(/```(?:javascript|js|ts)\n([\s\S]*?)```/g)]
  .map((match, index) => ({
    block: index + 1,
    source: match[1],
    expected: [...match[1].matchAll(/^\/\/ (?:returns:|=>) (.*)$/gm)].map(result => result[1])
  }))
  .filter(example => example.expected.length > 0)

// Capture the actual calls printed in README examples. Expected outputs are
// read from the document so future edits cannot silently leave them stale.
const captureCalls: ts.TransformerFactory<ts.SourceFile> = context => source => {
  const visit: ts.Visitor = node => {
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)
      && ts.isIdentifier(node.expression.expression)
      && node.expression.expression.text === 'truncate') {
      return ts.factory.updateExpressionStatement(node,
        ts.factory.createCallExpression(ts.factory.createIdentifier('capture'), undefined, [node.expression]))
    }
    return ts.visitEachChild(node, visit, context)
  }
  return ts.visitNode(source, visit) as ts.SourceFile
}

describe('README executable examples', () => {
  afterEach(() => truncate.setup({}))

  it('contains examples with expected output', () => {
    expect(examples.length).toBeGreaterThan(0)
  })

  it.each(examples)('matches the documented output of block $block', example => {
    truncate.setup({})
    const actual: string[] = []
    const compiled = ts.transpileModule(example.source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true
      },
      transformers: { before: [captureCalls] }
    }).outputText
    runInNewContext(compiled, {
      truncate,
      capture: (output: string) => actual.push(output),
      require: (id: string) => id === 'truncate-html' ? truncate : require(id),
      exports: {}
    })
    expect(actual).toEqual(example.expected)
  })
})
