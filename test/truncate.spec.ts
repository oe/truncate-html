import truncate from '../src/truncate'

describe('Truncate html', () => {
  describe('should works well when false params are given', () => {
    it('should NOT truncate a string if no string provided', () => {
      expect(truncate(null)).toBe(null)
    })

    it('should NOT truncate a string if NO length provided', () => {
      const html = 'string'

      expect(truncate(html)).toBe(html)
    })

    it('should NOT truncate a string if length is less than or equal to zero', () => {
      const html = 'string'

      expect(truncate(html, 0)).toBe(html)
    })
  })

  describe('truncate with options.length', () => {
    it('should truncate a string', () => {
      const test = '123456789'
      const expected = '12345...'

      expect(truncate(test, 5)).toBe(expected)
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

    it('should keep empty tag', () => {
      const test = '<span></span><p>12345</p><p>6789</p><span> reset text </span>'
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

        expect(truncate(test, 7, {
          reserveLastWord: true
        })).toBe(expected)
      })

      it('should reserve the last word(i18n)', () => {
        const test = '<p>internationalization</p>'
        const expected = '<p>internationalization</p>'

        expect(truncate(test, 7, {
          reserveLastWord: 20 // exceed 20 letters
        })).toBe(expected)
      })

      it('should cut at the last word(i18n)', () => {
        const test = '<p>internationalization</p>'
        const expected = '<p>internationalizat...</p>'

        expect(truncate(test, 7, {
          reserveLastWord: true // exceed 10 letters
        })).toBe(expected)
      })

      it('should reserve the last word if only one word', () => {
        const test = '<p>internationalization</p>'
        const expected = '<p>internationalizat...</p>'

        expect(truncate(test, 7, {
          reserveLastWord: -1 // exceed 10 letters
        })).toBe(expected)
      })

      it('should reserve the last word if at the boundary', () => {
        const test = '<p>Hello world from earth</p>'
        const expected = '<p>Hello world ...</p>'

        expect(truncate(test, 11, {
          reserveLastWord: -1 // exceed 10 letters
        })).toBe(expected)
      })

      it('should remove the last word if more than one(i18n, reserveLastWord negative)', () => {
        const test = '<p>hello internationalization</p>'
        const expected = '<p>hello ...</p>'

        expect(truncate(test, 7, {
          reserveLastWord: -1 // exceed 10 letters
        })).toBe(expected)
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

    it('should remove all tags', () => {
      const html = '<p><img src="abc.png">This <hr>is a string</p><br> for test.'
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
      const expected = '<p><img src="abc.png">This is a string ...</p>'
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
      const expected = 'Hello ...'
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
        const expected = '<p><img src="abc.png">This is a string do</p> for test.'
        const options = {
          byWords: true,
          reserveLastWord: true
        }
        expect(truncate(html, 10, options)).toBe(expected)
      })

      it('should ignore reserveLastWord when byWords is on(length smaller)', () => {
        const html = '<p><img src="abc.png">This is a string do</p> for test.'
        const expected = '<p><img src="abc.png">This is a ...</p>'
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
      const html = '<p>         <img src="abc.png">This is a string</p> for test.'
      const expected = '<p> <img src="abc.png">This is a ...</p>'
      const options = {
        keepWhitespaces: false
      }

      expect(truncate(html, 10, options)).toBe(expected)
    })

    it('should preserve whitespaces', () => {
      const html = '<p>         <img src="abc.png">This is a string</p> for test.'
      const expected = '<p>         <img src="abc.png">This is a ...</p>'
      const options = {
        keepWhitespaces: true
      }

      expect(truncate(html, 10, options)).toBe(expected)
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
      const html = '<p><img src="abc.png">This is a string</p><div class="something-unwanted"> unwanted string inserted ( ´•̥̥̥ω•̥̥̥` ）</div> for test.'
      const expected = '<p>This is a string</p> for ...'
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

    it('should leave encoded characters as is', () => {
      const html = '<p>&nbsp;test for &lt;p&gt; encoded string</p>'
      const expected = '<p>&nbsp;test for &lt;p...</p>'
      const options = {
        length: 20,
        decodeEntities: false // this is the default value
      }

      expect(truncate(html, options)).toBe(expected)
    })

    it('should convert special characters to encoded', () => {
      const html = '<p>&nbsp;test for &lt;p&gt; 中文 string</p>'
      const expected = '<p> test for &lt;p&gt; &#x4E2D;&#x6587; str...</p>'
      const options = {
        length: 20,
        decodeEntities: true
      }

      expect(truncate(html, options)).toBe(expected)
    })

    it('should convert special characters to encoded', () => {
      const html = '<p>&nbsp;test for &lt;p&gt;&#64 中文 string</p>'
      const expected = '<p> test for &lt;p&gt;@ &#x4E2D;&#x6587; st...</p>'
      const options = {
        length: 20,
        decodeEntities: true
      }
      expect(truncate(html, options)).toBe(expected)
    })

    it('should convert CJK to encoded', () => {
      const html = '<p>&nbsp;test for &lt;p&gt;&#64 &#x4E2D;&#x6587; string</p>'
      const expected = '<p> test for &lt;p&gt;@ &#x4E2D;&#x6587; st...</p>'
      const options = {
        length: 20,
        decodeEntities: true
      }
      expect(truncate(html, options)).toBe(expected)
    })
  })

  describe('with truncate.setup', () => {
    afterEach(function () {
      truncate.setup({
        byWords: false,
        stripTags: false,
        ellipsis: '...',
        length: null,
        decodeEntities: false,
        keepWhitespaces: false,
        excludes: '',
        reserveLastWord: false
      })
    })
    it('should works well if setup with empty', () => {
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
      const expected = 'hello from ...'

      expect(truncate(test, 2)).toBe(expected)
    })

    it('should use default reserveLastWord settings', () => {
      truncate.setup({ reserveLastWord: true })
      const test = 'hello from earth'
      const expected = 'hello from earth'

      expect(truncate(test, 12)).toBe(expected)
    })
  })
})
