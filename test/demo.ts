import truncate from '../src/truncate'
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

const test = '123456789'
const expected = '12345...'
const $ = cheerio.load(test)
console.log(truncate($, 5))
console.log(expected)
