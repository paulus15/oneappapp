// Web Install API (navigator.install): the browser installs another site's PWA from this page,
// after its own confirmation. Chrome and Edge, desktop, still rolling out: always feature-detected.

export function canWebInstall(target) {
  return (
    !!target?.manifest &&
    typeof navigator !== 'undefined' &&
    typeof navigator.install === 'function'
  )
}

// Must be called straight from the click (transient user activation).
// 'installed' | 'cancelled' (the user said no) | 'unavailable' (anything else: use the link).
export async function webInstall(target) {
  try {
    await navigator.install({
      manifest: target.manifest,
      ...(target.manifest_id ? { manifestId: target.manifest_id } : {})
    })
    return 'installed'
  } catch (error) {
    return error?.name === 'AbortError' ? 'cancelled' : 'unavailable'
  }
}
