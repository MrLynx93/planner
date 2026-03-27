import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useGetClosedDaysQuery,
  useCreateClosedDayMutation,
  useDeleteClosedDayMutation,
} from '@/store/closedDaysApi'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function ClosedDaysPage() {
  const { t } = useTranslation()

  const [adding, setAdding] = useState(false)
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')

  const { data: closedDays = [], isLoading } = useGetClosedDaysQuery()
  const [createClosedDay] = useCreateClosedDayMutation()
  const [deleteClosedDay] = useDeleteClosedDayMutation()

  async function handleSave() {
    if (!date) return
    await createClosedDay({ id: null, date, reason: reason.trim() })
    setAdding(false)
    setDate('')
    setReason('')
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await deleteClosedDay(id)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('pages.closedDays.title')}</h1>
        {!adding && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={() => setAdding(true)}
          >
            {t('pages.closedDays.add')}
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">{t('pages.closedDays.add')}</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={e => setDate(e.target.value)}
              autoFocus
            />
            <input
              className={inputClass}
              placeholder={t('pages.closedDays.reason')}
              value={reason}
              onChange={e => setReason(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
              onClick={handleSave}
            >
              {t('common.save')}
            </button>
            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              onClick={() => setAdding(false)}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : closedDays.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">{t('pages.closedDays.date')}</th>
              <th className="pb-2 pr-4 font-medium">{t('pages.closedDays.reason')}</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {[...closedDays]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(day => (
                <tr key={day.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4">{day.date}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{day.reason || '—'}</td>
                  <td className="py-2">
                    <div className="flex justify-end">
                      <button
                        className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDelete(day.id!)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
