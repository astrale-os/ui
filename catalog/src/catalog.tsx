import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@astrale-os/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@astrale-os/ui/alert'
import { Badge } from '@astrale-os/ui/badge'
import { Button } from '@astrale-os/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@astrale-os/ui/card'
import { Checkbox } from '@astrale-os/ui/checkbox'
import { Input } from '@astrale-os/ui/input'
import { Progress } from '@astrale-os/ui/progress'
import { Switch } from '@astrale-os/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@astrale-os/ui/tabs'
import { useState } from 'react'

import { DashboardOverview } from '../../registry/blocks/dashboard/overview.js'
import { CalendarRangeBasic } from '../../registry/patterns/calendar/range-basic.js'
import { ChartLineBasic } from '../../registry/patterns/chart/line-basic.js'
import { MessageThread } from '../../registry/patterns/message/thread.js'
import registry from '../../registry/registry.json'

type Preset = 'astrale' | 'compact' | 'expressive'

const chartData = [
  { label: 'Mon', value: 18 },
  { label: 'Tue', value: 31 },
  { label: 'Wed', value: 27 },
  { label: 'Thu', value: 46 },
  { label: 'Fri', value: 58 },
]
const days = Array.from({ length: 21 }, (_, index) => ({
  iso: `2026-09-${String(index + 1).padStart(2, '0')}`,
  label: String(index + 1),
}))

