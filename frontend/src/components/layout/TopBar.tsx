import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, CalendarDays } from 'lucide-react';
import { useGetAnnexesQuery } from '@/store/annexesApi';

interface Crumb {
  label: string;
  to?: string;
  tag?: { label: string; className: string };
}

const STATIC_ROUTES: Record<string, string> = {
  '/schedule/groups': 'pages.groupSchedule.title',
  '/schedule/teachers': 'pages.teacherSchedule.title',
  '/schedule/exceptions': 'pages.scheduleExceptions.title',
  '/violations': 'violations.title',
  '/annexes': 'pages.annexes.title',
  '/teachers': 'pages.teachers.title',
  '/groups': 'pages.groups.title',
  '/children': 'pages.children.title',
  '/rules': 'pages.rules.title',
  '/global-rules': 'pages.globalRules.title',
  '/closed-days': 'pages.closedDays.title',
};

const ANNEX_SUB_LABELS: Record<string, string> = {
  '/settings': 'pages.draftAnnex.settings.title',
  '/teachers': 'pages.draftAnnex.teachers.title',
  '/groups': 'pages.draftAnnex.groups.title',
  '/children': 'pages.draftAnnex.children.title',
  '/rules': 'pages.draftAnnex.rules.title',
  '/violations': 'violations.title',
  '/plan/groups': 'nav.items.draftAnnexPlanGroups',
  '/plan/teachers': 'nav.items.draftAnnexPlanTeachers',
  '/plan/overview': 'nav.items.draftAnnexPlanOverview',
};

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { data: annexes = [] } = useGetAnnexesQuery();

  const annexMatch = pathname.match(/^\/annexes\/(\d+)(\/.*)?$/);
  if (annexMatch) {
    const annexId = Number(annexMatch[1]);
    const subPath = annexMatch[2] ?? '';
    const annex = annexes.find((a) => a.id === annexId);
    const annexName = annex?.name ?? `#${annexId}`;
    const subLabelKey = ANNEX_SUB_LABELS[subPath];

    const stateTagClass = annex?.state === 'CURRENT'
      ? 'bg-green-100 text-green-800'
      : annex?.state === 'FINISHED'
        ? 'bg-gray-100 text-gray-600'
        : 'bg-yellow-100 text-yellow-800';

    return [
      { label: t('pages.annexes.title'), to: '/annexes' },
      {
        label: annexName,
        to: subLabelKey ? `/annexes/${annexId}/plan/table` : undefined,
        tag: annex ? { label: t(`pages.annexes.states.${annex.state}` as Parameters<typeof t>[0]), className: stateTagClass } : undefined,
      },
      ...(subLabelKey
        ? [{ label: t(subLabelKey as Parameters<typeof t>[0]) }]
        : []),
    ];
  }

  const labelKey = STATIC_ROUTES[pathname];
  if (labelKey) {
    return [{ label: t(labelKey as Parameters<typeof t>[0]) }];
  }

  return [];
}

export function TopBar() {
  const { t } = useTranslation();
  const crumbs = useBreadcrumbs();

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border bg-card px-4">
      <nav className="flex items-center gap-1 text-sm">
        {/* Logo crumb */}
        <Link
          to="/"
          className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors"
        >
          <CalendarDays className="h-4 w-4 text-primary shrink-0" />
          {t('app.name')}
        </Link>

        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                  {crumb.tag && (
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${crumb.tag.className}`}>
                      {crumb.tag.label}
                    </span>
                  )}
                </Link>
              ) : (
                <span className={`flex items-center gap-1.5 ${isLast ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {crumb.label}
                  {crumb.tag && (
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${crumb.tag.className}`}>
                      {crumb.tag.label}
                    </span>
                  )}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </header>
  );
}
