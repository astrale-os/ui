import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@astrale-os/ui'
import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
} from 'react'

import {
  admitPreviewModule,
  type PreviewCanvas as Canvas,
  type PreviewDescriptor,
} from './previews.js'

const visibilityCallbacks = new Map<Element, () => void>()
let visibilityObserver: IntersectionObserver | undefined
const presenceCallbacks = new Map<Element, (near: boolean) => void>()
let presenceObserver: IntersectionObserver | undefined

const previewPresenceMargin = '100% 0px'
const previewParkDelay = 250

export function observeNearViewport(element: Element, callback: () => void) {
  if (typeof IntersectionObserver === 'undefined') {
    callback()
    return () => undefined
  }
  const bounds = element.getBoundingClientRect()
  const margin = window.innerHeight * 0.75
  if (bounds.top <= window.innerHeight + margin && bounds.bottom >= -margin) {
    callback()
    return () => undefined
  }
  visibilityObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const load = visibilityCallbacks.get(entry.target)
        visibilityCallbacks.delete(entry.target)
        visibilityObserver?.unobserve(entry.target)
        load?.()
      }
    },
    { rootMargin: '75% 0px' },
  )
  visibilityCallbacks.set(element, callback)
  visibilityObserver.observe(element)
  return () => {
    visibilityCallbacks.delete(element)
    visibilityObserver?.unobserve(element)
  }
}

function releasePresenceTarget(element: Element) {
  presenceCallbacks.delete(element)
  presenceObserver?.unobserve(element)
  if (presenceCallbacks.size === 0) {
    presenceObserver?.disconnect()
    presenceObserver = undefined
  }
}

function observePreviewPresence(element: Element, callback: (near: boolean) => void) {
  if (typeof IntersectionObserver === 'undefined') {
    callback(true)
    return () => undefined
  }
  presenceObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        presenceCallbacks.get(entry.target)?.(entry.isIntersecting)
      }
    },
    { rootMargin: previewPresenceMargin },
  )
  presenceCallbacks.set(element, callback)
  presenceObserver.observe(element)
  return () => releasePresenceTarget(element)
}

export class PreviewRenderBoundary extends Component<
  { children: React.ReactNode; onError: () => void; onRetry: () => void },
  { error?: Error }
> {
  state: { error?: Error } = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch() {
    this.props.onError()
  }

  retry = () => {
    this.setState({ error: undefined })
    this.props.onRetry()
  }

  render() {
    if (!this.state.error) return this.props.children
    return <PreviewFailure message={this.state.error.message} onRetry={this.retry} />
  }
}

function PreviewFailure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert>
      <AlertTitle>Preview unavailable</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry preview
      </Button>
    </Alert>
  )
}

function PreviewLoadFailure({ message }: { message: string }) {
  return (
    <Alert>
      <AlertTitle>Preview unavailable</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
        Reload playground
      </Button>
    </Alert>
  )
}

