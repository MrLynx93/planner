import type { ScheduleBlock } from './types'
import { getColorForId } from './colors'
import { timeToTop, blockHeight, formatTime } from './utils'

interface Props {
  block: ScheduleBlock
  openingTime: string
}

export function TimeBlock({ block, openingTime }: Props) {
  const color = getColorForId(block.teacherId)
  const top = timeToTop(block.startTime, openingTime)
  const height = blockHeight(block.startTime, block.endTime)
  const isModification = block.type === 'MODIFICATION'

  return (
    <div
      className="absolute left-1 right-1 rounded overflow-hidden px-1.5 py-0.5 cursor-pointer transition-opacity hover:opacity-90"
      style={{
        top: top + 1,
        height: Math.max(height - 2, 20),
        backgroundColor: color.bg,
        ...(isModification
          ? { border: `1.5px dashed ${color.border}` }
          : { borderLeft: `3px solid ${color.border}` }),
      }}
    >
      <p
        className="text-xs font-semibold leading-tight truncate"
        style={{ color: color.text }}
      >
        {block.teacherFirstName} {block.teacherLastName}
      </p>
      {height >= 32 && (
        <p className="text-xs leading-tight truncate opacity-80" style={{ color: color.text }}>
          {formatTime(block.startTime)}–{formatTime(block.endTime)}
        </p>
      )}
    </div>
  )
}
