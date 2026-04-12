import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { AnnexDto } from '@/components/schedule/types';
import type { AnnexChildGroupDto } from '@/types';
import {
  useGetAnnexesQuery,
  useCreateAnnexMutation,
  useUpdateAnnexMutation,
  useDeleteAnnexMutation,
  useActivateAnnexMutation,
  useGetAnnexChildrenQuery,
  useAssignChildToAnnexMutation,
  useRemoveChildFromAnnexMutation,
} from '@/store/annexesApi';
import { useGetChildrenQuery } from '@/store/childrenApi';
import { useGetGroupsQuery } from '@/store/groupsApi';

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

function toTimeInput(time: string): string {
  return time ? time.substring(0, 5) : '';
}

function fromTimeInput(time: string): string {
  return time ? `${time}:00` : '';
}

const emptyForm = { name: '', scheduleStartTime: '', scheduleEndTime: '' };

function AnnexChildrenSection({ annex }: { annex: AnnexDto }) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [childId, setChildId] = useState<number | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);

  const { data: assignments = [] } = useGetAnnexChildrenQuery(annex.id!);
  const { data: children = [] } = useGetChildrenQuery();
  const { data: groups = [] } = useGetGroupsQuery();
  const [assignChild] = useAssignChildToAnnexMutation();
  const [removeChild] = useRemoveChildFromAnnexMutation();
  const isReadOnly = annex.state === 'FINISHED';

  async function handleAssign() {
    if (!childId || !groupId) return;
    await assignChild({
      annexId: annex.id!,
      dto: {
        id: null,
        annexId: annex.id!,
        childId,
        childFirstName: '',
        childLastName: '',
        groupId,
        groupName: '',
      },
    });
    setAdding(false);
    setChildId(null);
    setGroupId(null);
  }

  async function handleRemove(acg: AnnexChildGroupDto) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    await removeChild({ annexId: annex.id!, annexChildGroupId: acg.id! });
  }

  return (
    <div className="mt-2 pl-4 border-l-2 border-border flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          {t('pages.annexes.children')}
        </span>
        {!adding && !isReadOnly && (
          <button
            className="rounded-md border border-border px-2 py-0.5 text-xs hover:bg-accent transition-colors"
            onClick={() => setAdding(true)}
          >
            {t('pages.annexes.addChild')}
          </button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2 flex-wrap items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t('pages.annexes.child')}
            </label>
            <select
              className={selectClass}
              value={childId ?? ''}
              onChange={(e) =>
                setChildId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">{t('pages.annexes.child')}</option>
              {children.map((c) => (
                <option key={c.id} value={c.id!}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t('pages.children.group')}
            </label>
            <select
              className={selectClass}
              value={groupId ?? ''}
              onChange={(e) =>
                setGroupId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">{t('pages.children.group')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id!}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-xs hover:bg-primary/90 transition-colors"
            onClick={handleAssign}
          >
            {t('common.save')}
          </button>
          <button
            className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent transition-colors"
            onClick={() => setAdding(false)}
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      {assignments.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center gap-3 text-xs">
              <span className="font-medium">
                {a.childFirstName} {a.childLastName}
              </span>
              <span className="text-muted-foreground">{a.groupName}</span>
              {!isReadOnly && (
                <button
                  className="text-destructive hover:underline text-xs"
                  onClick={() => handleRemove(a)}
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnnexesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [editTarget, setEditTarget] = useState<'new' | AnnexDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedChildrenId, setExpandedChildrenId] = useState<number | null>(
    null
  );

  const { data: annexes = [], isLoading } = useGetAnnexesQuery();
  const [createAnnex] = useCreateAnnexMutation();
  const [updateAnnex] = useUpdateAnnexMutation();
  const [deleteAnnex] = useDeleteAnnexMutation();
  const [activateAnnex] = useActivateAnnexMutation();

  function set(field: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openAdd() {
    setEditTarget('new');
    setForm(emptyForm);
  }

  function openEdit(annex: AnnexDto) {
    if (annex.state === 'FINISHED') return;
    setEditTarget(annex);
    setForm({
      name: annex.name,
      scheduleStartTime: toTimeInput(annex.scheduleStartTime),
      scheduleEndTime: toTimeInput(annex.scheduleEndTime),
    });
  }

  async function handleSave() {
    if (!form.name.trim() || !form.scheduleStartTime || !form.scheduleEndTime)
      return;
    if (editTarget === 'new') {
      await createAnnex({
        id: null,
        name: form.name.trim(),
        startDate: null,
        endDate: null,
        scheduleStartTime: fromTimeInput(form.scheduleStartTime),
        scheduleEndTime: fromTimeInput(form.scheduleEndTime),
        state: 'DRAFT',
      });
    } else {
      const existing = editTarget as AnnexDto;
      await updateAnnex({
        ...existing,
        name: form.name.trim(),
        scheduleStartTime: fromTimeInput(form.scheduleStartTime),
        scheduleEndTime: fromTimeInput(form.scheduleEndTime),
      });
    }
    setEditTarget(null);
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
        {editTarget === null && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={openAdd}
          >
            {t('pages.annexes.add')}
          </button>
        )}
      </div>

      {editTarget !== null && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">
            {editTarget === 'new' ? t('pages.annexes.add') : t('common.edit')}
          </h2>
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
              onClick={() => setEditTarget(null)}
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
                      <button
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                        onClick={() =>
                          setExpandedChildrenId((prev) =>
                            prev === annex.id ? null : annex.id!
                          )
                        }
                      >
                        {t('pages.annexes.children')}
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
                        className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => openEdit(annex)}
                        disabled={annex.state === 'FINISHED'}
                      >
                        {t('common.edit')}
                      </button>
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
                {expandedChildrenId === annex.id && (
                  <tr>
                    <td colSpan={7} className="pb-3 px-2">
                      <AnnexChildrenSection annex={annex} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
