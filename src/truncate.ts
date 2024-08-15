import cheerio, { CheerioAPI, Cheerio, AnyNode } from 'cheerio'
// type CheerioAPI = ReturnType<typeof cheerio['load']>
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
   *  4. set it to negetive number to remove the last word if cut in the middle.
   */
  reserveLastWord: boolean | number
  /**
   * if reserveLastWord set to negetive number, and there is only one word in the html string,  when trimTheOnlyWord set to true, the extra letters will be cutted if word's length longer than `length`.
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
export type IOptions = Partial<IFullOptions>

interface IHelper {
  options: IOptions
  limit: IFullOptions['length']
  ellipsis: IFullOptions['ellipsis']
  keepWhitespaces: IFullOptions['keepWhitespaces']
  reserveLastWord: IFullOptions['reserveLastWord']
  trimTheOnlyWord: IFullOptions['trimTheOnlyWord']
  setup (len: number, options?: IOptions): void
  setup (options: IOptions): void
  extend (a: any, b: any): any
  isBlank (char: string): boolean
  truncate (text: string, isLastNode?: boolean): string
  substr (arr: Array<string>, len: number): string
}

// default options
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
  reserveLastWord: false, // keep word completed if truncate at the middle of the word, works no matter byWords is true/false
  trimTheOnlyWord: false,
  keepWhitespaces: false // even if set true, continuous whitespace will count as one
}

const astralRange = /\ud83c[\udffb-\udfff](?=\ud83c[\udffb-\udfff])|(?:[^\ud800-\udfff][\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]?|[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g

// helper method
const helper = {
  setup (length: number | IOptions, options?: IOptions) {
    switch (typeof length) {
      case 'object':
        options = length
        break
      case 'number':
        if (typeof options === 'object') {
          options.length = length
        } else {
          options = {
            length: length
          } as IOptions
        }
    }
    const fullOptions = this.extend(options, defaultOptions) as IFullOptions
    // if (typeof fullOptions.length !== 'number') throw new TypeError('truncate-html: options.length should be a number')
    if (fullOptions.excludes) {
      if (!Array.isArray(fullOptions.excludes)) {
        fullOptions.excludes = [fullOptions.excludes]
      }
      fullOptions.excludes = fullOptions.excludes.join(',')
    }
    this.options = fullOptions
    this.limit = fullOptions.length
    this.ellipsis = fullOptions.ellipsis
    this.keepWhitespaces = fullOptions.keepWhitespaces
    this.reserveLastWord = fullOptions.reserveLastWord
    this.trimTheOnlyWord = fullOptions.trimTheOnlyWord
  },
  // extend obj with dft
  extend (obj, dft) {
    if (obj == null) {
      obj = {}
    }
    for (const k in dft) {
      const v = dft[k]
      if (obj[k] != null) {
        continue
      }
      obj[k] = v
    }
    return obj
  },
  // test a char whether a whitespace char
  isBlank (char) {
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
  },
  /**
   * truncate text
   * @param  {String}  text        text to truncate
   * @param  {Boolean} isLastNode  is last dom node, help to decide whether add ellipsis
   * @return {String}
   */
  truncate (text, isLastNode) {
    if (!this.keepWhitespaces) {
      text = text.replace(/\s+/g, ' ')
    }
    const byWords = this.options.byWords
    const match = text.match(astralRange)
    const astralSafeCharacterArray = match === null ? [] : match
    const strLen = match === null ? 0 : astralSafeCharacterArray.length
    let idx = 0
    let count = 0
    let prevIsBlank = byWords
    let curIsBlank = false
    while (idx < strLen) {
      curIsBlank = this.isBlank(astralSafeCharacterArray[idx++])
      // keep same then continue
      if (byWords && prevIsBlank === curIsBlank) continue
      if (count === this.limit) {
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
        curIsBlank || ++count
      } else {
        (curIsBlank && prevIsBlank) || ++count
      }
      prevIsBlank = curIsBlank
    }
    this.limit -= count
    if (this.limit) {
      return text
    } else {
      let str
      if (byWords) {
        str = text.substr(0, idx)
      } else {
        str = this.substr(astralSafeCharacterArray, idx)
      }
      if (str === text) {
        // if is lat node, no need of ellipsis, or add it
        return isLastNode ? text : text + this.ellipsis
      } else {
        return str + this.ellipsis
      }
    }
  },
  // deal with cut string in the middle of a word
  substr (astralSafeCharacterArray, len) {
    // var boundary, cutted, result
    const cutted = astralSafeCharacterArray.slice(0, len).join('')
    if (!this.reserveLastWord || astralSafeCharacterArray.length === len) {
      return cutted
    }
    const boundary = astralSafeCharacterArray.slice(len - 1, len + 1).join('')
    // if truncate at word boundary, just return
    if (/\W/.test(boundary)) {
      return cutted
    }
    if (typeof this.reserveLastWord === 'number' && this.reserveLastWord < 0) {
      const result = cutted.replace(/\w+$/, '')
      // if the cutted is not the first and the only word
      //   then return result, or return the whole word
      if (!(result.length === 0 && cutted.length === this.options.length)) {
        return result
      }
      if (this.trimTheOnlyWord) return cutted
    }

    // set max exceeded to 10 if this.reserveLastWord is true or < 0
    const maxExceeded =
      this.reserveLastWord !== true && this.reserveLastWord > 0
        ? this.reserveLastWord
        : 10
    const mtc = astralSafeCharacterArray.slice(len).join('').match(/(\w+)/)
    const exceeded = mtc ? mtc[1] : ''
    return cutted + exceeded.substr(0, maxExceeded)
  }
} as any as IHelper

