import { useTranslation } from 'react-i18next'

export function ClosedDaysPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">{t('pages.closedDays.title')}</h1>
      <p className="text-muted-foreground">{t('common.comingSoon')}</p>
    </div>
  )
}
