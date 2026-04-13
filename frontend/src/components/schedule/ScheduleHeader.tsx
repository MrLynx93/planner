import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getWeekDays, addWeeks, getWeekStart, addMonths } from './utils';

interface Props {
  currentAnnexName: string | null;

  filterItems: { id: number; label: string }[];
  selectedFilterId: number | null;
  onFilterChange: (id: number | null) => void;
  filterPlaceholder: string;

  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;

  weekStart: Date;
  onWeekChange: (weekStart: Date) => void;

  monthDate: Date;
  onMonthChange: (d: Date) => void;

  showExceptions?: boolean;
  onShowExceptionsChange?: (v: boolean) => void;
}

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

const iconBtnClass =
  'rounded-md border border-border p-1.5 hover:bg-accent transition-colors disabled:opacity-40';

export function ScheduleHeader({
  currentAnnexName,
  filterItems,
  selectedFilterId,
  onFilterChange,
  filterPlaceholder,
  viewMode,
  onViewModeChange,
  weekStart,
  onWeekChange,
  monthDate,
  onMonthChange,
  showExceptions,
  onShowExceptionsChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('pl') ? 'pl-PL' : 'en-GB';

  // Week label
  const weekDays = getWeekDays(weekStart);
  const shortFmt = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  });
  const yearFmt = new Intl.DateTimeFormat(locale, { year: 'numeric' });
  const weekLabel = `${shortFmt.format(weekDays[0])} – ${shortFmt.format(weekDays[4])} ${yearFmt.format(weekDays[4])}`;

  // Month label
  const monthFmt = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  });
  const monthLabel = monthFmt.format(monthDate);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3 shrink-0">
      {/* Annex label */}
      {currentAnnexName && (
        <span className="text-sm font-medium text-foreground/80 px-1">
          {currentAnnexName}
        </span>
      )}

      <select
        className={selectClass}
        value={selectedFilterId ?? ''}
        onChange={(e) =>
          onFilterChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">{filterPlaceholder}</option>
        {filterItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>

      {/* Exceptions toggle */}
      {onShowExceptionsChange && (
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <button
            role="switch"
            aria-checked={showExceptions}
            type="button"
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${showExceptions ? 'bg-primary' : 'bg-border'}`}
            onClick={() => onShowExceptionsChange(!showExceptions)}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${showExceptions ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
            />
          </button>
          {t('schedule.showExceptions')}
        </label>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* View mode toggle */}
      <div className="flex rounded-md border border-border overflow-hidden text-sm">
        <button
          className={`px-3 py-1.5 transition-colors ${viewMode === 'week' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          onClick={() => onViewModeChange('week')}
        >
          {t('schedule.viewWeek')}
        </button>
        <button
          className={`px-3 py-1.5 border-l border-border transition-colors ${viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          onClick={() => onViewModeChange('month')}
        >
          {t('schedule.viewMonth')}
        </button>
      </div>

      {/* Navigation */}
      {viewMode === 'week' ? (
        <div className="flex items-center gap-2">
          <button
            className={iconBtnClass}
            onClick={() => onWeekChange(addWeeks(weekStart, -1))}
            aria-label={t('schedule.prevWeek')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[200px] text-center text-sm font-medium">
            {weekLabel}
          </span>

          <button
            className={iconBtnClass}
            onClick={() => onWeekChange(addWeeks(weekStart, 1))}
            aria-label={t('schedule.nextWeek')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            className={iconBtnClass}
            onClick={() => onMonthChange(addMonths(monthDate, -1))}
            aria-label={t('schedule.prevMonth')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[160px] text-center text-sm font-medium capitalize">
            {monthLabel}
          </span>

          <button
            className={iconBtnClass}
            onClick={() => onMonthChange(addMonths(monthDate, 1))}
            aria-label={t('schedule.nextMonth')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
        onClick={() => {
          const today = new Date();
          onWeekChange(getWeekStart(today));
          onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
        }}
      >
        {t('schedule.today')}
      </button>
    </div>
  );
}
