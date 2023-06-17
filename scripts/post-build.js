const fs = require('fs')
const path = require('path')

// fix typescript definition issue with default export
function main() {
  const dtdFile = path.join(__dirname, '../dist/truncate.d.ts')
  let content = fs.readFileSync(dtdFile, 'utf-8')
  content = content.replace(/\bexport = truncate/, 'export default truncate')
  fs.writeFileSync(dtdFile, content)
}

main()
