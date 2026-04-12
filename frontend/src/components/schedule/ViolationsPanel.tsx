import { useTranslation } from 'react-i18next';
import { useGetViolationsQuery } from '@/store/violationsApi';
import type { ViolationDto } from '@/types';

interface Props {
  annexId: number;
  weekStart: Date;
}

function useViolationMessage(v: ViolationDto): string {
  const { t } = useTranslation();
  return t(`violations.messages.${v.violationType}`, {
    name: v.teacherName ?? v.groupName ?? '',
    actual: v.actualValue,
    rule: v.ruleValue,
    date: v.date ?? '',
  });
}

function ViolationRow({ v }: { v: ViolationDto }) {
  const isError = v.severity === 'ERROR';
  const message = useViolationMessage(v);
  return (
    <div
      className={`flex items-start gap-2 py-1.5 border-b border-border last:border-0`}
    >
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

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 4);

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
    (v) => v.date !== null && weekDates.has(v.date)
  );
  const monthViolations = violations.filter((v) => v.date === null);

  if (isLoading) return null;

  if (violations.length === 0) {
    return (
      <div className="w-64 shrink-0 flex flex-col gap-3 p-3 border-l border-border overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('violations.title')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('violations.noViolations')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0 flex flex-col gap-4 p-3 border-l border-border overflow-y-auto">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('violations.title')}
      </h3>

      {weekViolations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('violations.thisWeek')}
          </p>
          <div>
            {weekViolations.map((v, i) => (
              <ViolationRow key={i} v={v} />
            ))}
          </div>
        </div>
      )}

      {monthViolations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('violations.thisMonth')}
          </p>
          <div>
            {monthViolations.map((v, i) => (
              <ViolationRow key={i} v={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
