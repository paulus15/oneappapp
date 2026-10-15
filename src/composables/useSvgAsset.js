import { getCurrentScope, onScopeDispose, ref } from 'vue'
import { apiMessage } from '@/services/account'
import { downloadBlob, svgBlob, svgToPng } from '@/utils/growth'

/**
 * An authenticated SVG (QR code, share card) shown through an object URL.
 * `fetchSvg()` resolves to the axios response of a text request. Only the latest load may
 * fill the preview; every object URL is revoked when replaced and when the scope ends.
 */
export function useSvgAsset(fetchSvg) {
  const text = ref(''),
    url = ref(''),
    loading = ref(false),
    error = ref(false),
    // Server explanation of a refusal (422: the app cannot be promoted); retrying won't help.
    refusal = ref('')
  let generation = 0

  // Text requests receive the JSON error body as a string.
  function refusalOf(e) {
    if (e?.response?.status !== 422) return ''
    let data = e.response.data
    if (typeof data === 'string')
      try {
        data = JSON.parse(data)
      } catch {
        data = {}
      }
    return apiMessage({ response: { ...e.response, data } })
  }

  function clear() {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = ''
    text.value = ''
  }

  async function load(...args) {
    const current = ++generation
    clear()
    loading.value = true
    error.value = false
    refusal.value = ''
    try {
      const { data } = await fetchSvg(...args)
      if (current !== generation) return
      const body = typeof data === 'string' ? data : await data?.text?.()
      if (current !== generation) return
      if (!body || !body.includes('<svg')) throw new Error('svg')
      text.value = body
      url.value = URL.createObjectURL(svgBlob(body))
    } catch (e) {
      if (current !== generation) return
      error.value = true
      refusal.value = refusalOf(e)
    } finally {
      if (current === generation) loading.value = false
    }
  }

  function reset() {
    generation++
    clear()
    loading.value = false
    error.value = false
    refusal.value = ''
  }

  const downloadSvg = filename => {
    if (text.value) downloadBlob(svgBlob(text.value), filename)
  }
  async function downloadPng(filename, width, height, background) {
    if (!text.value) return false
    downloadBlob(
      await svgToPng(text.value, width, height, background),
      filename
    )
    return true
  }

  if (getCurrentScope()) onScopeDispose(reset)
  return {
    text,
    url,
    loading,
    error,
    refusal,
    load,
    reset,
    downloadSvg,
    downloadPng
  }
}
