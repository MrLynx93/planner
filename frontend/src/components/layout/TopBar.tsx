import { useTranslation } from 'react-i18next';
import { CalendarDays, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useNavigationMode,
  type NavigationMode,
} from '@/context/NavigationModeContext';

export function TopBar() {
  const { t } = useTranslation();
  const { mode, setMode } = useNavigationMode();

  const tabs: { id: NavigationMode; labelKey: string; icon: React.ElementType }[] = [
    { id: 'current-work', labelKey: 'topbar.currentWork', icon: CalendarDays },
    { id: 'management', labelKey: 'topbar.management', icon: Settings2 },
  ];

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border bg-card px-4 gap-1">
      {tabs.map(({ id, labelKey, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setMode(id)}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            mode === id
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground/60 hover:bg-accent hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {t(labelKey as Parameters<typeof t>[0])}
        </button>
      ))}
    </header>
  );
}
