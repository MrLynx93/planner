import type { ScheduleBlock } from './types'
import { getColorForId } from './colors'
import { timeToTop, blockHeight, formatTime } from './utils'

interface Props {
  block: ScheduleBlock
  scheduleStartTime: string
  columnIndex: number
  columnCount: number
  colorBy?: 'teacher' | 'group'
}

export function TimeBlock({ block, scheduleStartTime, columnIndex, columnCount, colorBy = 'teacher' }: Props) {
  const color = getColorForId(colorBy === 'group' ? block.groupId : block.teacherId)
  const top = timeToTop(block.startTime, scheduleStartTime)
  const height = blockHeight(block.startTime, block.endTime)
  const isModification = block.type === 'MODIFICATION'

  const leftPct = (columnIndex / columnCount) * 100
  const widthPct = (1 / columnCount) * 100

  return (
    <div
      className="absolute rounded cursor-pointer"
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
      {/* Text layer sits above hour lines (z-20 > z-10 for hour lines) */}
      <div className="relative z-20 px-1.5 py-0.5 overflow-hidden h-full">
        <p
          className="text-xs font-semibold leading-tight truncate"
          style={{ color: color.text, backgroundColor: color.bg }}
        >
          {colorBy === 'group' ? block.groupName : `${block.teacherFirstName} ${block.teacherLastName}`}
        </p>
        {height >= 32 && (
          <p className="text-xs leading-tight truncate opacity-80" style={{ color: color.text, backgroundColor: color.bg }}>
            {formatTime(block.startTime)}–{formatTime(block.endTime)}
          </p>
        )}
      </div>
    </div>
  )
}
