import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, expect, test, vi } from 'vitest'

import { PreviewCanvas, PreviewRenderBoundary } from './preview.js'
import { admitPreviewModule, type PreviewDescriptor } from './previews.js'

class IntersectionObserverMock implements IntersectionObserver {
  static instances: IntersectionObserverMock[] = []
  readonly root = null
  readonly rootMargin: string
  readonly thresholds = [0]
  readonly scrollMargin = '0px'
  private readonly callback: IntersectionObserverCallback
  private readonly targets = new Set<Element>()

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback
    this.rootMargin = options.rootMargin ?? '0px'
    IntersectionObserverMock.instances.push(this)
  }

  disconnect() {
    this.targets.clear()
  }
  observe(target: Element) {
    this.targets.add(target)
  }
  takeRecords() {
    return []
  }
  unobserve(target: Element) {
    this.targets.delete(target)
  }

  trigger(target: Element, isIntersecting: boolean) {
    expect(this.targets.has(target)).toBe(true)
    const bounds = target.getBoundingClientRect()
    this.callback(
      [
        {
          boundingClientRect: bounds,
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: bounds,
          isIntersecting,
          rootBounds: null,
          target,
          time: performance.now(),
        },
      ],
      this,
    )
  }
}

class ResizeObserverMock implements ResizeObserver {
  static instances: ResizeObserverMock[] = []
  private readonly callback: ResizeObserverCallback
  private readonly targets = new Set<Element>()

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    ResizeObserverMock.instances.push(this)
  }

  disconnect() {
    this.targets.clear()
  }
  observe(target: Element) {
    this.targets.add(target)
  }
  unobserve(target: Element) {
    this.targets.delete(target)
  }
  trigger(target: Element) {
    expect(this.targets.has(target)).toBe(true)
    this.callback([], this)
  }
}

function previewDescriptor(component: React.ComponentType): PreviewDescriptor {
  return {
    address: 'component/test-preview',
    scene: 'default',
    id: 'component/test-preview#default',
    canonical: true,
    kind: 'component',
    family: 'test-preview',
    group: 'Test preview',
    title: 'test preview',
    defaultCanvas: 'panel',
    expectedSource: '@shadcn/test-preview',
    load: vi.fn(async () => ({
      default: component,
      preview: { source: '@shadcn/test-preview' },
    })),
  }
}

function presenceObserver() {
  return IntersectionObserverMock.instances.find((observer) => observer.rootMargin === '100% 0px')!
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  IntersectionObserverMock.instances = []
  ResizeObserverMock.instances = []
})

test('a ready preview parks far offscreen, retains geometry, and remounts with fresh state', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)

  function StatefulPreview() {
    const [count, setCount] = useState(0)
    return <button onClick={() => setCount((value) => value + 1)}>Count {count}</button>
  }

  const descriptor = previewDescriptor(StatefulPreview)
  const { container } = render(<PreviewCanvas descriptor={descriptor} />)
  const card = container.querySelector('[data-preview-address="component/test-preview"]')!

  await act(async () => {
    presenceObserver().trigger(card, true)
    await Promise.resolve()
  })
  const counter = screen.getByRole('button', { name: 'Count 0' })
  fireEvent.click(counter)
  expect(screen.getByRole('button', { name: 'Count 1' })).toBeVisible()
  expect(card).toHaveAttribute('data-preview-mounted', 'true')

  const content = card.querySelector('[data-slot="card-content"]')!
  vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
    bottom: 164,
    height: 164,
    left: 0,
    right: 300,
    top: 0,
    width: 300,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  act(() => ResizeObserverMock.instances.at(-1)!.trigger(content))

  act(() => presenceObserver().trigger(card, false))
  act(() => vi.advanceTimersByTime(249))
  expect(screen.getByRole('button', { name: 'Count 1' })).toBeVisible()
  act(() => vi.advanceTimersByTime(1))
  expect(screen.queryByRole('button', { name: 'Count 1' })).not.toBeInTheDocument()
  expect(card).not.toHaveAttribute('data-preview-mounted')
  expect(content).toHaveStyle({ blockSize: '164px', boxSizing: 'border-box' })

  act(() => presenceObserver().trigger(card, true))
  expect(screen.getByRole('button', { name: 'Count 0' })).toBeVisible()
  expect(descriptor.load).toHaveBeenCalledOnce()
})

test('a focused preview remains mounted until focus leaves while it is far offscreen', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  const descriptor = previewDescriptor(() => <button>Keep focus</button>)
  const { container } = render(<PreviewCanvas descriptor={descriptor} />)
  const card = container.querySelector('[data-preview-address="component/test-preview"]')!

  await act(async () => {
    presenceObserver().trigger(card, true)
    await Promise.resolve()
  })
  const button = screen.getByRole('button', { name: 'Keep focus' })
  fireEvent.focus(button)
  act(() => presenceObserver().trigger(card, false))
  act(() => vi.advanceTimersByTime(500))
  expect(button).toBeVisible()

  fireEvent.blur(button, { relatedTarget: document.body })
  act(() => vi.advanceTimersByTime(250))
  expect(screen.queryByRole('button', { name: 'Keep focus' })).not.toBeInTheDocument()
})

test('an eager isolated preview loads and remains mounted without viewport admission', async () => {
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  const descriptor = previewDescriptor(() => <p>Isolated preview</p>)
  const { container } = render(<PreviewCanvas descriptor={descriptor} eager />)

  expect(await screen.findByText('Isolated preview')).toBeVisible()
  const card = container.querySelector('[data-preview-address="component/test-preview"]')!
  expect(card).toHaveAttribute('data-preview-mounted', 'true')
  expect(screen.getByText('Isolated preview')).toBeVisible()
  expect(descriptor.load).toHaveBeenCalledOnce()
})

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
