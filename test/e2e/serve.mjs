import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const root = process.argv[2],
  port = Number(process.argv[3])
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
}
createServer(async (req, res) => {
  const path = normalize(
    decodeURIComponent(new URL(req.url, 'http://x').pathname)
  ).replace(/^(\.\.[/\\])+/, '')
  let file = join(root, path)
  try {
    if (!(await stat(file)).isFile()) throw 0
  } catch {
    file = join(root, 'index.html')
  }
  res.writeHead(200, {
    'Content-Type': types[extname(file)] || 'application/octet-stream'
  })
  res.end(await readFile(file))
}).listen(port, '127.0.0.1')
