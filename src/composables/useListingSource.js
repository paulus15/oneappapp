import { computed, inject, provide, toValue } from 'vue'
import { listingLink } from '@/utils/analytics'

// A store page names the section its app cards belong to (home, search, category…);
// the cards then open the listing with that source in the history entry, not the URL.
const KEY = Symbol('listing-source')

export function provideListingSource(source) {
  provide(
    KEY,
    computed(() => toValue(source))
  )
}

/** Turns a listing address into a router location carrying the section, when there is one. */
export function useListingLink() {
  const source = inject(KEY, null)
  return to => listingLink(to, source?.value)
}
