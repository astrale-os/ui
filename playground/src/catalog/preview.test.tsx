import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { PreviewRenderBoundary } from './preview.js'
import { admitPreviewModule, type PreviewDescriptor } from './previews.js'

afterEach(cleanup)

test('a render failure stays local and retries without replacing the document', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const onError = vi.fn()
  const onRetry = vi.fn()
  let shouldThrow = true
  function TransientPreview() {
    if (shouldThrow) throw new Error('Transient preview failure')
    return <button>Recovered preview</button>
  }

  render(
    <PreviewRenderBoundary onError={onError} onRetry={onRetry}>
      <TransientPreview />
    </PreviewRenderBoundary>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Transient preview failure')
  expect(onError).toHaveBeenCalledOnce()

  const retry = screen.getByRole('button', { name: 'Retry preview' })
  retry.focus()
  shouldThrow = false
  fireEvent.click(retry)
  expect(screen.getByRole('button', { name: 'Recovered preview' })).toBeVisible()
  expect(onRetry).toHaveBeenCalledOnce()
  expect(consoleError).toHaveBeenCalled()
})

test('component preview source must match the catalog contract exactly', () => {
  const descriptor: PreviewDescriptor = {
    address: 'component/button',
    scene: 'default',
    id: 'component/button#default',
    canonical: true,
    kind: 'component',
    family: 'actions-inputs',
    group: 'Actions & inputs',
    title: 'button',
    defaultCanvas: 'panel',
    expectedSource: '@shadcn/button',
    load: async () => ({ default: () => null }),
  }
  const component = () => null
  expect(
    admitPreviewModule(descriptor, {
      default: component,
      preview: { source: '@shadcn/button' },
    }),
  ).toEqual({ component, canvas: 'panel' })
  expect(() =>
    admitPreviewModule(descriptor, {
      default: component,
      preview: { source: '@astrale-os/ui' },
    }),
  ).toThrow(/does not match @shadcn\/button/u)
})
