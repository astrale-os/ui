import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@astrale-os/ui'
import { useMemo, useState } from 'react'

import { DashboardOverview } from '../../../registry/blocks/dashboard/overview.js'
import { CalendarRangeBasic } from '../../../registry/patterns/calendar/range-basic.js'
import { ChartLineBasic } from '../../../registry/patterns/chart/line-basic.js'
import { MessageThread } from '../../../registry/patterns/message/thread.js'
import registry from '../../../registry/registry.json'

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

export function RegistrySpecimens() {
  const [query, setQuery] = useState('')
  const [range, setRange] = useState<{ start?: string; end?: string }>({})
  const [selectedMetric, setSelectedMetric] = useState('deployments')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return registry.items
    return registry.items.filter((item) =>
      [item.meta.canonicalAddress, item.title, item.description].some((value) =>
        String(value).toLowerCase().includes(needle),
      ),
    )
  }, [query])

  return (
    <section id="registry" className="registry-section" aria-labelledby="registry-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">05 · Consumer-owned source</p>
          <h2 id="registry-title">Patterns, blocks & themes</h2>
        </div>
        <Badge>{registry.items.length} installable items</Badge>
      </div>

      <Tabs defaultValue="patterns">
        <TabsList>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="inventory">Complete inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="patterns" className="registry-live-stage">
          <div className="registry-live-grid">
            <Card>
              <CardHeader>
                <CardTitle>Chart · line basic</CardTitle>
                <CardDescription>Controlled data with a host-overridable palette.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLineBasic data={chartData} label="Weekly graph operations" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Calendar · range basic</CardTitle>
                <CardDescription>Calendar state stays in the host.</CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarRangeBasic days={days} value={range} onValueChange={setRange} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Message · thread</CardTitle>
                <CardDescription>Transport-free content and retry ownership.</CardDescription>
              </CardHeader>
              <CardContent>
                <MessageThread
                  messages={[
                    { id: '1', author: 'Runtime', content: 'The schema revision is ready.' },
                    { id: '2', author: 'Operator', content: 'Proceed with qualification.' },
                  ]}
                  onRetry={() => undefined}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="blocks" className="registry-live-stage">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard · overview</CardTitle>
              <CardDescription>
                Application data and actions are injected; the composition owns no hidden I/O.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardOverview
                metrics={[
                  {
                    id: 'deployments',
                    label: 'Deployments',
                    value: 24,
                    detail: '6 awaiting review',
                  },
                  { id: 'calls', label: 'Graph calls', value: '18.4k', detail: '99.98% accepted' },
                  { id: 'domains', label: 'Domains', value: 7, detail: 'All qualified' },
                ]}
                onRefresh={() => undefined}
                onMetric={setSelectedMetric}
              />
              <p className="selection-note">
                Selected metric: <strong>{selectedMetric}</strong>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory" className="registry-inventory-stage">
          <Input
            aria-label="Search registry"
            placeholder="Search pattern, block, or theme…"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <ItemGroup className="registry-inventory" aria-live="polite">
            {filtered.map((item) => (
              <Item key={item.name} size="xs" variant="outline" data-registry-item={item.name}>
                <ItemContent>
                  <ItemTitle>{item.meta.canonicalAddress}</ItemTitle>
                  <ItemDescription>{item.description}</ItemDescription>
                </ItemContent>
                <Badge variant="outline">{item.type.replace('registry:', '')}</Badge>
              </Item>
            ))}
          </ItemGroup>
        </TabsContent>
      </Tabs>
    </section>
  )
}
