
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

  if typeof options.length isnt 'number' or options.length <= 0 then return html

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

  len = options.length

  travelChildren = ($ele, length)->
    $ele.contents().each ->
      switch this.type
        when 'text'
          if len <= 0
            $(this).remove()
            return
          text = $(this).text().replace /\s+/g, ' '
          if text.length <= len
            this.data = text
            len -= text.length
          else
            this.data = text.substr(0, len) + options.ellipsis
            len = 0

        when 'tag'
          if len <= 0
            $(this).remove()
          else
            travelChildren $(this), len

        # for comments
        else
          $(this).remove()

  travelChildren $html, len

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
  # length: 0

module.exports = truncate
