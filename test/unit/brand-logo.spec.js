import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { readFileSync } from 'node:fs'
import BrandLogo from '@/components/BrandLogo.vue'

const source = readFileSync('src/components/BrandLogo.vue', 'utf8')
const { descriptor } = parse(source)
const compiled = compileStyle({
  source: descriptor.styles[0].content,
  filename: 'src/components/BrandLogo.vue',
  id: 'data-v-logo-check',
  scoped: true,
  preprocessLang: 'scss'
})
let wrapper, stylesheet

afterEach(() => {
  wrapper?.unmount()
  stylesheet?.remove()
  document.body.classList.remove('body--dark')
})

describe('logo theme styles', () => {
  it.each([false, true])(
    'changes only Store, without filtering the page (dark=%s)',
    dark => {
      expect(compiled.errors).toEqual([])
      stylesheet = document.createElement('style')
      stylesheet.textContent = compiled.code
      document.head.append(stylesheet)
      document.body.classList.toggle('body--dark', dark)
      wrapper = mount(BrandLogo, { attachTo: document.body })
      for (const element of [
        wrapper.element,
        ...wrapper.element.querySelectorAll('*')
      ])
        element.setAttribute('data-v-logo-check', '')

      expect(['', 'none']).toContain(getComputedStyle(document.body).filter)
      expect(['', 'none']).toContain(
        getComputedStyle(wrapper.get('.pwa-brand__letters').element).filter
      )
      expect(
        getComputedStyle(wrapper.get('.pwa-brand__store').element).filter
      ).toBe(dark ? 'brightness(0) invert(1)' : 'brightness(0)')
    }
  )
})