export function PreviewCanvas({
  descriptor,
  eager = false,
}: {
  descriptor: PreviewDescriptor
  eager?: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const active = useRef(true)
  const pending = useRef<Promise<void> | undefined>(undefined)
  const loadAttempted = useRef(false)
  const loadedRef = useRef(false)
  const nearViewport = useRef(eager)
  const containsFocus = useRef(false)
  const parkTimer = useRef<number | undefined>(undefined)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'render-error'>(
    'idle',
  )
  const [error, setError] = useState<Error>()
  const [loaded, setLoaded] = useState<{ component: React.ComponentType; canvas: Canvas }>()
  const [mounted, setMounted] = useState(eager)
  const [retainedContentHeight, setRetainedContentHeight] = useState(0)
  const [renderAttempt, setRenderAttempt] = useState(0)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      if (parkTimer.current !== undefined) window.clearTimeout(parkTimer.current)
    }
  }, [])

  const load = useCallback(() => {
    if (loadAttempted.current || loadedRef.current || pending.current) return
    loadAttempted.current = true
    setStatus('loading')
    setError(undefined)
    pending.current = descriptor
      .load()
      .then((module) => {
        if (!active.current) return
        const admitted = admitPreviewModule(descriptor, module)
        loadedRef.current = true
        setLoaded(admitted)
        setStatus('ready')
      })
      .catch((reason: unknown) => {
        if (!active.current) return
        setError(reason instanceof Error ? reason : new Error(String(reason)))
        setStatus('error')
      })
      .finally(() => {
        pending.current = undefined
      })
  }, [descriptor])

  const cancelPark = useCallback(() => {
    if (parkTimer.current === undefined) return
    window.clearTimeout(parkTimer.current)
    parkTimer.current = undefined
  }, [])

  const retain = useCallback(() => {
    cancelPark()
    setMounted(true)
  }, [cancelPark])

  const schedulePark = useCallback(() => {
    cancelPark()
    if (eager || nearViewport.current || containsFocus.current) return
    parkTimer.current = window.setTimeout(() => {
      parkTimer.current = undefined
      if (!nearViewport.current && !containsFocus.current) setMounted(false)
    }, previewParkDelay)
  }, [cancelPark, eager])

  useEffect(() => {
    const element = cardRef.current
    if (!element) return
    if (eager) {
      nearViewport.current = true
      retain()
      load()
      return
    }
    return observePreviewPresence(element, (near) => {
      nearViewport.current = near
      if (near) {
        retain()
        load()
      } else {
        schedulePark()
      }
    })
  }, [eager, load, retain, schedulePark])

  const Preview = loaded?.component
  const previewMounted = Boolean(Preview && (mounted || status === 'render-error'))

  useLayoutEffect(() => {
    if (!previewMounted) return
    const element = contentRef.current
    if (!element) return
    const measure = () => {
      const height = Math.ceil(element.getBoundingClientRect().height)
      if (height > 0) setRetainedContentHeight((current) => (current === height ? current : height))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [previewMounted, renderAttempt])

  const handleFocusCapture = () => {
    containsFocus.current = true
    retain()
    load()
  }

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) return
    containsFocus.current = false
    schedulePark()
  }

  const retryRender = () => {
    setStatus('ready')
    setRenderAttempt((attempt) => attempt + 1)
  }
  const canvas = loaded?.canvas ?? descriptor.defaultCanvas
  const parked = Boolean(status === 'ready' && Preview && !previewMounted)
  const componentName = descriptor.kind === 'component' ? descriptor.address.slice(10) : undefined
  const previewId = descriptor.id.replaceAll(/[^a-z0-9]+/gu, '-')

  return (
    <Card
      ref={cardRef}
      id={`preview-${previewId}`}
      role="region"
      tabIndex={-1}
      size="sm"
      data-component={componentName}
      data-preview-address={descriptor.address}
      data-preview-scene={descriptor.scene}
      data-preview-kind={descriptor.kind}
      data-preview-status={status}
      data-preview-canvas={canvas}
      data-preview-mounted={previewMounted ? 'true' : undefined}
      data-slot="component-specimen"
      className={`preview-card preview-card--${canvas}`}
      aria-busy={status === 'loading' ? true : undefined}
      aria-labelledby={`preview-title-${previewId}`}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <CardHeader>
        <CardTitle id={`preview-title-${previewId}`}>{descriptor.title}</CardTitle>
      </CardHeader>
      <CardContent
        ref={contentRef}
        className="specimen-content preview-content"
        style={
          parked && retainedContentHeight > 0
            ? { blockSize: retainedContentHeight, boxSizing: 'border-box' }
            : undefined
        }
      >
        {status === 'idle' || status === 'loading' ? (
          <div className="preview-placeholder" aria-hidden="true">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : null}
        {status === 'error' && error ? <PreviewLoadFailure message={error.message} /> : null}
        {parked ? <div className="preview-placeholder" aria-hidden="true" /> : null}
        {(status === 'ready' || status === 'render-error') && previewMounted && Preview ? (
          <PreviewRenderBoundary
            key={renderAttempt}
            onError={() => setStatus('render-error')}
            onRetry={retryRender}
          >
            <Preview />
          </PreviewRenderBoundary>
        ) : null}
      </CardContent>
    </Card>
  )
}
