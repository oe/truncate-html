
cheerio = require 'cheerio'

# helper method
helper =
  setup: (length, options) ->
    switch typeof length
      when 'object'
        options = length
      when 'number'
        if typeof options is 'object'
          options.length = length
        else
          options = length: length
    options = this.extend options, truncate.defaultOptions
    if options.excludes
      unless Array.isArray options.excludes
        options.excludes = [ options.excludes ]
      options.excludes = options.excludes.join ','

    this.options = options
    this.limit = options.length
    this.ellipsis = options.ellipsis
    this.keepWhitespaces = options.keepWhitespaces

  # extend obj with dft
  extend: (obj, dft)->
    if !obj? then obj = {}

    for k, v of dft
      if obj[ k ]? then continue
      obj[ k ] = v
    obj

  # test a char whether a whitespace char
  isBlank: (char)->
    char is ' ' or char is '\f' or char is '\n' or
    char is '\r' or char is '\t' or char is '\v' or
    char is '\u00A0' or char is '\u2028' or char is '\u2029'


  truncate: (text)->
    unless this.keepWhitespaces then text = text.replace /\s+/g, ' '
    if this.options.byWords then this.truncateWords(text) else this.truncateChars(text)
  # truncate words
  truncateWords: (str)->
    strLen = str.length
    unless this.limit and strLen then return ''
    index = 0
    wordCount = 0
    prevIsBlank = true
    curIsBlank = false
    while index < strLen
      curIsBlank = this.isBlank(str.charAt(index++))
      # keep same then continue
      if prevIsBlank is curIsBlank then continue
      prevIsBlank = curIsBlank
      if wordCount is this.limit
        # reserve trailing whitespace
        if curIsBlank then continue
        # fix index because current char belong to next words which exceed the limit
        --index
        break
      curIsBlank or ++wordCount
    this.limit -= wordCount
    if this.limit then str else str.substr(0, index) + this.ellipsis

  truncateChars: (str)->
    strLen = str.length
    unless this.limit and strLen then return ''
    index = 0
    charCount = 0
    prevIsBlank = false
    curIsBlank = false
    while index < strLen
      curIsBlank = this.isBlank(str.charAt(index++))

      if charCount is this.limit
        # reserve trailing whitespace
        if curIsBlank then continue
        # fix index because current char belong to next words which exceed the limit
        --index
        break
      (curIsBlank and prevIsBlank is curIsBlank) or ++charCount
      prevIsBlank = curIsBlank

    this.limit -= charCount
    if this.limit then str else str.substr(0, index) + this.ellipsis


###*
 * truncate html
 * truncate(html, [length], [options])
 * @param  {String}        html    html string to truncate
 * @param  {Object|number} length
 * @param  {Object|null}   options
 *                         {
 *                           stripTags: false, // remove all tags, default false
 *                           ellipsis: '...', // ellipsis sign, default '...'
 *                           decodeEntities: false, // decode html entities before counting length, default false
 *                           excludes: '', // elements' selector you want ignore, default none
 *                           length: 10, // how many letters you want reserve, default none
 *                           byWords: false, // if true, length means how many words to reserve
 *                           keepWhitespaces: false // keep whitespaces, by default continuous spaces will be replaced with one space, default false
 *                         }
 * @return {String}
 * @example
 * truncate('<p>wweeweewewwe</p>', 10)
 * truncate('<p>wweeweewewwe</p>', 10, {stripTags: true})
 * truncate('<p>wweeweewewwe</p>', {stripTags: true, length: 10})
###
truncate = (html, length, options)->
  helper.setup length, options

  if !html or isNaN( helper.limit ) or helper.limit <= 0 then return html

  if typeof html is 'object'
    html = $(html).html()

  # add a wrapper for text node without tag like:
  #
  #   <p>Lorem ipsum <span>dolor sit</span> amet, consectetur</p>
  #   tempor incididunt ut labore
  #
  $ = cheerio.load "<div>#{html}</div>", decodeEntities: helper.options.decodeEntities
  $html = $('div').first()

  # remove excludes elements
  helper.options.excludes and  $html.find( helper.options.excludes ).remove()

  # strip tags and get pure text
  if helper.options.stripTags
    return helper.truncate $html.text()

  travelChildren = ($ele)->
    $ele.contents().each ->
      switch this.type
        when 'text'
          unless helper.limit
            $(this).remove()
            return
          this.data = helper.truncate $(this).text()

        when 'tag'
          unless helper.limit
            $(this).remove()
            return
          else
            travelChildren $(this)

        # for comments
        else
          $(this).remove()

  travelChildren $html

  $html.html()


# default options
truncate.defaultOptions =
  # remove all tags
  stripTags: false
  # postfix of the string
  ellipsis: '...'
  # decode html entities
  decodeEntities: false
  # whether truncate by words
  byWords: false
  # excludes: img
  # # truncate by words, set to true keep words
  # # set to number then truncate by word count
  # words: false
  # length: 0
  # keepWhitespaces: false

module.exports = truncate
