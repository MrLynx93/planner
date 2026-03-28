import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGetAnnexesQuery, useUpdateAnnexMutation } from '@/store/annexesApi'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

function toTimeInput(time: string): string {
  return time ? time.substring(0, 5) : ''
}
function fromTimeInput(time: string): string {
  return time ? `${time}:00` : ''
}

export function DraftAnnexSettingsPage() {
  const { t } = useTranslation()
  const { data: annexes = [], isLoading } = useGetAnnexesQuery()
  const [updateAnnex] = useUpdateAnnexMutation()

  const draft = annexes.find(a => a.state === 'DRAFT')

  const [name, setName] = useState('')
  const [scheduleStartTime, setScheduleStartTime] = useState('')
  const [scheduleEndTime, setScheduleEndTime] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (draft) {
      setName(draft.name)
      setScheduleStartTime(toTimeInput(draft.scheduleStartTime))
      setScheduleEndTime(toTimeInput(draft.scheduleEndTime))
    }
  }, [draft?.id])

  async function handleSave() {
    if (!draft || !name.trim() || !scheduleStartTime || !scheduleEndTime) return
    await updateAnnex({
      ...draft,
      name: name.trim(),
      scheduleStartTime: fromTimeInput(scheduleStartTime),
      scheduleEndTime: fromTimeInput(scheduleEndTime),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">{t('common.loading')}</p>
  if (!draft) return <p className="p-6 text-sm text-muted-foreground">{t('pages.draftAnnex.noDraftAnnex')}</p>

  return (
    <div className="flex flex-col gap-6 p-6 max-w-md">
      <h1 className="text-xl font-semibold">{t('pages.draftAnnex.settings.title')}</h1>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t('common.name')}</label>
          <input
            className={`${inputClass} w-full`}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t('pages.annexes.scheduleStartTime')}
            </label>
            <input
              type="time"
              className={`${inputClass} w-full`}
              value={scheduleStartTime}
              onChange={e => setScheduleStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t('pages.annexes.scheduleEndTime')}
            </label>
            <input
              type="time"
              className={`${inputClass} w-full`}
              value={scheduleEndTime}
              onChange={e => setScheduleEndTime(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={handleSave}
          >
            {t('common.save')}
          </button>
          {saved && <span className="text-xs text-muted-foreground">{t('common.saved')}</span>}
        </div>
      </div>
    </div>
  )
}
