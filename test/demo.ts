import truncate from '../src/truncate'

// truncate.setup({ length: 5 })
const html = 'string'
// const expected = '12345...'

// expect(truncate(test, 7, {
//   reserveLastWord: -1 // exceed 10 letters
// })).toBe(expected)
console.log(truncate(html))
console.log('expected', html)

