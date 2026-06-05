import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Users,
  Scale,
  CalendarDays,
} from 'lucide-react';
import { useGetAnnexesQuery } from '@/store/annexesApi';
import { cn } from '@/lib/utils';


const tabs = [
  { labelKey: 'nav.items.draftAnnexPlanTable', to: 'plan/table', icon: CalendarDays },
  { labelKey: 'nav.items.draftAnnexPlanGroups', to: 'plan/groups', icon: CalendarDays },
  { labelKey: 'nav.items.draftAnnexPlanTeachers', to: 'plan/teachers', icon: CalendarDays },
  { labelKey: 'nav.items.draftAnnexPlanOverview', to: 'plan/overview', icon: CalendarDays },
  { labelKey: 'nav.items.draftAnnexSettings', to: 'settings', icon: Settings },
  { labelKey: 'nav.items.draftAnnexStaff', to: 'staff', icon: Users },
  { labelKey: 'nav.items.draftAnnexRules', to: 'rules', icon: Scale },
];

export function AnnexLayout() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: annexes = [], isLoading } = useGetAnnexesQuery();

  if (isLoading)
    return (
      <p className="p-6 text-sm text-muted-foreground">{t('common.loading')}</p>
    );

  const annex = annexes.find((a) => a.id === Number(id));

  if (!annex)
    return (
      <p className="p-6 text-sm text-muted-foreground">{t('common.noItems')}</p>
    );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="border-b border-border px-6 pt-3 pb-0 flex flex-col gap-2">
        {annex.state === 'CURRENT' && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">
            {t('pages.annex.currentWarning')}
          </div>
        )}
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )
              }
            >
              <tab.icon className="h-3.5 w-3.5 shrink-0" />
              <span>{t(tab.labelKey as Parameters<typeof t>[0])}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Outlet context={annex} />
      </div>
    </div>
  );
}
