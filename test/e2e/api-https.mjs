// Local TLS transport for the isolated PHP test server, never a production proxy.
import { createServer } from 'node:https'
import { request } from 'node:http'
import { readFileSync } from 'node:fs'

createServer(
  {
    cert: readFileSync(process.env.E2E_TLS_CERT),
    key: readFileSync(process.env.E2E_TLS_KEY)
  },
  (req, res) => {
    const upstream = request(
      {
        hostname: '127.0.0.1',
        port: 8011,
        method: req.method,
        path: req.url,
        headers: req.headers
      },
      response => {
        res.writeHead(response.statusCode, response.headers)
        response.pipe(res)
      }
    )
    upstream.on('error', () => {
      res.writeHead(502)
      res.end('Test API unavailable')
    })
    req.pipe(upstream)
  }
).listen(8012, '127.0.0.1')
