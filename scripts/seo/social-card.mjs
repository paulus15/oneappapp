// Reproducible social preview composed in HTML/CSS using the existing, unmodified brand icon.
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
const icon = (await readFile('public/brand/pwa-store-icon.png')).toString(
  'base64'
)
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1
  })
  await page.setContent(`<!doctype html><html lang="fr"><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#07152f;color:#fff;font-family:Arial,sans-serif;display:flex;align-items:center;padding:76px;gap:60px;background-image:radial-gradient(ellipse at 90% 10%,#074aac 0%,transparent 65%)}
  img{width:280px;height:280px;object-fit:contain}main{max-width:690px}small{font-size:19px;letter-spacing:3px;color:#71d9ff;text-transform:uppercase}h1{font-size:80px;letter-spacing:-4px;margin:18px 0 25px;font-weight:800}p{font-size:32px;line-height:1.35;margin:0;color:#dceaff}footer{font-size:23px;color:#8dbbff;margin-top:42px}
  </style><body><img src="data:image/png;base64,${icon}" alt=""><main><small>Applications web progressives</small><h1>PWAStore</h1><p>Vos applications.<br>Sur mobile et ordinateur.</p><footer>pwastore.online</footer></main></body></html>`)
  await page.locator('img').evaluate(img => img.decode())
  await page.screenshot({ path: 'public/brand/pwastore-social.png' })
} finally {
  await browser.close()
}
