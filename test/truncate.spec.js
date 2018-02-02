import truncate from '../src/truncate'

describe('Truncate', () => {
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

  it('should truncate a string', () => {
    let test = '123456789'
    let expected = '12345...'

    expect(truncate(test, 5)).toBe(expected)
  })

  it('should truncate a string with tags', () => {
    let test = '<p>123456789</p>'
    let expected = '<p>123456...</p>'

    expect(truncate(test, 6)).toBe(expected)
  })

  it('should truncate a string with characters outside of tags', () => {
    let test = '<p>12345</p>6789'
    let expected = '<p>12345</p>678...'

    expect(truncate(test, 8)).toBe(expected)
  })

  it('should truncate a string two sets of tags', () => {
    let test = '<p>12345</p><p>6789</p>'
    let expected = '<p>12345</p><p>67...</p>'

    expect(truncate(test, 7)).toBe(expected)
  })

  it('should truncate a string with an image tag', () => {
    let html = '<p><img src="abc.png">This is a string</p> for test.'
    let expected = '<p><img src="abc.png">This is a ...</p>'

    expect(truncate(html, 10)).toBe(expected)
  })

  it('should remove all tags', () => {
    let html = '<p><img src="abc.png">This is a string</p> for test.'
    let expected = 'This is a ...'
    let options = {
      stripTags: true
    }

    expect(truncate(html, 10, options)).toBe(expected)
  })

  it('should truncate by words', () => {
    let html = '<p><img src="abc.png">This is a string</p> for test.'
    let expected = '<p><img src="abc.png">This is a ...</p>'
    let options = {
      byWords: true
    }
    expect(truncate(html, 3, options)).toBe(expected)
  })

  it('should preserve whitespaces', () => {
    let html = '<p>         <img src="abc.png">This is a string</p> for test.'
    let expected = '<p>         <img src="abc.png">This is a ...</p>'
    let options = {
      keepWhitespaces: true
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

  it('should insert a custom ellipsis sign', () => {
    let html = '<p><img src="abc.png">This is a string</p> for test.'
    let expected = '<p><img src="abc.png">This is a ~</p>'
    let options = {
      length: 10,
      ellipsis: '~'
    }

    expect(truncate(html, options)).toBe(expected)
  })

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
})
