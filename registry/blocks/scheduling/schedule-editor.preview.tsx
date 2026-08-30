import { useState } from 'react'

import type { ScheduleDefinition } from './schedule-editor/schedule-editor.js'

import { ScheduleEditor } from './schedule-editor/schedule-editor.js'
import { scheduleZones, weeklyDigestSchedule } from './scheduling.fixture.js'

export default function ScheduleEditorPreview() {
  const [schedule, setSchedule] = useState<Partial<ScheduleDefinition>>(weeklyDigestSchedule)

  return (
    <div className="w-full min-w-0 max-w-md">
      <ScheduleEditor value={schedule} onChange={setSchedule} zones={scheduleZones} />
    </div>
  )
}

export const preview = {
  canvas: 'panel' as const,
  source:
    'https://raw.githubusercontent.com/wardian-app/Wardian/0ae5b57a2229f7c98711d646b837be744748c6cc/src/features/automations/ScheduleEditor.tsx',
}
