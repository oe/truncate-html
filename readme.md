# Truncate-html
Truncate html string and keep tags in safe. You can custom ellipsis sign, ignore unwanted elements.

**Notice** This is a node module depends on cheerio *can only run on nodejs*. If you need a browser version, you may consider [truncate](https://github.com/pathable/truncate) or [nodejs-html-truncate](https://github.com/huang47/nodejs-html-truncate).

## Method
```js
truncate(html, [length], [options])
```

### Available options
```
{
    length: Number, content length to truncate
    stripTags: Boolean, whether to remove tags
    ellipsis: String, custom ellipsis sign, set it to empty string to remove the ellipsis postfix
    excludes: String or Array, the selectors of the elements you want to ignore
    decodeEntities: Boolean, auto decode html entities in the html string
    keepWhitespaces: Boolean, keep whitespaces, whether to replace continuous spaces to one space
}
```

### Default options
```js
truncate.defaultOptions = {
  stripTags: false,
  ellipsis: '...',
  decodeEntities: false,
  keepWhitespaces: false
};
```

## Install
```
npm install truncate-html
```

## Usage
**Notice** Extra blank spaces in html content will be removed. If the html string content's length is shorter than `options.length`, then no ellipsis will be appended to the final html string. If longer, then the final html content's length will be `options.length` + `options.ellipsis`.


```js
var truncate = require('truncate-html');

// truncate html
var html = '<p><img src="abc.png">This is a string</p> for test.';
truncate(html, 10);
// returns: <p><img src="abc.png">This is a ...</p>


// with options, remove all tags
var html = '<p><img src="abc.png">This is a string</p> for test.';
truncate(html, 10, {stripTags: true});
// returns: This is a ...

// with options, keep whitespaces
var html = '<p>         <img src="abc.png">This is a string</p> for test.';
truncate(html, 10, {keepWhitespaces: true});
// returns: <p>         <img src="abc.png">This is a ...</p>


// combine length and options
var html = '<p><img src="abc.png">This is a string</p> for test.';
truncate(html, {
    length: 10,
    stripTags: true
});
// returns: This is a ...



// custom ellipsis sign
var html = '<p><img src="abc.png">This is a string</p> for test.';
truncate(html, {
    length: 10,
    ellipsis: '~'
});
// reutrns: <p><img src="abc.png">This is a ~</p>


// exclude some special elements(by selector), they will be removed before counting content's length
var html = '<p><img src="abc.png">This is a string</p> for test.';
truncate(html, {
    length: 10,
    ellipsis: '~',
    excludes: 'img'
});
// reutrns: <p>This is a ~</p>


// exclude more than one category elements
var html = '<p><img src="abc.png">This is a string</p><div class="something-unwanted"> unwanted string inserted ( ´•̥̥̥ω•̥̥̥` ）</div> for test.';
truncate(html, {
    length: 20,
    stripTags: true,
    ellipsis: '~',
    excludes: ['img', '.something-unwanted']
});
// returns: This is a string for~


// handing encoded characters
var html = '<p>&nbsp;test for &lt;p&gt; encoded string</p>'
truncate(html, {
    length: 20,
    decodeEntities: true
});
// returns: <p> test for &lt;p&gt; encode...</p>

// when set decodeEntities false
var html = '<p>&nbsp;test for &lt;p&gt; encoded string</p>'
truncate(html, {
    length: 20,
    decodeEntities: false // this is the dafault value
});
// returns: <p>&nbsp;test for &lt;p...</p>


// and there may be a surprise by setting `decodeEntities` to true  when handing CJK characters
var html = '<p>&nbsp;test for &lt;p&gt; 中文 string</p>'
truncate(html, {
    length: 20,
    decodeEntities: true
});
// returns: <p> test for &lt;p&gt; &#x4E2D;&#x6587; str...</p>
// to fix this, see below for instructions

```

### Known issues
Known issues about handing CJK characters when set the option `decodeEntities` to `true`.

You have seen the option `decodeEntities`, it's really magic! When it's true, encoded html entities will be decoded automatically, so `&amp;` will be treat as a single character. This is probably what we want. But, if there are CJK characters in the html string, they will be replaced by characters like `&#xF6;` in the final html you get. That's confused.

To fix this, you have two choices:

- keep the option `decodeEntities` false, but `&amp;` will treat as five characters.
- modify cheerio's source code: find out the function `getInverse` in the file `./node_modules/cheerio/node_modules/entities/lib/decode.js`, comment out the last line `.replace(re_nonASCII, singleCharReplacer);`.




