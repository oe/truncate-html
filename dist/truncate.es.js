var cheerio = require('cheerio');

// default options
var defaultOptions = {
  // remove all tags
  stripTags: false,
  // postfix of the string
  ellipsis: '...',
  // decode html entities
  decodeEntities: false,
  // whether truncate by words
  byWords: false
  // // truncate by words, set to true keep words
  // // set to number then truncate by word count
  // length: 0
  // excludes: '', // remove tags
  // keepWords: false, // keep word completed if truncate at the middle of the word, works no matter byWords is true/false
  // keepWhitespaces: false // even if set true, continuous whitespace will count as one
};

// helper method
var helper = {
  setup: function setup (length, options) {
    switch (typeof length) {
      case 'object':
        options = length;
        break
      case 'number':
        if (typeof options === 'object') {
          options.length = length;
        } else {
          options = {
            length: length
          };
        }
    }
    options = this.extend(options, defaultOptions);
    if (options.excludes) {
      if (!Array.isArray(options.excludes)) {
        options.excludes = [options.excludes];
      }
      options.excludes = options.excludes.join(',');
    }
    this.options = options;
    this.limit = options.length;
    this.ellipsis = options.ellipsis;
    this.keepWhitespaces = options.keepWhitespaces;
  },
  // extend obj with dft
  extend: function extend (obj, dft) {
    var k, v;
    if (obj == null) {
      obj = {};
    }
    for (k in dft) {
      v = dft[k];
      if (obj[k] != null) {
        continue
      }
      obj[k] = v;
    }
    return obj
  },
  // test a char whether a whitespace char
  isBlank: function isBlank (char) {
    return char === ' ' || char === '\f' || char === '\n' || char === '\r' || char === '\t' || char === '\v' || char === '\u00A0' || char === '\u2028' || char === '\u2029'
  },
  truncate: function truncate (text) {
    var this$1 = this;

    if (!this.keepWhitespaces) {
      text = text.replace(/\s+/g, ' ');
    }
    var byWords = this.options.byWords;
    var strLen = text.length;
    if (!(this.limit && strLen)) {
      return ''
    }
    var idx = 0;
    var count = 0;
    var prevIsBlank = byWords;
    var curIsBlank = false;
    while (idx < strLen) {
      curIsBlank = this$1.isBlank(text.charAt(idx++));
      if (count === this$1.limit) {
        // reserve trailing whitespace
        if (curIsBlank) {
          continue
        }
        // fix idx because current char belong to next words which exceed the limit
        --idx;
        break
      }
      // keep same then continue
      if (byWords && (prevIsBlank === curIsBlank)) { continue }
      if (byWords) {
        curIsBlank || ++count;
      } else {
        (curIsBlank && prevIsBlank) || ++count;
      }
      prevIsBlank = curIsBlank;
    }
    this.limit -= count;
    if (this.limit) {
      return text
    } else {
      return text.substr(0, idx) + this.ellipsis
    }
  },
  // deal with cut string in the middle of a word
  substr: function substr (str, len) {
    // var boundary, cutted, result
    var cutted = str.substr(0, len);
    if (!this.keepWords) {
      return cutted
    }
    var boundary = str.substring(len - 1, len + 1);
    // if truncate at word boundary, just return
    if (/\W/.test(boundary)) {
      return cutted
    }
    if (this.keepWords < 0) {
      var result = cutted.replace(/\w+$/, '');
      // if the cutted is not the first and the only word
      //   then return result, or return the whole word
      if (!(result.length === 0 && cutted.length === this.options.length)) {
        return result
      }
    }
    // set max exceeded to 10 if this.keepWords is true or > 0
    var maxExceeded = this.keepWords !== true && this.keepWords > 0 ? this.keepWords : 10;
    var exceeded = str.substr(len).match(/(\w+)/)[1];
    return cutted + exceeded.substr(0, maxExceeded)
  }
};

/**
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
 *                           keepWords: false, //
 *                           keepWhitespaces: false // keep whitespaces, by default continuous spaces will be replaced with one space, default false
 *                         }
 * @return {String}
 * @example
 * truncate('<p>wweeweewewwe</p>', 10)
 * truncate('<p>wweeweewewwe</p>', 10, {stripTags: true})
 * truncate('<p>wweeweewewwe</p>', {stripTags: true, length: 10})
 */
function truncate (html, length, options) {
  helper.setup(length, options);
  if (!html || isNaN(helper.limit) || helper.limit <= 0) {
    return html
  }
  if (typeof html === 'object') {
    html = cheerio(html).html();
  }

  // Add a wrapper for text node without tag like:
  //   <p>Lorem ipsum <p>dolor sit => <div><p>Lorem ipsum <p>dolor sit</div>
  var $ = cheerio.load(("<div>" + html + "</div>"), {
    decodeEntities: helper.options.decodeEntities
  });
  var $html = $('div').first();
  // remove excludes elements
  helper.options.excludes && $html.find(helper.options.excludes).remove();
  // strip tags and get pure text
  if (helper.options.stripTags) {
    return helper.truncate($html.text())
  }
  var travelChildren = function ($ele) {
    return $ele.contents().each(function () {
      switch (this.type) {
        case 'text':
          if (!helper.limit) {
            $(this).remove();
            return
          }
          this.data = helper.truncate($(this).text());
          break
        case 'tag':
          if (!helper.limit) {
            $(this).remove();
          } else {
            return travelChildren($(this))
          }
          break
        default:
          // for comments
          return $(this).remove()
      }
    })
  };
  travelChildren($html);
  return $html.html()
}

truncate.setup = function (options) {
  if ( options === void 0 ) options = {};

  helper.extend(defaultOptions, options);
};

export default truncate;
