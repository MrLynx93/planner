import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Users,
  User,
  Building2,
  Baby,
  Scale,
  XCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Languages,
  Settings,
  CalendarRange,
  CalendarX2,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetAnnexesQuery } from '@/store/annexesApi';

interface NavItem {
  labelKey: string;
  to: string;
  icon: React.ElementType;
}

const scheduleItems: NavItem[] = [
  {
    labelKey: 'nav.items.groupSchedule',
    to: '/schedule/groups',
    icon: LayoutGrid,
  },
  {
    labelKey: 'nav.items.teacherSchedule',
    to: '/schedule/teachers',
    icon: User,
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
  { labelKey: 'nav.items.children', to: '/children', icon: Baby },
  { labelKey: 'nav.items.rules', to: '/rules', icon: Scale },
  { labelKey: 'nav.items.globalRules', to: '/global-rules', icon: Globe },
  { labelKey: 'nav.items.closedDays', to: '/closed-days', icon: XCircle },
];

function SidebarSection({
  title,
  items,
  collapsed,
}: {
  title: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-0.5">
      {!collapsed && (
        <span className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      )}
      {collapsed && <div className="mx-3 my-1 border-t border-border" />}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={
            collapsed ? t(item.labelKey as Parameters<typeof t>[0]) : undefined
          }
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground/70',
              collapsed && 'justify-center px-2'
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
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
  const { data: annexes = [] } = useGetAnnexesQuery();
  const draft = annexes.find((a) => a.state === 'DRAFT');
  const base = draft ? `/annexes/${draft.id}` : '/annexes';
  const draftAnnexItems: NavItem[] = draft
    ? [
        {
          labelKey: 'nav.items.draftAnnexSettings',
          to: `${base}/settings`,
          icon: Settings,
        },
        {
          labelKey: 'nav.items.draftAnnexTeachers',
          to: `${base}/teachers`,
          icon: Users,
        },
        {
          labelKey: 'nav.items.draftAnnexGroups',
          to: `${base}/groups`,
          icon: LayoutGrid,
        },
        {
          labelKey: 'nav.items.draftAnnexChildren',
          to: `${base}/children`,
          icon: Baby,
        },
        {
          labelKey: 'nav.items.draftAnnexRules',
          to: `${base}/rules`,
          icon: Scale,
        },
        {
          labelKey: 'nav.items.draftAnnexPlanGroups',
          to: `${base}/plan/groups`,
          icon: CalendarDays,
        },
        {
          labelKey: 'nav.items.draftAnnexPlanTeachers',
          to: `${base}/plan/teachers`,
          icon: CalendarDays,
        },
        {
          labelKey: 'nav.items.draftAnnexPlanOverview',
          to: `${base}/plan/overview`,
          icon: CalendarRange,
        },
      ]
    : [{ labelKey: 'nav.items.annexes', to: '/annexes', icon: Building2 }];

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

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2 py-3">
        <SidebarSection
          title={t('nav.sections.schedule')}
          items={scheduleItems}
          collapsed={collapsed}
        />
        <SidebarSection
          title={t('nav.sections.management')}
          items={managementItems}
          collapsed={collapsed}
        />
        <SidebarSection
          title={t('nav.sections.draftAnnex')}
          items={draftAnnexItems}
          collapsed={collapsed}
        />
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
