import { useTranslation } from 'react-i18next'
import type { ScheduleBlock } from './types'
import { getMonthWeeks, formatTime } from './utils'
import { getColorForId } from './colors'

interface Props {
  blocksByDate: Map<string, ScheduleBlock[]>
  monthDate: Date
  colorBy?: 'teacher' | 'group'
}

const MAX_VISIBLE_BLOCKS = 3

export function MonthCalendarGrid({ blocksByDate, monthDate, colorBy = 'teacher' }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('pl') ? 'pl-PL' : 'en-GB'

  const weekStarts = getMonthWeeks(monthDate)
  const currentMonth = monthDate.getMonth()
  const currentYear = monthDate.getFullYear()

  // Build column header names from the first week
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const columnHeaders = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStarts[0])
    d.setDate(d.getDate() + i)
    return dayFmt.format(d)
  })

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <div className="m-8 min-w-[560px] border border-gray-400 rounded">
        {/* Column headers */}
        <div className="grid grid-cols-5 border-b border-gray-400 bg-background sticky top-0 z-10">
          {columnHeaders.map((header, i) => (
            <div
              key={i}
              className={`px-2 py-2 text-xs font-medium text-center text-muted-foreground capitalize${i > 0 ? ' border-l border-gray-300' : ''}`}
            >
              {header}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weekStarts.map((ws, wi) => {
          const days = Array.from({ length: 5 }, (_, i) => {
            const d = new Date(ws)
            d.setDate(d.getDate() + i)
            return d
          })
          return (
            <div
              key={wi}
              className={`grid grid-cols-5${wi > 0 ? ' border-t border-gray-300' : ''}`}
            >
              {days.map((day, di) => {
                const dateStr = day.toISOString().slice(0, 10)
                const isOutsideMonth =
                  day.getMonth() !== currentMonth || day.getFullYear() !== currentYear
                const dayBlocks = blocksByDate.get(dateStr) ?? []
                const shown = dayBlocks.slice(0, MAX_VISIBLE_BLOCKS)
                const overflow = dayBlocks.length - shown.length

                return (
                  <div
                    key={di}
                    className={`min-h-[96px] p-1.5${di > 0 ? ' border-l border-gray-300' : ''}${isOutsideMonth ? ' bg-muted/30' : ''}`}
                  >
                    {/* Day number */}
                    <div
                      className={`text-xs font-medium mb-1 leading-none${isOutsideMonth ? ' text-muted-foreground/40' : ' text-foreground'}`}
                    >
                      {day.getDate()}
                    </div>

                    {/* Block pills */}
                    <div className="flex flex-col gap-0.5">
                      {shown.map(block => {
                        const color = getColorForId(
                          colorBy === 'group' ? block.groupId : block.teacherId,
                        )
                        const label =
                          colorBy === 'group'
                            ? block.groupName
                            : `${block.teacherFirstName} ${block.teacherLastName}`
                        const isModification = block.type === 'MODIFICATION'
                        const borderStyle = isModification
                          ? { border: `1px dashed ${color.border}` }
                          : { borderLeft: `2px solid ${color.border}` }
                        return (
                          <div
                            key={block.id}
                            className="rounded px-1 py-0.5 text-xs truncate leading-tight"
                            style={{
                              backgroundColor: color.bg,
                              color: color.text,
                              opacity: isOutsideMonth ? 0.4 : 1,
                              ...borderStyle,
                            }}
                            title={`${label} ${formatTime(block.startTime)}–${formatTime(block.endTime)}`}
                          >
                            {label}
                          </div>
                        )
                      })}
                      {overflow > 0 && (
                        <div className="text-xs text-muted-foreground px-1 leading-tight">
                          +{overflow} {t('schedule.more')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
