// The store never runs inside another site's frame (clickjacking: a hidden frame over a decoy
// button). The real protection is the hosting header "frame-ancestors 'none'"; this is the
// fallback when that header is missing.
export default () => {
  if (window.top === window.self) return
  document.documentElement.style.visibility = 'hidden'
  try {
    window.top.location.replace(window.location.href)
  } catch {
    // A cross-origin parent may refuse navigation; the page simply stays hidden.
  }
}
