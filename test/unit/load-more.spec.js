import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useLoadMore, pageOf } from '@/composables/useLoadMore'

const deferred = () => {
  let resolve
  const promise = new Promise(r => {
    resolve = r
  })
  return { promise, resolve }
}
describe('server pagination', () => {
  it('accepts Laravel paginator and resource metadata', () => {
    expect(
      pageOf({ data: [{ id: 1 }], meta: { last_page: 4, total: 39 } })
    ).toEqual({ items: [{ id: 1 }], lastPage: 4, total: 39 })
  })
  it('keeps rows after a failed next page and retries the same page', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }], last_page: 2, total: 2 })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        data: [{ id: 1 }, { id: 2 }],
        last_page: 2,
        total: 2
      })
    const list = useLoadMore(fetch)
    await list.reload()
    await list.loadMore()
    expect(list.items.value).toEqual([{ id: 1 }])
    expect(list.moreError.value).toBe(true)
    await list.loadMore()
    expect(fetch.mock.calls.map(([page]) => page)).toEqual([1, 2, 2])
    expect(list.items.value).toEqual([{ id: 1 }, { id: 2 }])
    expect(list.hasMore.value).toBe(false)
  })
  it('ignores an old page when filters change, including its loading state', async () => {
    const pending = deferred()
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }], last_page: 2 })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ data: [{ id: 9 }], last_page: 1 })
    const list = useLoadMore(fetch)
    await list.reload()
    const old = list.loadMore()
    await list.reload()
    pending.resolve({ data: [{ id: 2 }], last_page: 2 })
    await old
    expect(list.items.value).toEqual([{ id: 9 }])
    expect(list.loadingMore.value).toBe(false)
  })
  it('prevents concurrent next-page requests', async () => {
    const pending = deferred()
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }], last_page: 2 })
      .mockReturnValueOnce(pending.promise)
    const list = useLoadMore(fetch)
    await list.reload()
    const first = list.loadMore()
    await list.loadMore()
    expect(fetch).toHaveBeenCalledTimes(2)
    pending.resolve({ data: [{ id: 2 }], last_page: 2 })
    await first
  })
  it('does not apply responses after a component is disposed', async () => {
    const pending = deferred(),
      scope = effectScope()
    const list = scope.run(() => useLoadMore(() => pending.promise))
    const request = list.reload()
    scope.stop()
    pending.resolve({ data: [{ id: 1 }] })
    await request
    expect(list.items.value).toEqual([])
  })
})
