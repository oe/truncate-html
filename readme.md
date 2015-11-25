# Truncate-html
Truncate html string and keep tags in safe. You can custom ellipsis sign, ignore unwanted elements.

**Notice** This is a node modules depends on cheerio *can only run on nodejs*. If you need a browser version, you may conside [truncate](https://github.com/pathable/truncate) or [nodejs-html-truncate](https://github.com/huang47/nodejs-html-truncate).

## Method
```js
truncate(html, [length], [options])
```

## Usage
**Notice** Extra blank spaces in html content will be removed. If the html string content's length is shorter than `options.length`, then no ellipsis will be appended to the final html string. If longer, then the final html content's length will be `options.length` + `options.ellipsis`.


```js
// truncate html
var html = '<p><img src="abc.png">This is a string</p> for test.';
truncate(html, 10);
// returns: <p><img src="abc.png">This is a ...</p>


// with options, remove all tags
var html = '<p><img src="abc.png">This is a string</p> for test.';
truncate(html, 10, {stripTags: true});
// returns: This is a ...



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

```


### default options
```js
truncate.defaultOptions = {
  stripTags: false,
  ellipsis: '...'
};
```