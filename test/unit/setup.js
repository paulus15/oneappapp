// Node 25 exposes an experimental global localStorage that shadows jsdom's and lacks the
// Storage API unless started with --localstorage-file; provide an in-memory one for tests.
class MemoryStorage {
  #items = new Map()
  get length() {
    return this.#items.size
  }
  key(i) {
    return [...this.#items.keys()][i] ?? null
  }
  getItem(k) {
    return this.#items.has(k) ? this.#items.get(k) : null
  }
  setItem(k, v) {
    this.#items.set(k, String(v))
  }
  removeItem(k) {
    this.#items.delete(k)
  }
  clear() {
    this.#items.clear()
  }
}
for (const name of ['localStorage', 'sessionStorage']) {
  if (typeof globalThis[name]?.clear !== 'function')
    Object.defineProperty(globalThis, name, {
      value: new MemoryStorage(),
      configurable: true
    })
}
