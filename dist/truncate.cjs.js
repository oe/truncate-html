'use strict';

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
  // reserveLastWord: false, // keep word completed if truncate at the middle of the word, works no matter byWords is true/false
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
    this.reserveLastWord = options.reserveLastWord;
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
    var idx = 0;
    var count = 0;
    var prevIsBlank = byWords;
    var curIsBlank = false;
    while (idx < strLen) {
      curIsBlank = this$1.isBlank(text.charAt(idx++));
      // keep same then continue
      if (byWords && (prevIsBlank === curIsBlank)) { continue }
      if (count === this$1.limit) {
        // reserve trailing whitespace
        if (curIsBlank) {
          prevIsBlank = curIsBlank;
          continue
        }
        // fix idx because current char belong to next words which exceed the limit
        --idx;
        break
      }

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
      if (byWords) {
        return text.substr(0, idx) + this.ellipsis
      } else {
        var str = this.substr(text, idx);
        if (str === text) { return str }
        else { return str + this.ellipsis }
      }
    }
  },
  // deal with cut string in the middle of a word
  substr: function substr (str, len) {
    // var boundary, cutted, result
    var cutted = str.substr(0, len);
    if (!this.reserveLastWord) {
      return cutted
    }
    var boundary = str.substring(len - 1, len + 1);
    // if truncate at word boundary, just return
    if (/\W/.test(boundary)) {
      return cutted
    }
    if (this.reserveLastWord < 0) {
      var result = cutted.replace(/\w+$/, '');
      // if the cutted is not the first and the only word
      //   then return result, or return the whole word
      if (!(result.length === 0 && cutted.length === this.options.length)) {
        return result
      }
    }
    // set max exceeded to 10 if this.reserveLastWord is true or > 0
    var maxExceeded = this.reserveLastWord !== true && this.reserveLastWord > 0 ? this.reserveLastWord : 10;
    var exceeded = str.substr(len).match(/(\w+)/)[1];
    return cutted + exceeded.substr(0, maxExceeded)
  }
};

/**
 * truncate html
 * @method truncate(html, [length], [options])
 * @param  {String}         html    html string to truncate
 * @param  {Object|number}  length how many letters(words if `byWords` is true) you want reserve
 * @param  {Object|null}    options
 * @param  {Boolean}        [options.stripTags] remove all tags, default false
 * @param  {String}         [options.ellipsis] ellipsis sign, default '...'
 * @param  {Boolean}        [options.decodeEntities] decode html entities(e.g. convert `&amp;` to `&`) before
 *                                                   counting length, default false
 * @param  {String|Array}   [options.excludes] elements' selector you want ignore
 * @param  {Number}         [options.length] how many letters(words if `byWords` is true)
 *                                           you want reserve
 * @param  {Boolean}        [options.byWords] if true, length means how many words to reserve
 * @param  {Boolean|Number} [options.reserveLastWord] how to deal with when truncate in the middle of a word
 *                                1. by default, just cut at that position.
 *                                2. set it to true, with max exceed 10 letters can exceed to reserver the last word
 *                                3. set it to a positive number decide how many letters can exceed to reserve the last word
 *                                4. set it to negetive number to remove the last word if cut in the middle.
 * @param  {Boolean}        [options.keepWhitespaces] keep whitespaces, by default continuous
 *                                                    spaces will be replaced with one space, set
 *                                                    it true to keep them
 * @return {String}
 */
function truncate (html, length, options) {
  helper.setup(length, options);
  if (!html || isNaN(helper.limit) || helper.limit <= 0) {
    return html
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

  Object.assign(defaultOptions, options);
};

module.exports = truncate;
