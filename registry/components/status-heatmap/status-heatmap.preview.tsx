import { statusHeatmapActivity } from './status-heatmap.fixture.js'
import {
  StatusHeatmap,
  StatusHeatmapBlock,
  StatusHeatmapBody,
  StatusHeatmapFooter,
  StatusHeatmapLegend,
  StatusHeatmapStat,
} from './status-heatmap.js'

export default function StatusHeatmapPreview() {
  return (
    <StatusHeatmap data={statusHeatmapActivity}>
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
