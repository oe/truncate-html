import { describe, expect, it } from 'vitest'
import { load } from 'cheerio'
import truncate from '../src/truncate'

describe('Cheerio stable compatibility', () => {
  it.each([undefined, false, true])('preserves entity decoding with decodeEntities=%s', decodeEntities => {
    expect(truncate('<p>&amp;abcdef</p>', 3, { decodeEntities }))
      .toBe('<p>&amp;ab...</p>')
    expect(truncate('<p>&#x4E2D;&#x6587;abc</p>', 3, { decodeEntities }))
      .toBe('<p>中文a...</p>')
  })

  it('preserves parse5 table normalization and foster parenting', () => {
    expect(truncate('<table>abc<tr><td>def</td></tr>ghi</table>', 20))
      .toBe('abcghi<table><tbody><tr><td>def</td></tr></tbody></table>')
  })

  it('parses fragments without adding document wrappers', () => {
    expect(truncate('abc<b>def</b>', 4)).toBe('abc<b>d...</b>')
  })

  it('uses the parser settings of an existing Cheerio instance', () => {
    const $ = load('<p>&amp;abcdef</p>', {
      xml: { xmlMode: false, decodeEntities: false }
    }, false)
    expect(truncate($, 3, { decodeEntities: true })).toBe('<p>&am...</p>')
  })

  it('accepts nodes returned by a strategy on an existing Cheerio instance', () => {
    const $ = load('<div><details><summary>Click me</summary><p>Hidden</p></details>tail</div>', {}, false)
    expect(truncate($, 5, {
      customNodeStrategy: node => node.is('details') ? node.find('summary') : undefined
    })).toBe('<div><details><summary>Click...</summary><p>Hidden</p></details></div>')
  })
})
