import { describe, it, expect, afterEach } from 'vitest'
import truncate from '../src/truncate'
import cheerio, { AnyNode, Cheerio } from 'cheerio'

describe('Truncate html', () => {
  describe('should works well when false params are given', () => {
    it('should NOT truncate a string if no string provided', () => {
      // @ts-expect-error test for null
      expect(truncate(null)).toBe(null)
    })

    it('should NOT truncate a string if NO length provided', () => {
      const html = 'string'

      expect(truncate(html)).toBe(html)
    })

    it("should NOT truncate a empty string", () => {
      const html = "";
      expect(truncate(html, 10)).toBe(html);
    });
    it("should NOT truncate a empty string instance", () => {
      const html = "";
      // third parameter for removing the document wrapper
      const $ = cheerio.load(html, {}, false);
      expect(truncate($)).toBe('');
    });

    it("should NOT truncate a comment string", () => {
      const html = "<!-- comment -->";

      expect(truncate(html, 2)).toBe('');
    });

    it('should NOT truncate a string if NO length provided $', () => {
      const html = 'string'
      const $ = cheerio.load(html)

      expect(truncate($)).toBe('<html><head></head><body>string</body></html>')
    })

    it('should NOT truncate a string if length is less than or equal to zero', () => {
      const html = 'string'

      expect(truncate(html, 0)).toBe(html)
    })

    it('should NOT truncate a string if length is less than or equal to zero $', () => {
      const html = 'string'
      const $ = cheerio.load(html)

      expect(truncate($, 0)).toBe('<html><head></head><body>string</body></html>')
    })
  })

  describe('truncate with options.length', () => {
    it('should truncate a string', () => {
      const test = '123456789'
      const expected = '12345...'

      expect(truncate(test, 5)).toBe(expected)
    })
    it('should truncate a string $', () => {
      const test = '123456789'
      const expected = '12345...'
      const $ = cheerio.load(test, null, false)
      expect(truncate($, 5)).toBe(expected)
    })

    it('should truncate a string with tags', () => {
      const test = '<p>123456789</p>'
      const expected = '<p>123456...</p>'

      expect(truncate(test, { length: 6 })).toBe(expected)
    })
    it('should kepp all the string if length logger than the origin string', () => {
      const test = '<p>123456789</p>'
      const expected = '<p>123456789</p>'

      expect(truncate(test, { length: 100 })).toBe(expected)
    })

    it('should truncate a string with characters outside of tags', () => {
      const test = '<p>12345</p>6789'
      const expected = '<p>12345</p>678...'

      expect(truncate(test, 8)).toBe(expected)
    })

    it('should works well when truncate at tag boundary', () => {
      const test = 'Hello <b>world</b>'
      const expected = 'Hello ...'

      expect(truncate(test, 6)).toBe(expected)
    })

    it('should works well when truncate at tag boundary-2', () => {
      const test = 'Hello <b>world</b>'
      const expected = 'Hello <b>world</b>'

      expect(truncate(test, 11)).toBe(expected)
    })

    it('should truncate a string two sets of tags', () => {
      const test = '<p>12345</p><p>6789</p>'
      const expected = '<p>12345</p><p>67...</p>'

      expect(truncate(test, 7)).toBe(expected)
    })

    it('should truncate a string two sets of tags $', () => {
      const test = cheerio.load('<p>12345</p><p>6789</p>', null, false)
      const expected = '<p>12345</p><p>67...</p>'

      expect(truncate(test, 7)).toBe(expected)
    })

    it('should keep empty tag', () => {
      const test =
        '<span></span><p>12345</p><p>6789</p><span> reset text </span>'
      const expected = '<span></span><p>12345</p><p>67...</p>'

      expect(truncate(test, 7)).toBe(expected)
    })

    it('should keep empty tag $', () => {
      const test =
        cheerio.load('<span></span><p>12345</p><p>6789</p><span> reset text </span>', null, false)
      const expected = '<span></span><p>12345</p><p>67...</p>'

      expect(truncate(test, 7)).toBe(expected)
    })

    it('should remove comment', () => {
      const test = '<span></span><!-- comment --><p>12345</p><p>6789</p>'
      const expected = '<span></span><p>12345</p><p>67...</p>'

      expect(truncate(test, 7)).toBe(expected)
    })

    it('should remove comment in tag', () => {
      const test = '<span></span><p><!-- comment -->12345</p><p>6789</p>'
      const expected = '<span></span><p>12345</p><p>67...</p>'

      expect(truncate(test, 7)).toBe(expected)
    })

    describe('works with options.reserveLastWord', () => {
      it('should reserve the last word', () => {
        const test = '<p>12345</p><p>6789</p>'
        const expected = '<p>12345</p><p>6789</p>'

        expect(
          truncate(test, 7, {
            reserveLastWord: true
          })
        ).toBe(expected)
      })

      it('should reserve the last word(i18n)', () => {
        const test = '<p>internationalization</p>'
        const expected = '<p>internationalization</p>'

        expect(
          truncate(test, 7, {
            reserveLastWord: 20 // exceed 20 letters
          })
        ).toBe(expected)
      })

      it('should cut at the last word(i18n)', () => {
        const test = '<p>internationalization</p>'
        const expected = '<p>internationalizat...</p>'

        expect(
          truncate(test, 7, {
            reserveLastWord: true // exceed 10 letters
          })
        ).toBe(expected)
      })

      it('should reserve the last word if only one word', () => {
        const test = '<p>internationalization</p>'
        const expected = '<p>internationalizat...</p>'

        expect(
          truncate(test, 7, {
            reserveLastWord: -1 // exceed 10 letters
          })
        ).toBe(expected)
      })

      it('should remove the last word if the edge if not the only one word', () => {
        const test = '<p>abc internationalization</p>'
        const expected = '<p>abc ...</p>'

        expect(
          truncate(test, 7, {
            reserveLastWord: -1 // exceed 10 letters
          })
        ).toBe(expected)
      })

      it('should cut the only word if trimTheOnlyWord true', () => {
        const test = '<p>internationalization</p>'
        const expected = '<p>interna...</p>'

        expect(
          truncate(test, 7, {
            reserveLastWord: -1, // exceed 10 letters
            trimTheOnlyWord: true
          })
        ).toBe(expected)
      })

      it('should reserve the last word if only one word $', () => {
        const test = cheerio.load('<p>internationalization</p>', null, false)
        const expected = '<p>internationalizat...</p>'

        expect(
          truncate(test, 7, {
            reserveLastWord: true // exceed 10 letters
          })
        ).toBe(expected)
      })

      it('should reserve the last word if at the boundary', () => {
        const test = '<p>Hello world from earth</p>'
        const expected = '<p>Hello world...</p>'

        expect(
          truncate(test, 11, {
            reserveLastWord: -1 // exceed 10 letters
          })
        ).toBe(expected)
      })

      it('should reserve the last word if at the boundary even trimTheOnlyWord is true ', () => {
        const test = '<p>Hello world from earth</p>'
        const expected = '<p>Hello world...</p>'

        expect(
          truncate(test, 11, {
            reserveLastWord: -1, // exceed 10 letters
            trimTheOnlyWord: true
          })
        ).toBe(expected)
      })

      // from issue #24
      it('should cut correctly if string\'s length is equal to the truncation length', () => {
        const test = '<p>a b c d ef</p>'
        const expected = '<p>a b c d ef</p>'
        expect(
          truncate(test, 10, {
            reserveLastWord: -1 // exceed 10 letters
          })
        ).toBe(expected)
      })

      it('should remove the last word if more than one(i18n, reserveLastWord negative)', () => {
        const test = '<p>hello internationalization</p>'
        const expected = '<p>hello ...</p>'

        expect(
          truncate(test, 7, {
            reserveLastWord: -1 // exceed 10 letters
          })
        ).toBe(expected)
      })
    })
  })

  describe('with self-close tags', () => {
    it('should truncate a string with an image tag', () => {
      const html = '<p><img src="abc.png">This is a string</p> for test.'
      const expected = '<p><img src="abc.png">This is a ...</p>'

      expect(truncate(html, 10)).toBe(expected)
    })

    it('should truncate a string with an image and br tags', () => {
      const html = '<p><img src="abc.png">This <br>is a string</p> for test.'
      const expected = '<p><img src="abc.png">This <br>is a ...</p>'

      expect(truncate(html, 10)).toBe(expected)
    })
  })

  describe('with options.stripTags', () => {
    it('should works well with plain text', () => {
      const html = 'This is a string for test.'
      const expected = 'This is a ...'
      const options = {
        stripTags: true
      }

      expect(truncate(html, 10, options)).toBe(expected)
    })

    it('should work with no text', () => {
      const test = '<p></p>'
      const expected = ''
      expect(truncate(test, 10, { stripTags: true })).toBe(expected)
    })

    it('should remove all tags', () => {
      const html =
        '<p><img src="abc.png">This <hr>is a string</p><br> for test.'
      const expected = 'This is a ...'
      const options = {
        stripTags: true
      }
      expect(truncate(html, 10, options)).toBe(expected)
    })
  })

  describe('with options.byWords', () => {
    it('should truncate by words', () => {
      const html = '<p><img src="abc.png">This is a string do</p> for test.'
      const expected = '<p><img src="abc.png">This is a string...</p>'
      const options = {
        byWords: true
      }
      expect(truncate(html, 4, options)).toBe(expected)
    })

    it('should reverse the whole string when if length is bigger', () => {
      const html = '<p><img src="abc.png">This is a string do</p> for test.'
      const expected = '<p><img src="abc.png">This is a string do</p> for test.'
      const options = {
        byWords: true
      }
      expect(truncate(html, 10, options)).toBe(expected)
    })

    it('should works well when truncate at tag boundary', () => {
      const test = 'Hello <b>world</b>'
      const expected = 'Hello...'
      const options = {
        byWords: true
      }
      expect(truncate(test, 1, options)).toBe(expected)
    })

    it('should works well when truncate at tag boundary', () => {
      const test = 'Hello <b>world</b>'
      const expected = 'Hello <b>world</b>'
      const options = {
        byWords: true
      }
      expect(truncate(test, 2, options)).toBe(expected)
    })

    describe('works with options.reserveLastWord', () => {
      it('should ignore reserveLastWord when byWords is on(length bigger)', () => {
        const html = '<p><img src="abc.png">This is a string do</p> for test.'
        const expected =
          '<p><img src="abc.png">This is a string do</p> for test.'
        const options = {
          byWords: true,
          reserveLastWord: true
        }
        expect(truncate(html, 10, options)).toBe(expected)
      })

      it('should ignore reserveLastWord when byWords is on(length smaller)', () => {
        const html = '<p><img src="abc.png">This is a string do</p> for test.'
        const expected = '<p><img src="abc.png">This is a...</p>'
        const options = {
          byWords: true,
          reserveLastWord: true
        }
        expect(truncate(html, 3, options)).toBe(expected)
      })
    })
  })

  describe('with options.whitespaces', () => {
    it('should trim whitespaces', () => {
      const html =
        '<p>         <img src="abc.png">This is a string</p> for test.'
      const expected = '<p> <img src="abc.png">This is a...</p>'
      const options = {
        keepWhitespaces: false
      }

      expect(truncate(html, 10, options)).toBe(expected)
    })

    it('should preserve whitespaces', () => {
      const html =
        '<p>         <img src="abc.png">This is a string</p> for test.'
      const expected = '<p>         <img src="abc.png">This is a...</p>'
      const options = {
        keepWhitespaces: true
      }

      expect(truncate(html, 10, options)).toBe(expected)
    })

    it('should preserve last whitespace at boundary', () => {
      const html =
        '<p>Hello         image. <img src="abc.png">This is   a string</p> for test.'
      const expected = '<p>Hello         image. <img src="abc.png">This is   ...</p>'
      const options = {
        keepWhitespaces: true
      }

      expect(truncate(html, 21, options)).toBe(expected)
    })

    it('should count continuous whitespaces as one', () => {
      const html =
        '<p>Hello         image. <img src="abc.png">This is a string</p> for test.'
      const expected = '<p>Hello         image. <img src="abc.png">This is...</p>'
      const options = {
        keepWhitespaces: true
      }

      expect(truncate(html, 20, options)).toBe(expected)
    })
  })

  describe('combine length and options', () => {
    it('should works with length and options separate', () => {
      const html = '<p><img src="abc.png">This is a string</p> for test.'
      const expected = 'This is a ...'
      const options = {
        stripTags: true
      }
      expect(truncate(html, 10, options)).toBe(expected)
    })

    it('should allow length argument to be combined into the options object', () => {
      const html = '<p><img src="abc.png">This is a string</p> for test.'
      const expected = 'This is a ...'
      const options = {
        length: 10,
        stripTags: true
      }
      expect(truncate(html, options)).toBe(expected)
    })
  })

  describe('with options.ellipsis', () => {
    it('should insert a custom ellipsis sign', () => {
      const html = '<p><img src="abc.png">This is a string</p> for test.'
      const expected = '<p><img src="abc.png">This is a ~</p>'
      const options = {
        length: 10,
        ellipsis: '~'
      }

      expect(truncate(html, options)).toBe(expected)
    })

    it('should not insert a custom ellipsis sign', () => {
      const html = '<p><img src="abc.png">This is a string</p> for test.'
      const expected = '<p><img src="abc.png">This is a string</p> for test.'
      const options = {
        length: 50,
        ellipsis: '~'
      }
      expect(truncate(html, options)).toBe(expected)
    })

    describe('last character in html tag', () => {
      const testString = '123456<div>7</div><div>89</div>12'

      it('should add ellipsis before a tag', () => {
        const expected = '123456...'
        expect(truncate(testString, 6)).toBe(expected)
      })

      it('should add ellipsis in a tag with one character', () => {
        const expected = '123456<div>7...</div>'
        expect(truncate(testString, 7)).toBe(expected)
      })

      it('should add ellipsis within tag', () => {
        const expected = '123456<div>7</div><div>8...</div>'
        expect(truncate(testString, 8)).toBe(expected)
      })

      it('should add ellipsis in a tag with multiple characters', () => {
        const expected = '123456<div>7</div><div>89...</div>'
        expect(truncate(testString, 9)).toBe(expected)
      })

      it('should add ellipsis after a character after closing tag', () => {
        const expected = '123456<div>7</div><div>89</div>1...'
        expect(truncate(testString, 10)).toBe(expected)
      })

      it('should add ellipsis in a nested tag ', () => {
        const test = '123456<div>7</div><div><b>89</b></div>12'
        const expected = '123456<div>7</div><div><b>89...</b></div>'
        expect(truncate(test, 9)).toBe(expected)
      })
    })
  })

  describe('with options.excludes', () => {
    it('should exclude elements by selector', () => {
      const html = '<p><img src="abc.png">This is a string</p> for test.'
      const expected = '<p>This is a ...</p>'
      const options = {
        length: 10,
        excludes: 'img'
      }

      expect(truncate(html, options)).toBe(expected)
    })

    it('should exclude multiple elements by selector', () => {
      const html =
        '<p><img src="abc.png">This is a string</p><div class="something-unwanted"> unwanted string inserted ( ´•̥̥̥ω•̥̥̥` ）</div> for test.'
      const expected = '<p>This is a string</p> for...'
      const options = {
        length: 20,
        excludes: ['img', '.something-unwanted']
      }

      expect(truncate(html, options)).toBe(expected)
    })
  })

  describe('with options.decodeEntities', () => {
    it('should handle encoded characters', () => {
      const html = '<p>&nbsp;test for &lt;p&gt; encoded string</p>'
      const expected = '<p> test for &lt;p&gt; encode...</p>'
      const options = {
        length: 20,
        decodeEntities: true
      }

      expect(truncate(html, options)).toBe(expected)
    })

    // it('should leave encoded characters as is', () => {
    //   const html = '<p>&nbsp;&nbsp;test for &lt;p&gt; encoded string</p>'
    //   const expected = '<p>&nbsp;&nbsp;test for &lt;p...</p>'
    //   const options = {
    //     length: 20,
    //     decodeEntities: false // this is the default value
    //   }

    //   expect(truncate(html, options)).toBe(expected)
    // })

    it('should leave encoded characters as is', () => {
      const html = '<p>&nbsp;test for &lt;p&gt; encoded string</p>'
      const expected = '<p> test for &lt;p&gt; encode...</p>'
      const options = {
        length: 20,
        decodeEntities: false // this is the default value
      }

      expect(truncate(html, options)).toBe(expected)
    })



    it('should works with CJK when decodeEntities is true', () => {
      const html = '<p>&nbsp;test for &lt;p&gt;&#64 中文 string</p>'
      const expected = '<p> test for &lt;p&gt;@ 中文 st...</p>'
      const options = {
        length: 20,
        decodeEntities: true
      }
      expect(truncate(html, options)).toBe(expected)
    })

    it('should convert CJK from encoded with decodeEntities to false', () => {
      const html = '<p>&nbsp;test for &lt;p&gt; &#x4E2D;&#x6587; string</p>'
      const expected = '<p> test for &lt;p&gt; 中文 str...</p>'
      const options = {
        length: 20,
        decodeEntities: true
      }

      expect(truncate(html, options)).toBe(expected)
    })

    it('should convert CJK from encoded with decodeEntities to false', () => {
      const html = '<p>&nbsp;test for &lt;p&gt;&#64 &#x4E2D;&#x6587; string</p>'
      const expected = '<p> test for &lt;p&gt;@ 中文 st...</p>'
      const options = {
        length: 20,
        decodeEntities: false
      }
      expect(truncate(html, options)).toBe(expected)
    })
  })

  describe('with truncate.setup', () => {
    afterEach(function () {
      truncate.setup({
        byWords: false,
        stripTags: false,
        ellipsis: "...",
        // @ts-expect-error only for test
        length: null,
        decodeEntities: false,
        keepWhitespaces: false,
        excludes: "",
        reserveLastWord: false,
      });
    })
    it('should works well if setup with empty', () => {
      // @ts-expect-error only for test
      truncate.setup()
      const test = 'hello from earth'
      const expected = 'hello from e...'

      expect(truncate(test, 12)).toBe(expected)
    })

    it('should use default length', () => {
      truncate.setup({ length: 5 })
      const test = '123456789'
      const expected = '12345...'

      expect(truncate(test)).toBe(expected)
    })

    it('should use default byWords settings', () => {
      truncate.setup({ byWords: true })
      const test = 'hello from earth'
      const expected = 'hello from...'

      expect(truncate(test, 2)).toBe(expected)
    })

    it('should use default reserveLastWord settings', () => {
      truncate.setup({ reserveLastWord: true })
      const test = 'hello from earth'
      const expected = 'hello from earth'

      expect(truncate(test, 12)).toBe(expected)
    })
  })

  describe('should correcty handle text with emoji characters', () => {
    afterEach(function () {
      truncate.setup({
        byWords: false,
        stripTags: false,
        ellipsis: "...",
        // @ts-expect-error only for test
        length: null,
        decodeEntities: false,
        keepWhitespaces: false,
        excludes: "",
        reserveLastWord: false,
      });
    })

    it('emojis with character length more than 1', () => {
      const test = '💩💩💩💩💩'
      const expected = '💩💩💩...'

      expect(truncate(test, 3)).toEqual(expected)
    })

    it('emojis with text', () => {
      const test = 'Hello there, how are you??  👍👍👍‍'
      const expected = 'Hello there, how are you?? 👍👍...'

      expect(truncate(test, 29)).toEqual(expected)
    })

    it('emojis with reservedLastWord setting', () => {
      truncate.setup({ reserveLastWord: true })
      const test = 'Hello there    😎😎😎‍'
      const expected = 'Hello there 😎...'

      expect(truncate(test, 13)).toEqual(expected)
    })

    it('emojis with byWords setting, with keepWhitespaces false', () => {
      truncate.setup({ byWords: true, keepWhitespaces: false })
      const test = 'Hello there, how   are    you??    😎😎😎‍'
      const expected = 'Hello there, how are you?? 😎😎😎‍'

      expect(truncate(test, 20)).toEqual(expected)
    })

    it('emojis with keepWhitespaces setting', () => {
      truncate.setup({ keepWhitespaces: true })
      const test = 'Hello there  💩  💩  💩‍'
      const expected = 'Hello there  💩  💩  💩‍'

      expect(truncate(test, 20)).toEqual(expected)
    })

    it("emojis with byWords setting", () => {
      truncate.setup({ byWords: true })
      const test = 'Hello there,   👋 how are you??'
      const expected = 'Hello there, 👋...'

      expect(truncate(test, 3)).toEqual(expected)
    });
  })

  describe('customNodeStrategy', () => {

    it('should works with customNodeStrategy is Keep', () => {
      const test = '<p>123456789<i>abc</i>efghijk</p>'
      const expected = '<p>123456789<i>abc</i>efg...</p>'
      const customNodeStrategy = (node: Cheerio<AnyNode>) => {
        if (node.prop('tagName') === 'I') return 'keep'
        return
      }
      expect(truncate(test, 12, { customNodeStrategy } )).toEqual(expected)
    })

    it('should works with customNodeStrategy is remove', () => {
      const test = "<p>123456789<i>abc</i>efghijk</p>";
      const expected = "<p>123456789efg...</p>";
      const customNodeStrategy = (node: Cheerio<AnyNode>) => {
        if (node.prop("tagName") === "I") return "remove";
        return;
      };
      expect(truncate(test, 12, { customNodeStrategy })).toEqual(expected);
    })

    it('should works with customNodeStrategy is custom node', () => {
      const test = '<div>123456789<details><summary>abc</summary>hello cccc</details></div>'
      const expected = '<div>123456789<details><summary>abc</summary>hello cccc</details></div>'
      const customNodeStrategy = (node: Cheerio<AnyNode>) => {
        if (node.prop('tagName') === 'DETAILS') {
          return node.find('summary')
        }
        return
      }
      expect(truncate(test, 12, { customNodeStrategy } )).toEqual(expected)
    })

    it('should works with customNodeStrategy is custom node', () => {
      const test = '<div>123456789<details><summary>abc</summary>hello cccc</details></div>'
      const expected = '<div>123456789<details><summary>abc</summary>hello cccc</details></div>'
      const customNodeStrategy = (node: Cheerio<AnyNode>) => {
        if (node.prop('tagName') === 'DETAILS') {
          return node.find('summary')
        }
        return
      }
      expect(truncate(test, 12, { customNodeStrategy } )).toEqual(expected)
    })

    it('should works with customNodeStrategy is custom node 2', () => {
      const test = '<div>123456789<details><summary>abc</summary>hello cccc</details>word</div>'
      const expected = '<div>123456789<details><summary>abc...</summary>hello cccc</details></div>'
      const customNodeStrategy = (node: Cheerio<AnyNode>) => {
        if (node.prop('tagName') === 'DETAILS') {
          return node.find('summary')
        }
        return
      }
      expect(truncate(test, 12, { customNodeStrategy } )).toEqual(expected)
    })

    it('should works with customNodeStrategy is custom node 3', () => {
      const test = '<div>123456789<details><summary>abc</summary>hello cccc</details>word</div>'
      const expected = '<div>123456789<details><summary>abc</summary>hello cccc</details>w...</div>'
      const customNodeStrategy = (node: Cheerio<AnyNode>) => {
        if (node.prop('tagName') === 'DETAILS') {
          return node.find('summary')
        }
        return
      }
      expect(truncate(test, 13, { customNodeStrategy } )).toEqual(expected)
    })
  })
})
