import { useTranslation } from 'react-i18next'
import type { AnnexDto, ScheduleBlock } from './types'
import { WEEK_DAYS, hoursRange, totalGridHeight, timeToMinutes, HOUR_HEIGHT_PX } from './utils'
import { TimeBlock } from './TimeBlock'

function assignColumns(blocks: ScheduleBlock[]): Map<number, { columnIndex: number; columnCount: number }> {
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
}

export function CalendarGrid({ blocks, annex, weekDays }: Props) {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('pl') ? 'pl-PL' : 'en-GB'

  const openingHour = Math.floor(timeToMinutes(annex.openingTime) / 60)
  const hours = hoursRange(annex.openingTime, annex.closingTime)
  const gridHeight = totalGridHeight(annex.openingTime, annex.closingTime)

  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <div className="min-w-[560px]">
        {/* Sticky day header */}
        <div className="sticky top-0 z-10 flex bg-background border-b border-border">
          <div className="w-12 shrink-0" />
          {WEEK_DAYS.map((day, i) => (
            <div key={day} className="flex-1 border-l border-border px-2 py-2 text-center">
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
            {hours.map(h => (
              <div
                key={h}
                className="absolute right-2 text-xs text-muted-foreground select-none"
                style={{ top: (h - openingHour) * HOUR_HEIGHT_PX }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {WEEK_DAYS.map(day => {
            const dayBlocks = blocks.filter(b => b.dayOfWeek === day)
            const columns = assignColumns(dayBlocks)
            return (
              <div key={day} className="flex-1 relative border-l border-border">
                {/* Hour lines */}
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-border/60"
                    style={{ top: (h - openingHour) * HOUR_HEIGHT_PX }}
                  />
                ))}

                {/* Blocks */}
                {dayBlocks.map(block => {
                  const { columnIndex, columnCount } = columns.get(block.id)!
                  return (
                    <TimeBlock
                      key={block.id}
                      block={block}
                      openingTime={annex.openingTime}
                      columnIndex={columnIndex}
                      columnCount={columnCount}
                    />
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
