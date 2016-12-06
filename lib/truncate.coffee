
cheerio = require 'cheerio'

# extend obj with dft
extend = (obj, dft)->
  if !obj? then obj = {}

  for k, v of dft
    if obj[ k ]? then continue
    obj[ k ] = v
  obj

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
 *                           keepWhitespaces: false // keep whitespaces, by default continuous spaces will be replaced with one space, default false
 *                         }
 * @return {String}
 * @example
 * truncate('<p>wweeweewewwe</p>', 10)
 * truncate('<p>wweeweewewwe</p>', 10, {stripTags: true})
 * truncate('<p>wweeweewewwe</p>', {stripTags: true, length: 10})
###
truncate = (html, length, options)->
  switch typeof length
    when 'object'
      options = length
    when 'number'
      if typeof options is 'object'
        options.length = length
      else
        options = length: length
      
    
  options = extend options, truncate.defaultOptions

  if !html or isNaN( options.length ) or options.length <= 0 then return html

  if typeof html is 'object'
    html = $(html).html()

  # add a wrapper for text node without tag like:
  #
  #   <p>Lorem ipsum <span>dolor sit</span> amet, consectetur</p>
  #   tempor incididunt ut labore
  #
  $ = cheerio.load "<div>#{html}</div>", decodeEntities: options.decodeEntities
  $html = $('div').first()

  # remove excludes elements
  if options.excludes
    unless Array.isArray options.excludes
      options.excludes = [ options.excludes ]
    $html.find( options.excludes.join(',') ).remove()

  # strip tags and get pure text
  if options.stripTags
    text = $html.text().replace /\s+/, ' '
    if text.length <= options.length
      return text
    else
      return text.substr( 0, options.length ) + options.ellipsis

  length = options.length

  keepWhitespaces = options.keepWhitespaces

  travelChildren = ($ele)->
    $ele.contents().each ->
      switch this.type
        when 'text'
          if length <= 0
            if length is 0
              this.data = options.ellipsis
              --length
            else
              $(this).remove()
            return
          text = $(this).text()
          if keepWhitespaces
            textLength = 0
            subLength = 0
            # count none spaces & spaces
            # continuous spaces will be treat as one
            text.replace /(\S*)(\s*)/g, ($0, $1, $2)->
              return if textLength > length
              if $1.length >= length
                subLength += length
                textLength += $1.length
                length = 0
                return
              textLength += $1.length
              subLength += $1.length
              length -= $1.length

              $2Len = !!($2.length)
              if $2Len >= length
                subLength += $2Len
                textLength += $2.length
                length = 0
                return

              textLength += $2Len
              subLength += $2.length
              length -= $2Len
              return
          else
            text = text.replace /\s+/g, ' '
            textLength = text.length
            subLength = Math.min textLength, length
          if textLength <= length
            this.data = text
            length -= textLength
          else
            this.data = text.substr(0, subLength) + options.ellipsis
            length = -1

        when 'tag'
          if length <= 0
            if length is 0
              this.type = 'text'
              this.data = options.ellipsis
              --length
            else
              $(this).remove()
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
  # excludes: img
  # # truncate by words, set to true keep words
  # # set to number then truncate by word count
  # words: false
  # length: 0
  # keepWhitespaces: false

module.exports = truncate
