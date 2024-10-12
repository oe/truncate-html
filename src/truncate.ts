import cheerio, { CheerioAPI, Cheerio, AnyNode } from 'cheerio'

/**
 * custom node strategy, default to Cheerio<AnyNode>
 * * 'remove' to remove the node
 * * 'keep' to keep the node(and anything inside it) anyway
 * * Cheerio<AnyNode> truncate the returned node
 * * undefined or any falsy value to truncate original node
 */
export type ICustomNodeStrategy = (node: Cheerio<AnyNode>) => 'remove' | 'keep' | Cheerio<AnyNode> | undefined

/**
 * truncate-html full options object
 */
export interface IFullOptions {
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

type ITruncateOptions = IFullOptions & { limit: number }

/**
 * options interface for function
 */
export type IOptions = Partial<IFullOptions>

const astralRange = /\ud83c[\udffb-\udfff](?=\ud83c[\udffb-\udfff])|(?:[^\ud800-\udfff][\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]?|[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g

const defaultOptions: IOptions = {
  // remove all tags
  stripTags: false,
  // postfix of the string
  ellipsis: '...',
  // decode html entities
  decodeEntities: false,
  // whether truncate by words
  byWords: false,
  // // truncate by words, set to true keep words
  // // set to number then truncate by word count
  // length: 0
  excludes: '', // remove tags
  customNodeStrategy: (n: Cheerio<AnyNode>) => n,
  reserveLastWord: false, // keep word completed if truncate at the middle of the word, works no matter byWords is true/false
  trimTheOnlyWord: false,
  keepWhitespaces: false // even if set true, continuous whitespace will count as one
}

// an special object to store user's default options, keep the defaultOptions clean
let userDefaults: IOptions = defaultOptions

export default function truncate(html: string | CheerioAPI, length?: number | IOptions,  truncateOptions?: IOptions) {
  const options = sanitizeOptions(length, truncateOptions)

  if (!html ||
    isNaN(options.length) ||
    options.length < 1 ||
    options.length === Infinity) {
    return html
  }

  let $: CheerioAPI

  if (isCheerioInstance(html)) {
    $ = html as CheerioAPI
  } else {
    // Add a wrapper for text node without tag like:
    //   <p>Lorem ipsum <p>dolor sit => <div><p>Lorem ipsum <p>dolor sit</div>
    $ = cheerio.load(`${html}`, {
      decodeEntities: options.decodeEntities
    }, false)
  }

  const $html = $.root()
  // remove excludes elements
  if (options.excludes) $html.find(options.excludes as string).remove()

  if (options.stripTags) {
    return truncateText($html.text(), options)
  }

  const travelChildren = function ($ele: Cheerio<AnyNode>, isParentLastNode = true) {
    const contents = $ele.contents()
    const lastIdx = contents.length - 1
    return contents.each(function (this: AnyNode, idx) {
      const nodeType = this.type
      const node = $(this)
      if (nodeType === 'text') {
        if (!options.limit) {
          node.remove()
          return
        }
        this.data = truncateText(
          node.text(),
          options,
          isParentLastNode && idx === lastIdx
        )
        return
      }
      if (nodeType === 'tag') {
        if (!options.limit) {
          node.remove()
          return
        }
        const strategy = options.customNodeStrategy(node)
        if(strategy === 'remove') {
          node.remove()
          return
        }
        if (strategy === 'keep') {
          return
        }
        travelChildren(strategy || node, isParentLastNode && idx === lastIdx)
        return
      }
      // for comments and other node types
      node.remove()
      return
    })
  }

  travelChildren($html)
  return $html.html()
}

truncate.setup = function (options: IOptions) {
  userDefaults = extendOptions(options, defaultOptions)
}


function truncateText(text: string, options: ITruncateOptions, isLastNode?: boolean): string {
  if (!options.keepWhitespaces) {
    text = text.replace(/\s+/g, ' ')
  }
  const byWords = options.byWords
  const match = text.match(astralRange)
  const astralSafeCharacterArray = match === null ? [] : match
  const strLen = match === null ? 0 : astralSafeCharacterArray.length
  let idx = 0
  let count = 0
  let prevIsBlank = byWords
  let curIsBlank = false
  while (idx < strLen) {
    curIsBlank = isBlank(astralSafeCharacterArray[idx++])
    // keep same then continue
    if (byWords && prevIsBlank === curIsBlank) continue
    if (count === options.limit) {
      // reserve trailing whitespace, only when prev is blank too
      if (prevIsBlank && curIsBlank) {
        prevIsBlank = curIsBlank
        continue
      }
      // fix idx because current char belong to next words which exceed the limit
      --idx
      break
    }

    if (byWords) {
      if (!curIsBlank) ++count
    } else {
      if (!(curIsBlank && prevIsBlank)) ++count
    }
    prevIsBlank = curIsBlank
  }
  options.limit -= count
  if (options.limit) {
    return text
  }
  let str: string
  if (byWords) {
    str = text.substring(0, idx)
  } else {
    // @ts-expect-error fix ts error caused by regex
    str = astralSafeCharacterArray.length ? substr(astralSafeCharacterArray, idx, options) : ''
  }
  if (str === text) {
    // if is lat node, no need of ellipsis, or add it
    return isLastNode ? text : text + options.ellipsis
  } else {
    return str + options.ellipsis
  }
}

function substr (astralSafeCharacterArray: RegExpMatchArray, len: number, options: IFullOptions) {
  const sliced = astralSafeCharacterArray.slice(0, len).join('')
  if (!options.reserveLastWord || astralSafeCharacterArray.length === len) {
    return sliced
  }
  const boundary = astralSafeCharacterArray.slice(len - 1, len + 1).join('')
  // if truncate at word boundary, just return
  if (/\W/.test(boundary)) {
    return sliced
  }
  if (typeof options.reserveLastWord === 'number' && options.reserveLastWord < 0) {
    const result = sliced.replace(/\w+$/, '')
    // if the sliced is not the first and the only word
    //   then return result, or return the whole word
    if (!(result.length === 0 && sliced.length === options.length)) {
      return result
    }
    if (options.trimTheOnlyWord) return sliced
  }

  // set max exceeded to 10 if this.reserveLastWord is true or < 0
  const maxExceeded =
    options.reserveLastWord !== true && options.reserveLastWord > 0
      ? options.reserveLastWord
      : 10
  const mtc = astralSafeCharacterArray.slice(len).join('').match(/(\w+)/)
  const exceeded = mtc ? mtc[1] : ''
  return sliced + exceeded.substring(0, maxExceeded)
}

function sanitizeOptions(length?: number | IOptions,  truncateOptions?: IOptions) {
  switch (typeof length) {
    case 'object':
      truncateOptions = length
      break
    case 'number':
      if (typeof truncateOptions === 'object') {
        truncateOptions.length = length
      } else {
        truncateOptions = {
          length: length
        }
      }
  }
  if (truncateOptions && truncateOptions.excludes) {
    if (!Array.isArray(truncateOptions.excludes)) {
      truncateOptions.excludes = [truncateOptions.excludes]
    }
    truncateOptions.excludes = truncateOptions.excludes.join(',')
  }
  const options = extendOptions(Object.assign({}, userDefaults, truncateOptions), defaultOptions)
  options.limit = options.length
  return options as unknown as ITruncateOptions
}

// test a char whether a whitespace char
function isBlank (char) {
  return (
    char === ' ' ||
    char === '\f' ||
    char === '\n' ||
    char === '\r' ||
    char === '\t' ||
    char === '\v' ||
    char === '\u00A0' ||
    char === '\u2028' ||
    char === '\u2029'
  )
}

function extendOptions(options: Record<string, unknown>, defaultOptions: Record<string, unknown>){
  if (options == null) {
    options = {}
  }
  for (const k in defaultOptions) {
    const v = defaultOptions[k]
    if (options[k] != null) {
      continue
    }
    options[k] = v
  }
  return options
}

/** return true if elem is CheerioStatic */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isCheerioInstance (elem: any): elem is CheerioAPI {
  return elem &&
    elem.contains &&
    elem.html &&
    elem.parseHTML && true
}
