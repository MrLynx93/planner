import { useTranslation } from 'react-i18next'
import { ContextMenu } from 'radix-ui'
import type { AnnexDto, ExceptionReason, RemovedExceptionBlock, ScheduleBlock } from './types'
import { WEEK_DAYS, hoursRange, totalGridHeight, timeToMinutes, timeToTop, blockHeight, formatTime, HOUR_HEIGHT_PX } from './utils'
import { TimeBlock } from './TimeBlock'

interface AssignableBlock { id: number; startTime: string; endTime: string }

function assignColumns(blocks: AssignableBlock[]): Map<number, { columnIndex: number; columnCount: number }> {
  const sorted = [...blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  )

  // Greedily assign each block to the first free column
  const columnEnds: number[] = [] // columnEnds[i] = endTime (minutes) of last block in column i
  const colOf = new Map<number, number>()

  for (const block of sorted) {
    const start = timeToMinutes(block.startTime)
    const end = timeToMinutes(block.endTime)
    let col = columnEnds.findIndex(e => e <= start)
    if (col === -1) col = columnEnds.length
    columnEnds[col] = end
    colOf.set(block.id, col)
  }

  // For each block, columnCount = (max column index among all overlapping blocks) + 1
  const result = new Map<number, { columnIndex: number; columnCount: number }>()
  for (const block of sorted) {
    const start = timeToMinutes(block.startTime)
    const end = timeToMinutes(block.endTime)
    const overlapping = sorted.filter(
      b => timeToMinutes(b.startTime) < end && start < timeToMinutes(b.endTime),
    )
    const columnCount = Math.max(...overlapping.map(b => colOf.get(b.id)!)) + 1
    result.set(block.id, { columnIndex: colOf.get(block.id)!, columnCount })
  }

  return result
}

interface Props {
  blocks: ScheduleBlock[]
  annex: AnnexDto
  weekDays: Date[]
  colorBy?: 'teacher' | 'group'
  onBlockContextMenu?: (block: ScheduleBlock) => void
  showExceptions?: boolean
  exceptionReasonByTimeBlockId?: Map<number, ExceptionReason>
  removedExceptions?: RemovedExceptionBlock[]
}

export function CalendarGrid({ blocks, weekDays, colorBy = 'teacher', onBlockContextMenu, showExceptions, exceptionReasonByTimeBlockId, removedExceptions }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('pl') ? 'pl-PL' : 'en-GB'

  const displayScheduleStartTime = '06:00'
  const displayScheduleEndTime = '20:00'
  const openingHour = Math.floor(timeToMinutes(displayScheduleStartTime) / 60)
  const hours = hoursRange(displayScheduleStartTime, displayScheduleEndTime)
  const gridHeight = totalGridHeight(displayScheduleStartTime, displayScheduleEndTime)

  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <div className="m-16 min-w-[560px] border border-gray-400 rounded">
        {/* Sticky day header */}
        <div className="sticky top-0 z-10 flex bg-background border-b border-gray-400">
          <div className="w-12 shrink-0" />
          {WEEK_DAYS.map((day, i) => (
            <div key={day} className="flex-1 border-l border-gray-500 px-2 py-2 text-center">
              <div className="text-xs text-muted-foreground capitalize">
                {dayFmt.format(weekDays[i])}
              </div>
              <div className="text-sm font-semibold">
                {dateFmt.format(weekDays[i])}
              </div>
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="flex" style={{ height: gridHeight }}>
          {/* Time axis */}
          <div className="w-12 shrink-0 relative">
            {hours.slice(0, -1).map((h, i) => (
              <div
                key={h}
                className="absolute right-2 text-xs text-muted-foreground select-none"
                style={{
                  top: (h - openingHour) * HOUR_HEIGHT_PX,
                  transform: i === 0 ? undefined : 'translateY(-50%)',
                }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {WEEK_DAYS.map(day => {
            const dayBlocks = blocks.filter(b => b.dayOfWeek === day)
            const dayGhosts = showExceptions ? (removedExceptions?.filter(re => re.dayOfWeek === day) ?? []) : []
            const GHOST_ID_OFFSET = 1_000_000
            const allLayoutBlocks = [
              ...dayBlocks,
              ...dayGhosts.map(re => ({ id: re.id + GHOST_ID_OFFSET, startTime: re.startTime, endTime: re.endTime })),
            ]
            const columns = assignColumns(allLayoutBlocks)
            return (
              <div key={day} className="flex-1 relative border-l border-gray-500">
                {/* Hour lines */}
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-gray-300 z-10 pointer-events-none"
                    style={{ top: (h - openingHour) * HOUR_HEIGHT_PX }}
                  />
                ))}

                {/* Blocks */}
                {dayBlocks.map(block => {
                  const { columnIndex, columnCount } = columns.get(block.id)!
                  const exceptionReason = showExceptions && block.type === 'MODIFICATION'
                    ? exceptionReasonByTimeBlockId?.get(block.timeBlockId)
                    : undefined
                  const blockEl = (
                    <TimeBlock
                      key={block.id}
                      block={block}
                      scheduleStartTime={displayScheduleStartTime}
                      columnIndex={columnIndex}
                      columnCount={columnCount}
                      colorBy={colorBy}
                      exceptionReason={exceptionReason}
                    />
                  )
                  if (!onBlockContextMenu) return blockEl
                  return (
                    <ContextMenu.Root key={block.id}>
                      <ContextMenu.Trigger asChild>{blockEl}</ContextMenu.Trigger>
                      <ContextMenu.Portal>
                        <ContextMenu.Content className="z-50 min-w-[160px] rounded-md border border-border bg-background p-1 shadow-md">
                          <ContextMenu.Item
                            className="flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm outline-none hover:bg-accent"
                            onSelect={() => onBlockContextMenu(block)}
                          >
                            {t('exceptions.createFromBlock')}
                          </ContextMenu.Item>
                        </ContextMenu.Content>
                      </ContextMenu.Portal>
                    </ContextMenu.Root>
                  )
                })}

                {/* Ghost blocks for removed exceptions */}
                {dayGhosts.map(re => {
                  const top = timeToTop(re.startTime, displayScheduleStartTime)
                  const height = blockHeight(re.startTime, re.endTime)
                  const { columnIndex, columnCount } = columns.get(re.id + GHOST_ID_OFFSET)!
                  const leftPct = (columnIndex / columnCount) * 100
                  const widthPct = (1 / columnCount) * 100
                  return (
                    <div
                      key={re.id}
                      className="absolute rounded pointer-events-none"
                      style={{
                        left: `calc(${leftPct}% + 1px)`,
                        width: `calc(${widthPct}% - 2px)`,
                        top: top + 1,
                        height: Math.max(height - 2, 20),
                        border: '2px dashed #ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.06)',
                      }}
                    >
                      <div className="relative z-20 px-1.5 py-0.5 overflow-hidden h-full">
                        <p className="text-xs font-semibold leading-tight truncate" style={{ color: '#ef4444' }}>
                          {colorBy === 'group' ? re.groupName : `${re.teacherFirstName} ${re.teacherLastName}`}
                        </p>
                        {height >= 32 && (
                          <p className="text-xs leading-tight truncate opacity-70" style={{ color: '#ef4444' }}>
                            {formatTime(re.startTime)}–{formatTime(re.endTime)}
                          </p>
                        )}
                        <p className="text-xs leading-tight truncate font-medium" style={{ color: '#ef4444' }}>
                          {t('schedule.removed')} · {t(`exceptions.reasons.${re.reason}`)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
