import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { currentLocale } from '@/i18n'
import { applySeo, routeSeo } from '@/utils/seo'

// Content is supplied by the page that fetched it, never by a second SEO API request.
export function usePageSeo(details) {
  const route = useRoute()
  watchEffect(
    () => {
      if (typeof document !== 'undefined')
        applySeo(routeSeo(route, currentLocale(), details()))
    },
    { flush: 'post' }
  )
}
