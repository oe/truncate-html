import truncate, { type ICustomNodeStrategy, type IOptions } from '../src/truncate'
import * as cheerio from 'cheerio'
// truncate.setup({ length: 5 })
// const html = 'string'
// const expected = '12345...'

// const str = 'string'
// const html = cheerio.load(str)

// expect(truncate(html)).toBe(str)
// expect(truncate(test, 7, {
//   reserveLastWord: -1 // exceed 10 letters
// })).toBe(expected)
// @ts-ignore
// console.log(truncate(html))
// console.log('expected', html)

// const test = '123456789'
// const expected = '12345...'
// const $ = cheerio.load(test)
// console.log(truncate($, 5))
// console.log(expected)

// const str = '<p>poo 💩💩💩💩💩<p>'
// console.log(truncate(str, 6))

let str = 'demo'
str = '<p>a b c d ef</p>'
// console.log(truncate(str, { length: 10, reserveLastWord: -1, ellipsis: '..' }))

str = '<p>1234567890</p>'
console.log(truncate(str, { length: 5, reserveLastWord: -1, trimTheOnlyWord: true, ellipsis: '...' }))

let html = '<p><img src="abc.png"><i>italic<b>bold</b></i>This is a string</p> for test.'
console.log(truncate(html, {
  length: 10,
  customNodeStrategy: node => {
    if (node.is('img')) {
      return 'remove'
    }
    if (node.is('i')) {
      return 'keep'
    }
  }
}))
// const testString = '123456<div>7</div><div>89</div>12'

html = '<p><img src="abc.png"><i>italic<b>bold</b></i>This is a string</p> for test.'

console.log(truncate(html, {
  length: 2,
  byWords: true
}))

html = '<div><details><summary>Click me</summary><p>Some details</p></details>other things</div>'
console.log(truncate(html, {
  length: 10,
  customNodeStrategy: node => {
    if (node.is('details')) {
      return node.find('summary')
    }
  }
}))

const customNodeStrategy: ICustomNodeStrategy = node => {
  // remove img tag
  if (node.is('img')) {
    return 'remove'
  }
  // keep italic tag and its children
  if (node.is('i')) {
    return 'keep'
  }
  // truncate summary tag that inside details tag instead of details tag
  if (node.is('details')) {
    return node.find('summary')
  }
}

html = '<div><img src="abc.png"><i>italic<b>bold</b></i><details><summary>Click me</summary><p>Some details</p></details>This is a string</div> for test.'

const options: IOptions = {
  length: 10,
  customNodeStrategy
}

console.log(truncate(html, options))

// const expected = '123456...'
// console.log(truncate(testString, 6))

// argument node is a cheerio instance
const customNodeStrategy2: ICustomNodeStrategy = node => {
  // truncate summary tag that inside details tag instead of details tag
  if (node.is('details')) {
    return 'keep'
  }
}

html = '<div><details><summary>Click me</summary><p>Some details</p></details>other things</div>'

console.log(truncate(html,  {
  length: 3,
  customNodeStrategy: customNodeStrategy2
}))
