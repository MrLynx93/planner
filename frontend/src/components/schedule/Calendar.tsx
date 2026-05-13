import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CalendarGrid } from './CalendarGrid';
import { MonthCalendarGrid } from './MonthCalendarGrid';
import { getWeekDays, getWeekStart, addWeeks, addMonths } from './utils';
import type {
  AnnexDto,
  ExceptionReason,
  RemovedExceptionBlock,
  ScheduleBlock,
} from './types';

interface Props {
  viewMode: 'week' | 'month';
  onViewModeChange: (mode: 'week' | 'month') => void;
  weekStart: Date;
  onWeekChange: (d: Date) => void;
  monthDate: Date;
  onMonthChange: (d: Date) => void;

  blocks: ScheduleBlock[];
  annex: AnnexDto;
  colorBy?: 'teacher' | 'group';
  onBlockContextMenu?: (block: ScheduleBlock) => void;
  showExceptions?: boolean;
  exceptionReasonByTimeBlockId?: Map<number, ExceptionReason>;
  removedExceptions?: RemovedExceptionBlock[];

  monthBlocksByDate: Map<string, ScheduleBlock[]>;
}

const iconBtnClass =
  'rounded-md p-1.5 hover:bg-accent transition-colors text-foreground/70 hover:text-foreground';

export function Calendar({
  viewMode,
  onViewModeChange,
  weekStart,
  onWeekChange,
  monthDate,
  onMonthChange,
  blocks,
  annex,
  colorBy,
  onBlockContextMenu,
  showExceptions,
  exceptionReasonByTimeBlockId,
  removedExceptions,
  monthBlocksByDate,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('pl') ? 'pl-PL' : 'en-GB';

  const weekDays = getWeekDays(weekStart);
  const shortFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  const yearFmt = new Intl.DateTimeFormat(locale, { year: 'numeric' });
  const weekLabel = `${shortFmt.format(weekDays[0])} – ${shortFmt.format(weekDays[4])} ${yearFmt.format(weekDays[4])}`;

  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const monthLabel = monthFmt.format(monthDate);

  const handleToday = () => {
    const today = new Date();
    onWeekChange(getWeekStart(today));
    onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Navigation — centered, no border */}
      <div className="flex justify-center items-center gap-4 pt-3 pb-1 shrink-0">
        {/* View toggle */}
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

        {/* Date navigation */}
        <div className="flex items-center gap-1">
          <button
            className={iconBtnClass}
            onClick={() =>
              viewMode === 'week'
                ? onWeekChange(addWeeks(weekStart, -1))
                : onMonthChange(addMonths(monthDate, -1))
            }
            aria-label={viewMode === 'week' ? t('schedule.prevWeek') : t('schedule.prevMonth')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[200px] text-center text-sm font-medium">
            {viewMode === 'week' ? weekLabel : <span className="capitalize">{monthLabel}</span>}
          </span>
          <button
            className={iconBtnClass}
            onClick={() =>
              viewMode === 'week'
                ? onWeekChange(addWeeks(weekStart, 1))
                : onMonthChange(addMonths(monthDate, 1))
            }
            aria-label={viewMode === 'week' ? t('schedule.nextWeek') : t('schedule.nextMonth')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Today */}
        <button
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          onClick={handleToday}
        >
          {t('schedule.today')}
        </button>
      </div>

      {/* Grid */}
      {viewMode === 'week' ? (
        <CalendarGrid
          blocks={blocks}
          annex={annex}
          weekDays={weekDays}
          colorBy={colorBy}
          onBlockContextMenu={onBlockContextMenu}
          showExceptions={showExceptions}
          exceptionReasonByTimeBlockId={exceptionReasonByTimeBlockId}
          removedExceptions={removedExceptions}
        />
      ) : (
        <MonthCalendarGrid
          blocksByDate={monthBlocksByDate}
          monthDate={monthDate}
          colorBy={colorBy}
        />
      )}
    </div>
  );
}