export function Catalog() {
  const [preset, setPreset] = useState<Preset>('astrale')
  const [dark, setDark] = useState(false)
  const [range, setRange] = useState<{ start?: string; end?: string }>({})
  const [selectedMetric, setSelectedMetric] = useState('deployments')

  return (
    <div data-ui-preset={preset} className={dark ? 'dark catalog-root' : 'catalog-root'}>
      <a className="skip-link" href="#catalog-main">
        Skip to catalog
      </a>
      <aside className="catalog-rail" aria-label="Catalog navigation">
        <div className="wordmark">
          <span aria-hidden>✦</span>
          <strong>Astrale UI</strong>
        </div>
        <p className="edition">Field guide · V1</p>
        <nav aria-label="Catalog navigation">
          <a href="#character">Character</a>
          <a href="#components">Components</a>
          <a href="#patterns">Patterns</a>
          <a href="#blocks">Blocks</a>
          <a href="#inventory">Inventory</a>
        </nav>
        <div className="rail-note">
          <span>49</span> consumer-owned compositions
          <br />
          <span>51</span> runtime owners
        </div>
      </aside>

      <main id="catalog-main" className="catalog-main">
        <header className="catalog-masthead">
          <div>
            <p className="eyebrow">A precise instrument for Astrale applications</p>
            <h1>
              One behavior system.
              <br />
              <em>Three characters.</em>
            </h1>
          </div>
          <div className="catalog-controls" aria-label="Catalog presentation">
            <label>
              Character
              <select
                value={preset}
                onChange={(event) => setPreset(event.currentTarget.value as Preset)}
              >
                <option value="astrale">Astrale</option>
                <option value="compact">Compact</option>
                <option value="expressive">Expressive</option>
              </select>
            </label>
            <label className="mode-control">
              Dark <Switch checked={dark} onCheckedChange={setDark} />
            </label>
          </div>
        </header>

        <section id="character" className="catalog-section character-grid">
          <div>
            <p className="section-index">01 / Character</p>
            <h2>
              Change the whole voice,
              <br />
              keep every promise.
            </h2>
            <p className="lede">
              Presets own color, density, geometry, type, shadow, and motion through semantic slots.
              DOM and interaction stay untouched.
            </p>
          </div>
          <Card className="specimen-card">
            <CardHeader>
              <div className="flex-row">
                <Badge>Live preset</Badge>
                <span className="signal">● operational</span>
              </div>
              <CardTitle>Domain observatory</CardTitle>
              <CardDescription>
                Controls inherit one coherent character without component forks.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Input aria-label="Domain path" defaultValue="/domains/observatory" />
              <div className="flex-row">
                <Button>Open domain</Button>
                <Button variant="outline">Inspect schema</Button>
                <Button variant="ghost">More</Button>
              </div>
              <Progress value={68} aria-label="Qualification progress" />
            </CardContent>
          </Card>
        </section>

        <section id="components" className="catalog-section">
          <div className="section-heading">
            <div>
              <p className="section-index">02 / Components</p>
              <h2>Stable owners, visible states.</h2>
            </div>
            <Badge variant="outline">package runtime</Badge>
          </div>
          <div className="component-grid">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Native behavior remains the foundation.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex-row">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <Button disabled>Disabled action</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Input state</CardTitle>
                <CardDescription>Labels and errors stay explicit.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <label>
                  Workspace
                  <Input defaultValue="Orion" />
                </label>
                <label className="flex-row">
                  <Checkbox defaultChecked /> Include inherited capabilities
                </label>
                <Alert variant="destructive">
                  <AlertTitle>Admission failed</AlertTitle>
                  <AlertDescription>The selected capability is unavailable.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Disclosure</CardTitle>
                <CardDescription>Keyboard behavior comes from the owner.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion>
                  <AccordionItem value="contract">
                    <AccordionTrigger>Public contract</AccordionTrigger>
                    <AccordionContent>Root and flat subpaths are both supported.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="weight">
                    <AccordionTrigger>Install discipline</AccordionTrigger>
                    <AccordionContent>
                      Patterns and blocks do not enter the runtime graph.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="patterns" className="catalog-section">
          <div className="section-heading">
            <div>
              <p className="section-index">03 / Patterns</p>
              <h2>Controlled interaction families.</h2>
            </div>
            <Badge variant="outline">registry source</Badge>
          </div>
          <Tabs defaultValue="chart">
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="message">Message</TabsTrigger>
            </TabsList>
            <TabsContent value="chart" className="pattern-stage">
              <ChartLineBasic data={chartData} label="Weekly graph operations" />
            </TabsContent>
            <TabsContent value="calendar" className="pattern-stage">
              <CalendarRangeBasic days={days} value={range} onValueChange={setRange} />
            </TabsContent>
            <TabsContent value="message" className="pattern-stage">
              <MessageThread
                messages={[
                  { id: '1', author: 'Runtime', content: 'The schema revision is ready.' },
                  { id: '2', author: 'Operator', content: 'Proceed with qualification.' },
                ]}
                onRetry={() => undefined}
              />
            </TabsContent>
          </Tabs>
        </section>

        <section id="blocks" className="catalog-section">
          <div className="section-heading">
            <div>
              <p className="section-index">04 / Blocks</p>
              <h2>
                Off-the-shelf regions,
                <br />
                application policy injected.
              </h2>
            </div>
          </div>
          <div className="block-frame">
            <DashboardOverview
              metrics={[
                { id: 'deployments', label: 'Deployments', value: 24, detail: '6 awaiting review' },
                { id: 'calls', label: 'Graph calls', value: '18.4k', detail: '99.98% accepted' },
                { id: 'domains', label: 'Domains', value: 7, detail: 'All qualified' },
              ]}
              onRefresh={() => undefined}
              onMetric={setSelectedMetric}
            />
            <p className="selection-note">
              Selected metric: <strong>{selectedMetric}</strong>
            </p>
          </div>
        </section>

        <section id="inventory" className="catalog-section">
          <div className="section-heading">
            <div>
              <p className="section-index">05 / Inventory</p>
              <h2>The complete install surface.</h2>
            </div>
            <Badge>{registry.items.length} items</Badge>
          </div>
          <ul className="inventory-grid">
            {registry.items.map((item) => (
              <li key={item.name}>
                <code>{item.meta.canonicalAddress}</code>
                <span>{item.type.replace('registry:', '')}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
