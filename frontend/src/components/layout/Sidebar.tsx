import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Users,

  Building2,
  Scale,

  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Languages,
  Settings,
  CalendarX2,
  Globe,
  AlertTriangle,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetAnnexesQuery } from '@/store/annexesApi';
import { useNavigationMode, type NavigationMode } from '@/context/NavigationModeContext';

interface NavItem {
  labelKey: string;
  to: string;
  icon: React.ElementType;
}

const scheduleItems: NavItem[] = [
  {
    labelKey: 'nav.items.groupSchedule',
    to: '/schedule/groups',
    icon: CalendarDays,
  },
  {
    labelKey: 'nav.items.teacherSchedule',
    to: '/schedule/teachers',
    icon: CalendarDays,
  },
  {
    labelKey: 'nav.items.scheduleExceptions',
    to: '/schedule/exceptions',
    icon: CalendarX2,
  },
  { labelKey: 'nav.items.violations', to: '/violations', icon: AlertTriangle },
];

const managementItems: NavItem[] = [
  { labelKey: 'nav.items.annexes', to: '/annexes', icon: Building2 },
  { labelKey: 'nav.items.teachers', to: '/teachers', icon: Users },
  { labelKey: 'nav.items.groups', to: '/groups', icon: LayoutGrid },
  { labelKey: 'nav.items.globalRules', to: '/global-rules', icon: Globe },
];

function SidebarSection({
  title,
  items,
  sidebarCollapsed,
  defaultOpen = true,
}: {
  title: string;
  items: NavItem[];
  sidebarCollapsed: boolean;
  defaultOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-0.5">
      {!sidebarCollapsed ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
        >
          {title}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
              !open && '-rotate-90'
            )}
          />
        </button>
      ) : (
        <div className="mx-3 my-1 border-t border-border" />
      )}
      {(open || sidebarCollapsed) &&
        items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={
              sidebarCollapsed
                ? t(item.labelKey as Parameters<typeof t>[0])
                : undefined
            }
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground/70',
                sidebarCollapsed && 'justify-center px-2'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && (
              <span>{t(item.labelKey as Parameters<typeof t>[0])}</span>
            )}
          </NavLink>
        ))}
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { t, i18n } = useTranslation();
  const { mode, setMode } = useNavigationMode();

  const modeTabs: { id: NavigationMode; labelKey: string; icon: React.ElementType }[] = [
    { id: 'current-work', labelKey: 'topbar.currentWork', icon: CalendarDays },
    { id: 'management', labelKey: 'topbar.management', icon: Settings2 },
  ];
  const { data: annexes = [] } = useGetAnnexesQuery();
  const draft = annexes.find((a) => a.state === 'DRAFT');
  const current = annexes.find((a) => a.state === 'CURRENT');
  const base = draft ? `/annexes/${draft.id}` : '/annexes';
  const currentBase = current ? `/annexes/${current.id}` : '/annexes';
  const draftAnnexItems: NavItem[] = draft
    ? [
        { labelKey: 'nav.items.draftAnnexPlanTable', to: `${base}/plan/table`, icon: CalendarDays},
        { labelKey: 'nav.items.draftAnnexPlanGroups', to: `${base}/plan/groups`, icon: CalendarDays },
        { labelKey: 'nav.items.draftAnnexPlanTeachers', to: `${base}/plan/teachers`, icon: CalendarDays },
        { labelKey: 'nav.items.draftAnnexPlanOverview', to: `${base}/plan/overview`, icon: CalendarDays},
        { labelKey: 'nav.items.draftAnnexSettings', to: `${base}/settings`, icon: Settings },
        { labelKey: 'nav.items.draftAnnexStaff', to: `${base}/staff`, icon: Users },
        { labelKey: 'nav.items.draftAnnexRules', to: `${base}/rules`, icon: Scale },
      ]
    : [{ labelKey: 'nav.items.annexes', to: '/annexes', icon: Building2 }];

  const currentAnnexItems: NavItem[] = current
    ? [
        { labelKey: 'nav.items.draftAnnexPlanTable', to: `${currentBase}/plan/table`, icon: CalendarDays},
        { labelKey: 'nav.items.draftAnnexPlanGroups', to: `${currentBase}/plan/groups`, icon: CalendarDays },
        { labelKey: 'nav.items.draftAnnexPlanTeachers', to: `${currentBase}/plan/teachers`, icon: CalendarDays },
        { labelKey: 'nav.items.draftAnnexPlanOverview', to: `${currentBase}/plan/overview`, icon: CalendarDays},
        { labelKey: 'nav.items.draftAnnexSettings', to: `${currentBase}/settings`, icon: Settings },
        { labelKey: 'nav.items.draftAnnexStaff', to: `${currentBase}/staff`, icon: Users },
        { labelKey: 'nav.items.draftAnnexRules', to: `${currentBase}/rules`, icon: Scale },
      ]
    : [];

  const otherLang = i18n.language.startsWith('pl') ? 'en' : 'pl';

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-card transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-border px-3',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">{t('app.name')}</span>
          </div>
        )}
        {collapsed && <CalendarDays className="h-5 w-5 text-primary" />}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            'rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            collapsed && 'mt-0'
          )}
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Mode toggle */}
      <div className={cn('border-b border-border p-2', collapsed && 'px-1')}>
        {collapsed ? (
          <div className="flex flex-col gap-1">
            {modeTabs.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                title={t(`topbar.${id === 'current-work' ? 'currentWork' : 'management'}` as Parameters<typeof t>[0])}
                className={cn(
                  'flex w-full items-center justify-center rounded-md p-2 transition-colors',
                  mode === id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex rounded-lg bg-muted p-0.5 gap-0.5">
            {modeTabs.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all',
                  mode === id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {t(labelKey as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2 py-3">
        {mode === 'current-work' && (
          <>
            {current && (
              <SidebarSection
                title={t('nav.sections.currentAnnex')}
                items={currentAnnexItems}
                sidebarCollapsed={collapsed}
              />
            )}
            <SidebarSection
              title={t('nav.sections.schedule')}
              items={scheduleItems}
              sidebarCollapsed={collapsed}
            />
          </>
        )}
        {mode === 'management' && (
          <>
            <SidebarSection
              title={t('nav.sections.draftAnnex')}
              items={draftAnnexItems}
              sidebarCollapsed={collapsed}
            />
            <SidebarSection
              title={t('nav.sections.management')}
              items={managementItems}
              sidebarCollapsed={collapsed}
            />
          </>
        )}
      </nav>

      {/* Language switcher */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => i18n.changeLanguage(otherLang)}
          title={collapsed ? otherLang.toUpperCase() : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
        >
          <Languages className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{otherLang.toUpperCase()}</span>}
        </button>
      </div>
    </aside>
  );
}
