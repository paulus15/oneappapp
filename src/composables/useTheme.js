import { computed } from 'vue'
import { Dark } from 'quasar'

// Preserve existing preferences across the rebrand.
export const THEME_STORAGE_KEY = 'oneinstall-theme'

export function applySavedTheme() {
  let saved
  try {
    saved = localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    // Private browsing may deny storage; system mode still works.
  }
  Dark.set(saved === 'dark' ? true : saved === 'light' ? false : 'auto')
}

export function useTheme() {
  const isDark = computed(() => Dark.isActive)
  function toggleTheme() {
    Dark.set(!Dark.isActive)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, Dark.isActive ? 'dark' : 'light')
    } catch {
      // The theme remains usable for the current session.
    }
  }
  return { isDark, toggleTheme }
}
