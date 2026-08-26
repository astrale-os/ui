import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from '@astrale-os/ui'
import { EyeIcon } from 'lucide-react'
import { Component, useCallback, useEffect, useRef, useState } from 'react'

import {
  admitPreviewModule,
  type PreviewCanvas as Canvas,
  type PreviewDescriptor,
} from './previews.js'

const visibilityCallbacks = new Map<Element, () => void>()
let visibilityObserver: IntersectionObserver | undefined

function observeNearViewport(element: Element, callback: () => void) {
  if (typeof IntersectionObserver === 'undefined') {
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
  sceneCount = 1,
  showOpen = true,
  onNavigate,
}: {
  descriptor: PreviewDescriptor
  eager?: boolean
  sceneCount?: number
  showOpen?: boolean
  onNavigate: (url: string, anchorId?: string, focusId?: string) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const active = useRef(true)
  const pending = useRef<Promise<void> | undefined>(undefined)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'render-error'>(
    'idle',
  )
  const [error, setError] = useState<Error>()
  const [loaded, setLoaded] = useState<{ component: React.ComponentType; canvas: Canvas }>()
  const [renderAttempt, setRenderAttempt] = useState(0)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  const load = useCallback(() => {
    if (loaded || pending.current) return
    setStatus('loading')
    setError(undefined)
    pending.current = descriptor
      .load()
      .then((module) => {
        if (!active.current) return
        setLoaded(admitPreviewModule(descriptor, module))
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
  }, [descriptor, loaded])

  useEffect(() => {
    if (eager) {
      load()
      return
    }
    const element = cardRef.current
    if (!element) return
    return observeNearViewport(element, load)
  }, [eager, load])

  const retryRender = () => {
    setStatus('ready')
    setRenderAttempt((attempt) => attempt + 1)
  }
  const canvas = loaded?.canvas ?? descriptor.defaultCanvas
  const Preview = loaded?.component
  const isolated = `?preview=${encodeURIComponent(descriptor.id)}`
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
      data-slot="component-specimen"
      className={`preview-card preview-card--${canvas}`}
      aria-busy={status === 'loading' ? true : undefined}
      aria-labelledby={`preview-title-${previewId}`}
    >
      <CardHeader>
        <CardTitle id={`preview-title-${previewId}`}>{descriptor.title}</CardTitle>
        {showOpen ? (
          <CardAction className="preview-card-actions">
            {sceneCount > 1 ? (
              <Badge variant="outline" aria-label={`${sceneCount} preview scenes`}>
                {sceneCount}
              </Badge>
            ) : null}
            <Button
              id={`view-${previewId}`}
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              aria-label={`View ${descriptor.title} preview`}
              title="View preview"
              render={<a href={isolated} />}
              onClick={(event) => {
                event.preventDefault()
                onNavigate(isolated, `preview-${previewId}`, `view-${previewId}`)
              }}
            >
              <EyeIcon />
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="specimen-content preview-content">
        {status === 'idle' || status === 'loading' ? (
          <div className="preview-placeholder" aria-hidden="true">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : null}
        {status === 'error' && error ? <PreviewLoadFailure message={error.message} /> : null}
        {(status === 'ready' || status === 'render-error') && Preview ? (
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
