import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AnnexDto } from '@/components/schedule/types';
import { useGetViolationsQuery } from '@/store/violationsApi';
import type { ViolationDto } from '@/types';

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

function ViolationRow({ v }: { v: ViolationDto }) {
  const { t } = useTranslation();
  const isError = v.severity === 'ERROR';
  const message = t(
    `violations.messages.${v.violationType}` as Parameters<typeof t>[0],
    {
      name: v.teacherName ?? v.groupName ?? '',
      actual: v.actualValue,
      rule: v.ruleValue,
      date: v.date ?? '',
      startTime: v.startTime ? v.startTime.substring(0, 5) : '',
      endTime: v.endTime ? v.endTime.substring(0, 5) : '',
    },
  );
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-4">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
            isError
              ? 'bg-destructive/10 text-destructive'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isError ? 'ERROR' : 'WARNING'}
        </span>
      </td>
      <td className="py-2 pr-4 text-sm">
        {v.teacherName ?? v.groupName ?? '—'}
      </td>
      <td className="py-2 pr-4 text-sm text-muted-foreground">
        {v.date ?? '—'}
      </td>
      <td className="py-2 text-sm">{message}</td>
    </tr>
  );
}

function ViolationTable({ violations }: { violations: ViolationDto[] }) {
  const { t } = useTranslation();
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="pb-2 pr-4 font-medium">{t('violations.severity')}</th>
          <th className="pb-2 pr-4 font-medium">{t('violations.entity')}</th>
          <th className="pb-2 pr-4 font-medium">{t('violations.date')}</th>
          <th className="pb-2 font-medium">{t('violations.description')}</th>
        </tr>
      </thead>
      <tbody>
        {violations.map((v, i) => (
          <ViolationRow key={i} v={v} />
        ))}
      </tbody>
    </table>
  );
}

export function AnnexViolationsPage() {
  const { t } = useTranslation();
  const annex = useOutletContext<AnnexDto>();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: violations = [], isLoading } = useGetViolationsQuery({
    annexId: annex.id!,
    year,
    month,
  });

  const errors = violations.filter((v) => v.severity === 'ERROR');
  const warnings = violations.filter((v) => v.severity === 'WARNING');
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t('violations.year')}
          </label>
          <input
            type="number"
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-ring"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t('violations.month')}
          </label>
          <select
            className={selectClass}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {t(`violations.months.${m}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      )}

      {!isLoading && (
        <>
          {violations.length === 0 ? (
            <div className="rounded-lg border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('violations.noViolations')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {errors.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-destructive mb-2">
                    {t('violations.errors')} ({errors.length})
                  </h2>
                  <ViolationTable violations={errors} />
                </div>
              )}
              {warnings.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-amber-600 mb-2">
                    {t('violations.warnings')} ({warnings.length})
                  </h2>
                  <ViolationTable violations={warnings} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
