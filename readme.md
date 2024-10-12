<h1 align="center">truncate-html</h1>

<h5 align="center"> Truncate html string(even contains emoji chars) and keep tags in safe. You can custom ellipsis sign, ignore unwanted elements and truncate html by words. </h5>
<div align="center">
  <a href="https://github.com/oe/truncate-html/actions/workflows/main.yml">
    <img src="https://github.com/oe/truncate-html/actions/workflows/main.yml/badge.svg" alt="Github Actions">
  </a>
  <a href="#readme">
    <img src="https://img.shields.io/badge/%3C%2F%3E-typescript-blue" alt="code with typescript">
  </a>
  <a href="#readme">
    <img src="https://badge.fury.io/js/truncate-html.svg" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/truncate-html">
    <img src="https://img.shields.io/npm/dm/truncate-html.svg" alt="npm downloads">
  </a>
</div>

<br>

**Notice** This is a node module depends on [cheerio](https://github.com/cheeriojs/cheerio) _can only run on nodejs_. If you need a browser version, you may consider [truncate](https://github.com/pathable/truncate) or [nodejs-html-truncate](https://github.com/huang47/nodejs-html-truncate).

```javascript
const truncate = require('truncate-html')
truncate('<p><img src="xxx.jpg">Hello from earth!</p>', 2, { byWords: true })
// => <p><img src="xxx.jpg">Hello from ...</p>
```

## Installation

`npm install truncate-html` <br>
or <br>
`yarn add truncate-html`

## Try it online

Click **<https://npm.runkit.com/truncate-html>** to try.

## API

```ts
/**
 * custom node strategy, default to Cheerio<AnyNode>
 * * 'remove' to remove the node
 * * 'keep' to keep the node(and anything inside it) anyway
 * * Cheerio<AnyNode> truncate the returned node
 * * undefined or any falsy value to truncate original node
 */
type ICustomNodeStrategy = (node: Cheerio<AnyNode>) => 'remove' | 'keep' | Cheerio<AnyNode> | undefined

/**
 * truncate-html full options object
 */
interface IFullOptions {
  /**
   * remove all tags, default false
   */
  stripTags: boolean
  /**
   * ellipsis sign, default '...'
   */
  ellipsis: string
  /**
   * decode html entities(e.g. convert `&amp;` to `&`) before counting length, default false
   */
  decodeEntities: boolean
  /**
   * elements' selector you want ignore
   */
  excludes: string | string[]
  /**
   * custom node strategy, default to Cheerio<AnyNode>
   * * 'remove' to remove the node
   * * 'keep' to keep the node(and anything inside it) anyway
   * * Cheerio<AnyNode> truncate the returned node
   * * undefined or any falsy value to truncate original node
   */
  customNodeStrategy: ICustomNodeStrategy
  /**
   * how many letters(words if `byWords` is true) you want reserve
   */
  length: number
  /**
   * if true, length means how many words to reserve
   */
  byWords: boolean
  /**
   * how to deal with when truncate in the middle of a word
   *  1. by default, just cut at that position.
   *  2. set it to true, with max exceed 10 letters can exceed to reserver the last word
   *  3. set it to a positive number decide how many letters can exceed to reserve the last word
   *  4. set it to negative number to remove the last word if cut in the middle.
   */
  reserveLastWord: boolean | number
  /**
   * if reserveLastWord set to negative number, and there is only one word in the html string,  when trimTheOnlyWord set to true, the extra letters will be sliced if word's length longer than `length`.
   * see issue #23 for more details
   */
  trimTheOnlyWord: boolean
  /**
   * keep whitespaces, by default continuous paces will
   *  be replaced with one space, set it true to keep them
   */
  keepWhitespaces: boolean
}

/**
 * options interface for function
 */
type IOptions = Partial<IFullOptions>

function truncate(html: string | CheerioAPI, length?: number | IOptions,  truncateOptions?: IOptions): string
// and truncate.setup to change default options
truncate.setup(options: IOptions): void
```

### Default options

```js
{
  stripTags: false,
  ellipsis: '...',
  decodeEntities: false,
  excludes: '',
  byWords: false,
  reserveLastWord: false,
  trimTheOnlyWord: false,
  keepWhitespaces: false
}
```

You can change default options by using `truncate.setup`

e.g.

```ts
truncate.setup({ stripTags: true, length: 10 })
truncate('<p><img src="xxx.jpg">Hello from earth!</p>')
// => Hello from
```

or use existing [cheerio instance](https://github.com/cheeriojs/cheerio#loading)

```ts
import * as cheerio from 'cheerio'
truncate.setup({ stripTags: true, length: 10 })
// truncate option `decodeEntities` will not work
//    you should config it in cheerio options by yourself
const $ = cheerio.load('<p><img src="xxx.jpg">Hello from earth!</p>', {
  /** set decodeEntities if you need it */
  decodeEntities: true
  /* any cheerio instance options*/
}, false) // third parameter is for `isDocument` option, set to false to get rid of extra wrappers, see cheerio's doc for details
truncate($)
// => Hello from
```


## Notice

### Typescript support

This lib is written with typescript and has a type definition file along with it. ~~You may need to update your `tsconfig.json` by adding `"esModuleInterop": true` to the `compilerOptions` if you encounter some typing errors, see [#19](https://github.com/oe/truncate-html/issues/19).~~

```ts
import truncate, { type IOptions } from 'truncate-html'


const html = '<p><img src="abc.png"><i>italic<b>bold</b></i>This is a string</p> for test.'

const options: IOptions = {
  length: 10,
  byWords: true
}

truncate(html, options)
// => <p><img src="abc.png"><i>italic<b>bold...</b></i></p>
```

### custom node truncate strategy
In complex html string, you may want to keep some special elements and truncate the others. You can use `customNodeStrategy` to achieve this:
* return `'remove'` to remove the node
* `'keep'` to keep the node(and anything inside it) anyway
* `Cheerio<AnyNode>` to truncate the returned node, or any falsy value to truncate the original node.

```ts
import truncate, { type IOptions, type ICustomNodeStrategy } from 'truncate-html'

// argument node is a cheerio instance
const customNodeStrategy: ICustomNodeStrategy = node => {
  // remove img tag
  if (node.is('img')) {
    return 'remove'
  }
  // keep italic tag and its children
  if (node.is('i')) {
    return 'keep'
  }
  // truncate summary tag that inside details tag instead of details tag
  if (node.is('details')) {
    return node.find('summary')
  }
}

const html = '<div><img src="abc.png"><i>italic<b>bold</b></i><details><summary>Click me</summary><p>Some details</p></details>This is a string</div> for test.'

const options: IOptions = {
  length: 10,
  customNodeStrategy
}

truncate(html, options)
// => <div><i>italic<b>bold</b></i><details><summary>Click me</summary><p>Some details</p></details>Th...</div>


```



### About final string length

If the html string content's length is shorter than `options.length`, then no ellipsis will be appended to the final html string. If longer, then the final string length will be `options.length` + `options.ellipsis`. And if you set `reserveLastWord` to true or none zero number, the final string will be various.

### About html comments

All html comments `<!-- xxx -->` will be removed

### About dealing with none alphabetic languages

When dealing with none alphabetic languages, such as Chinese/Japanese/Korean, they don't separate words with whitespaces, so options `byWords` and `reserveLastWord` should only works well with alphabetic languages.

And the only dependency of this project `cheerio` has an issue when dealing with none alphabetic languages, see [Known Issues](#known-issues) for details.

### Using existing cheerio instance

If you want to use existing cheerio instance, truncate option `decodeEntities` will not work, you should set it in your own cheerio instance:

```js
var html = '<p><img src="abc.png">This is a string</p> for test.'
const $ = cheerio.load(`${html}`, {
  decodeEntities: true
  /** other cheerio options */
}, false) // third parameter is for `isDocument` option, set to false to get rid of extra wrappers, see cheerio's doc for details
truncate($, 10)

```

## Examples

```javascript
var truncate = require('truncate-html')

// truncate html
var html = '<p><img src="abc.png">This is a string</p> for test.'
truncate(html, 10)
// returns: <p><img src="abc.png">This is a ...</p>

// truncate string with emojis
var string = '<p>poo 💩💩💩💩💩<p>'
truncate(string, 6)
// returns: <p>poo 💩💩...</p>

// with options, remove all tags
var html = '<p><img src="abc.png">This is a string</p> for test.'
truncate(html, 10, { stripTags: true })
// returns: This is a ...

// with options, truncate by words.
//  if you try to truncate none alphabet language(like CJK)
//      it will not act as you wish
var html = '<p><img src="abc.png">This is a string</p> for test.'
truncate(html, 3, { byWords: true })
// returns: <p><img src="abc.png">This is a ...</p>

// with options, keep whitespaces
var html = '<p>         <img src="abc.png">This is a string</p> for test.'
truncate(html, 10, { keepWhitespaces: true })
// returns: <p>         <img src="abc.png">This is a ...</p>

// combine length and options
var html = '<p><img src="abc.png">This is a string</p> for test.'
truncate(html, {
  length: 10,
  stripTags: true
})
// returns: This is a ...

// custom ellipsis sign
var html = '<p><img src="abc.png">This is a string</p> for test.'
truncate(html, {
  length: 10,
  ellipsis: '~'
})
// returns: <p><img src="abc.png">This is a ~</p>

// exclude some special elements(by selector), they will be removed before counting content's length
var html = '<p><img src="abc.png">This is a string</p> for test.'
truncate(html, {
  length: 10,
  ellipsis: '~',
  excludes: 'img'
})
// returns: <p>This is a ~</p>

// exclude more than one category elements
var html =
  '<p><img src="abc.png">This is a string</p><div class="something-unwanted"> unwanted string inserted ( ´•̥̥̥ω•̥̥̥` ）</div> for test.'
truncate(html, {
  length: 20,
  stripTags: true,
  ellipsis: '~',
  excludes: ['img', '.something-unwanted']
})
// returns: This is a string for~

// handing encoded characters
var html = '<p>&nbsp;test for &lt;p&gt; encoded string</p>'
truncate(html, {
  length: 20,
  decodeEntities: true
})
// returns: <p> test for &lt;p&gt; encode...</p>

// when set decodeEntities false
var html = '<p>&nbsp;test for &lt;p&gt; encoded string</p>'
truncate(html, {
  length: 20,
  decodeEntities: false // this is the default value
})
// returns: <p>&nbsp;test for &lt;p...</p>

// and there may be a surprise by setting `decodeEntities` to true  when handing CJK characters
var html = '<p>&nbsp;test for &lt;p&gt; 中文 string</p>'
truncate(html, {
  length: 20,
  decodeEntities: true
})
// returns: <p> test for &lt;p&gt; &#x4E2D;&#x6587; str...</p>
// to fix this, see below for instructions


// custom node strategy to keep some special elements
var html = '<p><img src="abc.png"><i>italic<b>bold</b></i>This is a string</p> for test.'
truncate(html, {
  length: 10,
  customNodeStrategy: node => {
    if (node.is('img')) {
      return 'remove'
    }
    if (node.is('i')) {
      return 'keep'
    }
  }
})
// returns: <p><i>italic<b>bold</b></i>This is a ...</p>

// custom node strategy to truncate summary instead of original node
var html = '<div><details><summary>Click me</summary><p>Some details</p></details>other things</div>'
truncate(html, {
  length: 10,
  customNodeStrategy: node => {
    if (node.is('details')) {
      return node.find('summary')
    }
  }
})
// returns: <div><details><summary>Click me</summary><p>Some details</p></details>ot...</div>
```

for More usages, check [truncate.spec.ts](./test/truncate.spec.ts)

## Credits

Thanks to:

- [@calebeno](https://github.com/calebeno) es6 support and unit tests
- [@aaditya-thakkar](https://github.com/aaditya-thakkar) emoji truncating support
