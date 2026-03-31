import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings, Users, LayoutGrid, Baby, Scale, CalendarDays } from 'lucide-react'
import { useGetAnnexesQuery } from '@/store/annexesApi'
import type { AnnexDto } from '@/components/schedule/types'
import { cn } from '@/lib/utils'

function stateBadgeClass(state: AnnexDto['state']) {
  if (state === 'CURRENT') return 'bg-green-100 text-green-800'
  if (state === 'FINISHED') return 'bg-gray-100 text-gray-600'
  return 'bg-yellow-100 text-yellow-800'
}

const tabs = [
  { labelKey: 'nav.items.draftAnnexSettings', to: 'settings', icon: Settings },
  { labelKey: 'nav.items.draftAnnexTeachers', to: 'teachers', icon: Users },
  { labelKey: 'nav.items.draftAnnexGroups', to: 'groups', icon: LayoutGrid },
  { labelKey: 'nav.items.draftAnnexChildren', to: 'children', icon: Baby },
  { labelKey: 'nav.items.draftAnnexRules', to: 'rules', icon: Scale },
  { labelKey: 'nav.items.draftAnnexPlanGroups', to: 'plan/groups', icon: CalendarDays },
  { labelKey: 'nav.items.draftAnnexPlanTeachers', to: 'plan/teachers', icon: CalendarDays },
  { labelKey: 'nav.items.draftAnnexPlanOverview', to: 'plan/overview', icon: LayoutGrid },
]

export function AnnexLayout() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: annexes = [], isLoading } = useGetAnnexesQuery()

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">{t('common.loading')}</p>

  const annex = annexes.find(a => a.id === Number(id))

  if (!annex) return <p className="p-6 text-sm text-muted-foreground">{t('common.noItems')}</p>

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="border-b border-border px-6 pt-5 pb-0 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{annex.name}</h1>
          <span className={cn('rounded px-2 py-0.5 text-xs font-medium', stateBadgeClass(annex.state))}>
            {t(`pages.annexes.states.${annex.state}`)}
          </span>
        </div>
        {annex.state === 'CURRENT' && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">
            {t('pages.annex.currentWarning')}
          </div>
        )}
        <nav className="flex gap-0 -mb-px">
          {tabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )
              }
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span>{t(tab.labelKey as Parameters<typeof t>[0])}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Outlet context={annex} />
      </div>
    </div>
  )
}
