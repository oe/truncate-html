import truncate from '../src/truncate'

describe('Truncate html', () => {
  describe('should works well when false params are given', () => {
    it('should NOT truncate a string if no string provided', () => {
      expect(truncate(null)).toBe(null)
    })

    it('should NOT truncate a string if NO length provided', () => {
      let html = 'string'

      expect(truncate(html)).toBe(html)
    })

    it('should NOT truncate a string if length is less than or equal to zero', () => {
      let html = 'string'

      expect(truncate(html, 0)).toBe(html)
    })
  })

  describe('truncate with options.length', () => {
    it('should truncate a string', () => {
      let test = '123456789'
      let expected = '12345...'

      expect(truncate(test, 5)).toBe(expected)
    })

    it('should truncate a string with tags', () => {
      let test = '<p>123456789</p>'
      let expected = '<p>123456...</p>'

      expect(truncate(test, {length: 6})).toBe(expected)
    })
    it('should kepp all the string if length logger than the origin string', () => {
      let test = '<p>123456789</p>'
      let expected = '<p>123456789</p>'

      expect(truncate(test, {length: 100})).toBe(expected)
    })

    it('should truncate a string with characters outside of tags', () => {
      let test = '<p>12345</p>6789'
      let expected = '<p>12345</p>678...'

      expect(truncate(test, 8)).toBe(expected)
    })

    it('should works well when truncate at tag boundary', () => {
      let test = 'Hello <b>world</b>'
      let expected = 'Hello ...'

      expect(truncate(test, 6)).toBe(expected)
    })

    it('should works well when truncate at tag boundary-2', () => {
      let test = 'Hello <b>world</b>'
      let expected = 'Hello <b>world</b>'

      expect(truncate(test, 11)).toBe(expected)
    })

    it('should truncate a string two sets of tags', () => {
      let test = '<p>12345</p><p>6789</p>'
      let expected = '<p>12345</p><p>67...</p>'

      expect(truncate(test, 7)).toBe(expected)
    })

    it('should keep empty tag', () => {
      let test = '<span></span><p>12345</p><p>6789</p><span> reset text </span>'
      let expected = '<span></span><p>12345</p><p>67...</p>'

      expect(truncate(test, 7)).toBe(expected)
    })

    it('should remove comment', () => {
      let test = '<span></span><!-- comment --><p>12345</p><p>6789</p>'
      let expected = '<span></span><p>12345</p><p>67...</p>'

      expect(truncate(test, 7)).toBe(expected)
    })

    it('should remove comment in tag', () => {
      let test = '<span></span><p><!-- comment -->12345</p><p>6789</p>'
      let expected = '<span></span><p>12345</p><p>67...</p>'

      expect(truncate(test, 7)).toBe(expected)
    })

    describe('works with options.reserveLastWord', () => {
      it('should reserve the last word', () => {
        let test = '<p>12345</p><p>6789</p>'
        let expected = '<p>12345</p><p>6789</p>'

        expect(truncate(test, 7, {
          reserveLastWord: true
        })).toBe(expected)
      })

      it('should reserve the last word(i18n)', () => {
        let test = '<p>internationalization</p>'
        let expected = '<p>internationalization</p>'

        expect(truncate(test, 7, {
          reserveLastWord: 20 // exceed 20 letters
        })).toBe(expected)
      })

      it('should cut at the last word(i18n)', () => {
        let test = '<p>internationalization</p>'
        let expected = '<p>internationalizat...</p>'

        expect(truncate(test, 7, {
          reserveLastWord: true // exceed 10 letters
        })).toBe(expected)
      })

      it('should reserve the last word if only one word', () => {
        let test = '<p>internationalization</p>'
        let expected = '<p>internationalizat...</p>'

        expect(truncate(test, 7, {
          reserveLastWord: -1 // exceed 10 letters
        })).toBe(expected)
      })

      it('should reserve the last word if at the boundary', () => {
        let test = '<p>Hello world from earth</p>'
        let expected = '<p>Hello world ...</p>'

        expect(truncate(test, 11, {
          reserveLastWord: -1 // exceed 10 letters
        })).toBe(expected)
      })

      it('should remove the last word if more than one(i18n, reserveLastWord negative)', () => {
        let test = '<p>hello internationalization</p>'
        let expected = '<p>hello ...</p>'

        expect(truncate(test, 7, {
          reserveLastWord: -1 // exceed 10 letters
        })).toBe(expected)
      })
    })
  })

  describe('with self-close tags', () => {
    it('should truncate a string with an image tag', () => {
      let html = '<p><img src="abc.png">This is a string</p> for test.'
      let expected = '<p><img src="abc.png">This is a ...</p>'

      expect(truncate(html, 10)).toBe(expected)
    })

    it('should truncate a string with an image and br tags', () => {
      let html = '<p><img src="abc.png">This <br>is a string</p> for test.'
      let expected = '<p><img src="abc.png">This <br>is a ...</p>'

      expect(truncate(html, 10)).toBe(expected)
    })
  })

  describe('with options.stripTags', () => {
    it('should works well with plain text', () => {
      let html = 'This is a string for test.'
      let expected = 'This is a ...'
      let options = {
        stripTags: true
      }

      expect(truncate(html, 10, options)).toBe(expected)
    })

    it('should remove all tags', () => {
      let html = '<p><img src="abc.png">This <hr>is a string</p><br> for test.'
      let expected = 'This is a ...'
      let options = {
        stripTags: true
      }
      expect(truncate(html, 10, options)).toBe(expected)
    })
  })

  describe('with options.byWords', () => {
    it('should truncate by words', () => {
      let html = '<p><img src="abc.png">This is a string do</p> for test.'
      let expected = '<p><img src="abc.png">This is a string ...</p>'
      let options = {
        byWords: true
      }
      expect(truncate(html, 4, options)).toBe(expected)
    })

    it('should reverse the whole string when if length is bigger', () => {
      let html = '<p><img src="abc.png">This is a string do</p> for test.'
      let expected = '<p><img src="abc.png">This is a string do</p> for test.'
      let options = {
        byWords: true
      }
      expect(truncate(html, 10, options)).toBe(expected)
    })

    it('should works well when truncate at tag boundary', () => {
      let test = 'Hello <b>world</b>'
      let expected = 'Hello ...'
      let options = {
        byWords: true
      }
      expect(truncate(test, 1, options)).toBe(expected)
    })

    it('should works well when truncate at tag boundary', () => {
      let test = 'Hello <b>world</b>'
      let expected = 'Hello <b>world</b>'
      let options = {
        byWords: true
      }
      expect(truncate(test, 2, options)).toBe(expected)
    })

    describe('works with options.reserveLastWord', () => {
      it('should ignore reserveLastWord when byWords is on(length bigger)', () => {
        let html = '<p><img src="abc.png">This is a string do</p> for test.'
        let expected = '<p><img src="abc.png">This is a string do</p> for test.'
        let options = {
          byWords: true,
          reserveLastWord: true
        }
        expect(truncate(html, 10, options)).toBe(expected)
      })

      it('should ignore reserveLastWord when byWords is on(length smaller)', () => {
        let html = '<p><img src="abc.png">This is a string do</p> for test.'
        let expected = '<p><img src="abc.png">This is a ...</p>'
        let options = {
          byWords: true,
          reserveLastWord: true
        }
        expect(truncate(html, 3, options)).toBe(expected)
      })
    })
  })

  describe('with options.whitespaces', () => {
    it('should trim whitespaces', () => {
      let html = '<p>         <img src="abc.png">This is a string</p> for test.'
      let expected = '<p> <img src="abc.png">This is a ...</p>'
      let options = {
        keepWhitespaces: false
      }

      expect(truncate(html, 10, options)).toBe(expected)
    })

    it('should preserve whitespaces', () => {
      let html = '<p>         <img src="abc.png">This is a string</p> for test.'
      let expected = '<p>         <img src="abc.png">This is a ...</p>'
      let options = {
        keepWhitespaces: true
      }

      expect(truncate(html, 10, options)).toBe(expected)
    })
  })

  describe('combine length and options', () => {
    it('should works with length and options separate', () => {
      let html = '<p><img src="abc.png">This is a string</p> for test.'
      let expected = 'This is a ...'
      let options = {
        stripTags: true
      }
      expect(truncate(html, 10, options)).toBe(expected)
    })

    it('should allow length argument to be combined into the options object', () => {
      let html = '<p><img src="abc.png">This is a string</p> for test.'
      let expected = 'This is a ...'
      let options = {
        length: 10,
        stripTags: true
      }
      expect(truncate(html, options)).toBe(expected)
    })
  })

  describe('with options.ellipsis', () => {
    it('should insert a custom ellipsis sign', () => {
      let html = '<p><img src="abc.png">This is a string</p> for test.'
      let expected = '<p><img src="abc.png">This is a ~</p>'
      let options = {
        length: 10,
        ellipsis: '~'
      }

      expect(truncate(html, options)).toBe(expected)
    })

    it('should not insert a custom ellipsis sign', () => {
      let html = '<p><img src="abc.png">This is a string</p> for test.'
      let expected = '<p><img src="abc.png">This is a string</p> for test.'
      let options = {
        length: 50,
        ellipsis: '~'
      }
      expect(truncate(html, options)).toBe(expected)
    })
  })

  describe('with options.excludes', () => {
    it('should exclude elements by selector', () => {
      let html = '<p><img src="abc.png">This is a string</p> for test.'
      let expected = '<p>This is a ...</p>'
      let options = {
        length: 10,
        excludes: 'img'
      }

      expect(truncate(html, options)).toBe(expected)
    })

    it('should exclude multiple elements by selector', () => {
      let html = '<p><img src="abc.png">This is a string</p><div class="something-unwanted"> unwanted string inserted ( ´•̥̥̥ω•̥̥̥` ）</div> for test.'
      let expected = '<p>This is a string</p> for ...'
      let options = {
        length: 20,
        excludes: ['img', '.something-unwanted']
      }

      expect(truncate(html, options)).toBe(expected)
    })
  })

  describe('with options.decodeEntities', () => {
    it('should handle encoded characters', () => {
      let html = '<p>&nbsp;test for &lt;p&gt; encoded string</p>'
      let expected = '<p> test for &lt;p&gt; encode...</p>'
      let options = {
        length: 20,
        decodeEntities: true
      }

      expect(truncate(html, options)).toBe(expected)
    })

    it('should leave encoded characters as is', () => {
      let html = '<p>&nbsp;test for &lt;p&gt; encoded string</p>'
      let expected = '<p>&nbsp;test for &lt;p...</p>'
      let options = {
        length: 20,
        decodeEntities: false // this is the default value
      }

      expect(truncate(html, options)).toBe(expected)
    })

    it('should convert special characters to encoded', () => {
      let html = '<p>&nbsp;test for &lt;p&gt; 中文 string</p>'
      let expected = '<p> test for &lt;p&gt; &#x4E2D;&#x6587; str...</p>'
      let options = {
        length: 20,
        decodeEntities: true
      }

      expect(truncate(html, options)).toBe(expected)
    })

    it('should convert special characters to encoded', () => {
      let html = '<p>&nbsp;test for &lt;p&gt;&#64 中文 string</p>'
      let expected = '<p> test for &lt;p&gt;@ &#x4E2D;&#x6587; st...</p>'
      let options = {
        length: 20,
        decodeEntities: true
      }
      expect(truncate(html, options)).toBe(expected)
    })

    it('should convert CJK to encoded', () => {
      let html = '<p>&nbsp;test for &lt;p&gt;&#64 &#x4E2D;&#x6587; string</p>'
      let expected = '<p> test for &lt;p&gt;@ &#x4E2D;&#x6587; st...</p>'
      let options = {
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
        reserveLastWord: false,
        keepWhitespaces: false
      })
    })
    it('should use works well if setup with empty', () => {
      truncate.setup()
      let test = 'hello from earth'
      let expected = 'hello from e...'

      expect(truncate(test, 12)).toBe(expected)
    })

    it('should use default length', () => {
      truncate.setup({length: 5})
      let test = '123456789'
      let expected = '12345...'

      expect(truncate(test)).toBe(expected)
    })

    it('should use default byWords settings', () => {
      truncate.setup({byWords: true})
      let test = 'hello from earth'
      let expected = 'hello from ...'

      expect(truncate(test, 2)).toBe(expected)
    })

    it('should use default reserveLastWord settings', () => {
      truncate.setup({reserveLastWord: true })
      let test = 'hello from earth'
      let expected = 'hello from earth'

      expect(truncate(test, 12)).toBe(expected)
    })
  })
})
