import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import type { AnnexDto } from '@/components/schedule/types';
import { useUpdateAnnexMutation } from '@/store/annexesApi';

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export function AnnexSettingsPage() {
  const { t } = useTranslation();
  const annex = useOutletContext<AnnexDto>();
  const [updateAnnex] = useUpdateAnnexMutation();

  const isReadOnly = annex.state === 'FINISHED';

  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(annex.name);
  }, [annex.id]);

  async function handleSave() {
    if (!name.trim()) return;
    await updateAnnex({ ...annex, name: name.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-md">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t('common.name')}
          </label>
          <input
            className={`${inputClass} w-full`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => !isReadOnly && e.key === 'Enter' && handleSave()}
            disabled={isReadOnly}
          />
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <button
              className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
              onClick={handleSave}
            >
              {t('common.save')}
            </button>
            {saved && (
              <span className="text-xs text-muted-foreground">
                {t('common.saved')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
