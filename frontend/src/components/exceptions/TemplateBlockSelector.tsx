import { useTranslation } from 'react-i18next'
import type { ScheduleBlock } from '@/components/schedule/types'
import { formatTime } from '@/components/schedule/utils'

export interface SelectableBlock {
  timeBlockId: number
  date: string       // "YYYY-MM-DD"
  groupId: number
  groupName: string
  startTime: string  // "HH:mm:ss"
  endTime: string
}

interface Props {
  /** All template blocks for the annex, pre-filtered by teacherId */
  blocks: ScheduleBlock[]
  /** ISO date strings (Mon–Fri only) to display blocks for */
  dates: string[]
  selected: SelectableBlock[]
  onToggle: (block: SelectableBlock) => void
}

function dayOfWeekFromDate(dateStr: string): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  return days[new Date(dateStr + 'T00:00:00').getDay()]
}

export function TemplateBlockSelector({ blocks, dates, selected, onToggle }: Props) {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('pl') ? 'pl-PL' : 'en-GB'
  const dateFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })

  const isSelected = (b: SelectableBlock) =>
    selected.some(s => s.timeBlockId === b.timeBlockId && s.date === b.date)

  return (
    <div className="flex flex-col gap-2">
      {dates.map(date => {
        const dow = dayOfWeekFromDate(date)
        const dayBlocks = blocks.filter(b => b.dayOfWeek === dow)

        if (dayBlocks.length === 0) return null

        return (
          <div key={date}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {dateFmt.format(new Date(date + 'T00:00:00'))}
            </div>
            <div className="flex flex-col gap-1">
              {dayBlocks.map(b => {
                const item: SelectableBlock = {
                  timeBlockId: b.timeBlockId,
                  date,
                  groupId: b.groupId,
                  groupName: b.groupName,
                  startTime: b.startTime,
                  endTime: b.endTime,
                }
                const checked = isSelected(item)
                return (
                  <label
                    key={`${b.timeBlockId}_${date}`}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(item)}
                      className="h-4 w-4"
                    />
                    <span className="font-medium">{b.groupName}</span>
                    <span className="text-muted-foreground">
                      {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
