import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import type { AnnexDto } from '@/components/schedule/types';
import { useUpdateAnnexMutation } from '@/store/annexesApi';

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

function toTimeInput(time: string): string {
  return time ? time.substring(0, 5) : '';
}

function fromTimeInput(time: string): string {
  return time ? `${time}:00` : '';
}

export function AnnexSettingsPage() {
  const { t } = useTranslation();
  const annex = useOutletContext<AnnexDto>();
  const [updateAnnex] = useUpdateAnnexMutation();

  const isReadOnly = annex.state === 'FINISHED';

  const [name, setName] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(annex.name);
    setScheduleStartTime(toTimeInput(annex.scheduleStartTime));
    setScheduleEndTime(toTimeInput(annex.scheduleEndTime));
  }, [annex.id]);

  async function handleSave() {
    if (!name.trim() || !scheduleStartTime || !scheduleEndTime) return;
    await updateAnnex({
      ...annex,
      name: name.trim(),
      scheduleStartTime: fromTimeInput(scheduleStartTime),
      scheduleEndTime: fromTimeInput(scheduleEndTime),
    });
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
            disabled={isReadOnly}
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
              onChange={(e) => setScheduleStartTime(e.target.value)}
              disabled={isReadOnly}
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
              onChange={(e) => setScheduleEndTime(e.target.value)}
              disabled={isReadOnly}
            />
          </div>
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
