import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { AnnexDto } from '@/components/schedule/types';
import {
  useGetAnnexesQuery,
  useCreateAnnexMutation,
  useDeleteAnnexMutation,
  useActivateAnnexMutation,
} from '@/store/annexesApi';

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

function toTimeInput(time: string): string {
  return time ? time.substring(0, 5) : '';
}

function fromTimeInput(time: string): string {
  return time ? `${time}:00` : '';
}

const emptyForm = { name: '', scheduleStartTime: '', scheduleEndTime: '' };

export function AnnexesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: annexes = [], isLoading } = useGetAnnexesQuery();
  const [createAnnex] = useCreateAnnexMutation();
  const [deleteAnnex] = useDeleteAnnexMutation();
  const [activateAnnex] = useActivateAnnexMutation();

  function set(field: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openAdd() {
    setAdding(true);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.scheduleStartTime || !form.scheduleEndTime)
      return;
    await createAnnex({
      id: null,
      name: form.name.trim(),
      startDate: null,
      endDate: null,
      scheduleStartTime: fromTimeInput(form.scheduleStartTime),
      scheduleEndTime: fromTimeInput(form.scheduleEndTime),
      state: 'DRAFT',
    });
    setAdding(false);
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    await deleteAnnex(id);
  }

  async function handleActivate(annex: AnnexDto) {
    if (!window.confirm(t('pages.annexes.confirmActivate'))) return;
    await activateAnnex(annex.id!);
  }

  function stateBadgeClass(state: AnnexDto['state']) {
    if (state === 'CURRENT') return 'bg-green-100 text-green-800';
    if (state === 'FINISHED') return 'bg-gray-100 text-gray-600';
    return 'bg-yellow-100 text-yellow-800';
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('pages.annexes.title')}</h1>
        {!adding && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={openAdd}
          >
            {t('pages.annexes.add')}
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">{t('pages.annexes.add')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">
                {t('common.name')}
              </label>
              <input
                className={`${inputClass} w-full`}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t('pages.annexes.scheduleStartTime')}
              </label>
              <input
                type="time"
                className={`${inputClass} w-full`}
                value={form.scheduleStartTime}
                onChange={(e) => set('scheduleStartTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t('pages.annexes.scheduleEndTime')}
              </label>
              <input
                type="time"
                className={`${inputClass} w-full`}
                value={form.scheduleEndTime}
                onChange={(e) => set('scheduleEndTime', e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
              onClick={handleSave}
            >
              {t('common.save')}
            </button>
            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              onClick={() => setAdding(false)}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : annexes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">{t('common.name')}</th>
              <th className="pb-2 pr-4 font-medium">
                {t('pages.annexes.startDate')}
              </th>
              <th className="pb-2 pr-4 font-medium">
                {t('pages.annexes.endDate')}
              </th>
              <th className="pb-2 pr-4 font-medium">
                {t('pages.annexes.scheduleStartTime')}
              </th>
              <th className="pb-2 pr-4 font-medium">
                {t('pages.annexes.scheduleEndTime')}
              </th>
              <th className="pb-2 pr-4 font-medium">
                {t('pages.annexes.state')}
              </th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {annexes.map((annex) => (
              <React.Fragment key={annex.id}>
                <tr className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 font-medium">{annex.name}</td>
                  <td className="py-2 pr-4">{annex.startDate}</td>
                  <td className="py-2 pr-4">{annex.endDate ?? '—'}</td>
                  <td className="py-2 pr-4">
                    {toTimeInput(annex.scheduleStartTime)}
                  </td>
                  <td className="py-2 pr-4">
                    {toTimeInput(annex.scheduleEndTime)}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${stateBadgeClass(annex.state)}`}
                    >
                      {t(`pages.annexes.states.${annex.state}`)}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                        onClick={() =>
                          navigate(`/annexes/${annex.id}/settings`)
                        }
                      >
                        {t('common.open')}
                      </button>
                      {annex.state === 'DRAFT' && (
                        <button
                          className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                          onClick={() => handleActivate(annex)}
                        >
                          {t('pages.annexes.activate')}
                        </button>
                      )}
                      <button
                        className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => handleDelete(annex.id!)}
                        disabled={annex.state === 'FINISHED'}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>

              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
