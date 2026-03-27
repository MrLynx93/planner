import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AnnexDto } from './types'
import { getWeekDays, addWeeks, getWeekStart } from './utils'

interface Props {
  annexes: AnnexDto[]
  selectedAnnexId: number | null
  onAnnexChange: (id: number | null) => void

  filterItems: { id: number; label: string }[]
  selectedFilterId: number | null
  onFilterChange: (id: number | null) => void
  filterPlaceholder: string

  weekStart: Date
  onWeekChange: (weekStart: Date) => void
}

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const iconBtnClass =
  'rounded-md border border-border p-1.5 hover:bg-accent transition-colors disabled:opacity-40'

export function ScheduleHeader({
  annexes,
  selectedAnnexId,
  onAnnexChange,
  filterItems,
  selectedFilterId,
  onFilterChange,
  filterPlaceholder,
  weekStart,
  onWeekChange,
}: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('pl') ? 'pl-PL' : 'en-GB'

  const weekDays = getWeekDays(weekStart)
  const shortFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const yearFmt = new Intl.DateTimeFormat(locale, { year: 'numeric' })
  const weekLabel = `${shortFmt.format(weekDays[0])} – ${shortFmt.format(weekDays[4])} ${yearFmt.format(weekDays[4])}`

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3 shrink-0">
      {/* Selectors */}
      <select
        className={selectClass}
        value={selectedAnnexId ?? ''}
        onChange={e => onAnnexChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{t('schedule.selectAnnex')}</option>
        {annexes.map(a => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={selectedFilterId ?? ''}
        onChange={e => onFilterChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{filterPlaceholder}</option>
        {filterItems.map(item => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <button
          className={iconBtnClass}
          onClick={() => onWeekChange(addWeeks(weekStart, -1))}
          aria-label={t('schedule.prevWeek')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="min-w-[200px] text-center text-sm font-medium">{weekLabel}</span>

        <button
          className={iconBtnClass}
          onClick={() => onWeekChange(addWeeks(weekStart, 1))}
          aria-label={t('schedule.nextWeek')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <button
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
        onClick={() => onWeekChange(getWeekStart(new Date()))}
      >
        {t('schedule.today')}
      </button>
    </div>
  )
}
