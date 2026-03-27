import type { ScheduleBlock } from './types'
import { getColorForId } from './colors'
import { timeToTop, blockHeight, formatTime } from './utils'

interface Props {
  block: ScheduleBlock
  openingTime: string
  columnIndex: number
  columnCount: number
}

export function TimeBlock({ block, openingTime, columnIndex, columnCount }: Props) {
  const color = getColorForId(block.teacherId)
  const top = timeToTop(block.startTime, openingTime)
  const height = blockHeight(block.startTime, block.endTime)
  const isModification = block.type === 'MODIFICATION'

  const leftPct = (columnIndex / columnCount) * 100
  const widthPct = (1 / columnCount) * 100

  return (
    <div
      className="absolute rounded overflow-hidden px-1.5 py-0.5 cursor-pointer transition-opacity hover:opacity-90"
      style={{
        left: `calc(${leftPct}% + 1px)`,
        width: `calc(${widthPct}% - 2px)`,
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
