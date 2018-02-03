const truncate = require('../dist/truncate.cjs.js')

let test = '<span></span><p>internationalization</p><span>hahahahah</span><!-- ahah --->'
let expected = '<span></span><p>internationalizat...</p>'

// expect(truncate(test, 7, {
//   reserveLastWord: -1 // exceed 10 letters
// })).toBe(expected)
console.log(truncate(test, 7, {
  reserveLastWord: -1 // exceed 10 letters
}))
