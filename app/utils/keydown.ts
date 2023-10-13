import type { FetcherWithComponents } from '@remix-run/react'

export const handleKeyDown = (
  e: React.KeyboardEvent<HTMLFormElement>,
  fetcher: FetcherWithComponents<never>
) => {
  if (e.nativeEvent.isComposing || e.key !== 'Enter') {
    return
  }
  if (e.shiftKey && e.key === 'Enter') {
    fetcher.submit(e.currentTarget, { method: 'POST' })
  }
}
