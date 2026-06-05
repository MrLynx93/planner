import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

export function NoDraftPage() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800 inline-block">
        {t('pages.noDraft.message')}{' '}
        <NavLink to="/annexes" className="underline underline-offset-2 hover:text-yellow-900">
          {t('pages.noDraft.link')}
        </NavLink>
      </div>
    </div>
  );
}
