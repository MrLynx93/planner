import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetViolationsQuery } from '@/store/violationsApi';
import type { ViolationDto } from '@/types';

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

interface Props {
  annexId: number;
  weekStart: Date;
}

function ViolationRow({ v }: { v: ViolationDto }) {
  const { t } = useTranslation();
  const isError = v.severity === 'ERROR';
  const message = t(`violations.messages.${v.violationType}` as Parameters<typeof t>[0], {
    name: v.teacherName ?? v.groupName ?? '',
    actual: v.actualValue,
    rule: v.ruleValue,
    date: v.date ?? '',
    startTime: v.startTime ? v.startTime.substring(0, 5) : '',
    endTime: v.endTime ? v.endTime.substring(0, 5) : '',
  });
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
      <span
        className={`mt-0.5 shrink-0 text-sm font-bold ${isError ? 'text-destructive' : 'text-amber-500'}`}
      >
        {isError ? '✗' : '⚠'}
      </span>
      <p className="text-xs text-foreground leading-snug">{message}</p>
    </div>
  );
}

export function ViolationsPanel({ annexId, weekStart }: Props) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragStartWidth = useRef<number>(DEFAULT_WIDTH);

  const year = weekStart.getFullYear();
  const month = weekStart.getMonth() + 1;

  const { data: violations = [], isLoading } = useGetViolationsQuery({
    annexId,
    year,
    month,
  });

  const weekDates = new Set<string>();
  for (let i = 0; i <= 4; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDates.add(d.toISOString().slice(0, 10));
  }

  const weekViolations = violations.filter(
    (v) => v.date !== null && weekDates.has(v.date),
  );
  const monthViolations = violations.filter((v) => v.date === null);

  const onDragMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;

      const onMouseMove = (ev: MouseEvent) => {
        if (dragStartX.current === null) return;
        // Dragging left increases width (panel is on the right side)
        const delta = dragStartX.current - ev.clientX;
        const newWidth = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, dragStartWidth.current + delta),
        );
        setWidth(newWidth);
      };

      const onMouseUp = () => {
        dragStartX.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [width],
  );

  const errorCount = violations.filter((v) => v.severity === 'ERROR').length;
  const warnCount = violations.filter((v) => v.severity === 'WARNING').length;

  if (collapsed) {
    return (
      <div className="shrink-0 flex flex-col items-center border-l border-border bg-card">
        <button
          className="p-2 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(false)}
          title={t('violations.title')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {violations.length > 0 && (
          <div className="flex flex-col items-center gap-1 px-1 pt-1">
            {errorCount > 0 && (
              <span className="text-xs font-bold text-destructive">
                {errorCount}
              </span>
            )}
            {warnCount > 0 && (
              <span className="text-xs font-bold text-amber-500">
                {warnCount}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="shrink-0 flex flex-row border-l border-border"
      style={{ width }}
    >
      {/* Drag handle */}
      <div
        className="w-1 shrink-0 cursor-col-resize hover:bg-primary/30 transition-colors"
        onMouseDown={onDragMouseDown}
      />

      {/* Panel content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('violations.title')}
            {violations.length > 0 && (
              <span className="ml-1.5 text-foreground">
                ({violations.length})
              </span>
            )}
          </h3>
          <button
            className="p-0.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(true)}
            title={t('violations.collapse')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? null : violations.length === 0 ? (
          <p className="px-3 text-xs text-muted-foreground">
            {t('violations.noViolations')}
          </p>
        ) : (
          <div className="flex flex-col gap-4 px-3 pb-3">
            {weekViolations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('violations.thisWeek')}
                </p>
                {weekViolations.map((v, i) => (
                  <ViolationRow key={i} v={v} />
                ))}
              </div>
            )}
            {monthViolations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('violations.thisMonth')}
                </p>
                {monthViolations.map((v, i) => (
                  <ViolationRow key={i} v={v} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
