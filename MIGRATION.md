# Migrating to truncate-html 2.0

Version 2.0 replaces `cheerio@1.0.0-rc.12` with the stable `cheerio@1.2.0`.

## Node.js requirement

Node.js **20.18.1 or newer** is required. CI covers that minimum plus Node.js 22
and 24. Use a maintained Node.js LTS release for production. If you cannot upgrade
Node.js yet, stay on truncate-html 1.x.

## Truncation API and HTML output

The default export, `truncate(html, length, options)`, `truncate(html, options)`,
`truncate.setup(options)` and `customNodeStrategy` remain available. String input
continues to use parse5 in fragment mode, preserving HTML normalization, entity
counting and existing truncation behavior.

`decodeEntities` remains accepted but is deprecated. With string input, entities
are always decoded before counting characters, regardless of this option. This
matches the actual behavior of 1.x with Cheerio RC. Earlier documentation claimed
that `false` preserved raw entities; that did not match the default parser.

Do not move this option into a Cheerio `xml` configuration to emulate the default
parser: that switches to htmlparser2, even with `xmlMode: false`, changing HTML
normalization and entity handling. A supplied Cheerio instance still retains its
own parser configuration; truncate-html does not override it.

## Direct Cheerio usage and TypeScript

If your application creates Cheerio instances or explicitly annotates strategy
callbacks with Cheerio types, upgrade its own Cheerio dependency to 1.2.0 as well.
RC and stable types are not interchangeable: stable `CheerioAPI` includes new
members such as `extract`, and parser types have changed.

Cheerio no longer has a default export. Import `load` by name, and import DOM
node types from `domhandler`:

```ts
import { load, type Cheerio } from 'cheerio'
import type { AnyNode } from 'domhandler'
import truncate, { type ICustomNodeStrategy } from 'truncate-html'

const customNodeStrategy: ICustomNodeStrategy = (node: Cheerio<AnyNode>) => {
  if (node.is('img')) return 'remove'
  return undefined
}

const $ = load('<p>Hello <img src="photo.png">world</p>', {}, false)
truncate($, 5, { customNodeStrategy })
```

Declare `cheerio` and `domhandler` directly in your application if you import
them. Alternatively, let `ICustomNodeStrategy` infer the callback's node type.

CommonJS `require('truncate-html')` and the existing `main`, `module` and `types`
entry points are unchanged. Cheerio itself now has additional dependencies for
loading URLs and streams; truncate-html does not expose or call those APIs.