/** return true if elem is CheerioStatic */
function isCheerioInstance (elem: any): elem is CheerioAPI {
  return elem &&
    elem.contains &&
    elem.html &&
    elem.parseHTML && true
}

/**
 * truncate html interface
 */
interface ITruncateHtml {
  (html: string | CheerioAPI, length?: number, options?: IOptions): string
  (html: string | CheerioAPI, options?: IOptions): string
  setup: (option: IOptions) => void
}

/**
 * truncate html
 * @method truncate(html, [length], [options])
 * @param  {String}         html    html string to truncate
 * @param  {Object|number}  length how many letters(words if `byWords` is true) you want reserve
 * @param  {Object|null}    options
 * @return {String}
 */
const truncate = function (html: string | CheerioAPI, length?: any, options?: any) {
  helper.setup(length, options)
  if (!html ||
    isNaN(helper.limit) ||
    helper.limit <= 0 ||
    helper.limit === Infinity) {
    return html
  }

  // if (helper.limit)
  let $: CheerioAPI
  // support provied cheerio
  if (isCheerioInstance(html)) {
    $ = html as CheerioAPI
  } else {
    // Add a wrapper for text node without tag like:
    //   <p>Lorem ipsum <p>dolor sit => <div><p>Lorem ipsum <p>dolor sit</div>
    $ = cheerio.load(`${html}`, {
      decodeEntities: helper.options.decodeEntities
    }, false)
  }
  const $html = $.root()
  // remove excludes elements
  helper.options.excludes && $html.find(helper.options.excludes as string).remove()
  // strip tags and get pure text
  if (helper.options.stripTags) {
    return helper.truncate($html.text())
  }
  const travelChildren = function ($ele: Cheerio<AnyNode>, isParentLastNode = true) {
    const contents = $ele.contents()
    const lastIdx = contents.length - 1
    return contents.each(function (this: AnyNode, idx) {
      switch (this.type) {
        case 'text':
          if (!helper.limit) {
            $(this).remove()
            return
          }
          this.data = helper.truncate(
            $(this).text(),
            isParentLastNode && idx === lastIdx
          )
          break
        case 'tag':
          if (!helper.limit) {
            $(this).remove()
          } else {
            return travelChildren($(this), isParentLastNode && idx === lastIdx)
          }
          break
        default:
          // for comments
          return $(this).remove()
      }
    })
  }
  travelChildren($html)
  return $html.html()
} as ITruncateHtml

truncate.setup = (options = {}) => {
  return Object.assign(defaultOptions, options)
}

// fix parcel exporting issue
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export = truncate
