import { statusHeatmapIncidentRecoveryActivity } from './status-heatmap.fixture.js'
import {
  StatusHeatmap,
  StatusHeatmapBlock,
  StatusHeatmapBody,
  StatusHeatmapFooter,
  StatusHeatmapLegend,
  StatusHeatmapStat,
} from './status-heatmap.js'

export default function StatusHeatmapIncidentRecoveryPreview() {
  return (
    <StatusHeatmap
      data={statusHeatmapIncidentRecoveryActivity}
      labels={{
        heatmapLabel: 'API status heatmap, last 30 days',
        legendLabel: 'API status legend',
      }}
    >
      <StatusHeatmapBody>
        {({ activity, dayIndex }) => <StatusHeatmapBlock activity={activity} dayIndex={dayIndex} />}
      </StatusHeatmapBody>
      <StatusHeatmapFooter>
        <StatusHeatmapStat />
        <StatusHeatmapLegend />
      </StatusHeatmapFooter>
    </StatusHeatmap>
  )
}

export const preview = {
  canvas: 'wide' as const,
  source: '@heatmap/status-heatmap',
}
