import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GroupDto } from '@/types';
import {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} from '@/store/groupsApi';

const inputClass =
  'w-full rounded-md border border-border bg-background px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const timeInputClass =
  'w-full rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const btnPrimary =
  'w-16 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors';
const btnSecondary =
  'w-16 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors';
const btnDestructive =
  'w-16 rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors';

function toTimeInput(time: string | null | undefined): string {
  return time ? time.substring(0, 5) : '';
}

function fromTimeInput(value: string): string | null {
  return value ? `${value}:00` : null;
}

const emptyForm = { name: '', scheduleStartTime: '', scheduleEndTime: '' };

export function GroupsPage() {
  const { t } = useTranslation();
  const { data: groups = [], isLoading } = useGetGroupsQuery();
  const [createGroup] = useCreateGroupMutation();
  const [updateGroup] = useUpdateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();

  const [newValues, setNewValues] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState(emptyForm);

  function openEdit(group: GroupDto) {
    setEditingId(group.id!);
    setEditValues({
      name: group.name,
      scheduleStartTime: toTimeInput(group.scheduleStartTime),
      scheduleEndTime: toTimeInput(group.scheduleEndTime),
    });
  }

  async function handleAdd() {
    if (!newValues.name.trim()) return;
    await createGroup({
      id: null,
      name: newValues.name.trim(),
      scheduleStartTime: fromTimeInput(newValues.scheduleStartTime),
      scheduleEndTime: fromTimeInput(newValues.scheduleEndTime),
    });
    setNewValues(emptyForm);
  }

  async function handleSave(group: GroupDto) {
    if (!editValues.name.trim()) return;
    await updateGroup({
      ...group,
      name: editValues.name.trim(),
      scheduleStartTime: fromTimeInput(editValues.scheduleStartTime),
      scheduleEndTime: fromTimeInput(editValues.scheduleEndTime),
    });
    setEditingId(null);
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    await deleteGroup(id);
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <h1 className="text-xl font-semibold">{t('pages.groups.title')}</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pl-[11px] pr-4 font-medium">{t('common.name')}</th>
              <th className="pb-2 pr-4 font-medium">{t('pages.annexes.scheduleStartTime')}</th>
              <th className="pb-2 pr-4 font-medium">{t('pages.annexes.scheduleEndTime')}</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            <tr className="h-11 border-b border-border">
              <td className="pr-4 align-middle">
                <input
                  className={inputClass}
                  placeholder={t('common.name')}
                  value={newValues.name}
                  onChange={(e) => setNewValues((v) => ({ ...v, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </td>
              <td className="pr-4 align-middle">
                <input
                  type="time"
                  className={timeInputClass}
                  value={newValues.scheduleStartTime}
                  onChange={(e) => setNewValues((v) => ({ ...v, scheduleStartTime: e.target.value }))}
                />
              </td>
              <td className="pr-4 align-middle">
                <input
                  type="time"
                  className={timeInputClass}
                  value={newValues.scheduleEndTime}
                  onChange={(e) => setNewValues((v) => ({ ...v, scheduleEndTime: e.target.value }))}
                />
              </td>
              <td className="align-middle">
                <div className="flex gap-2 justify-end">
                  <button className={btnPrimary} onClick={handleAdd}>
                    {t('common.add')}
                  </button>
                </div>
              </td>
            </tr>

            {groups.map((group) =>
              editingId === group.id ? (
                <tr key={group.id!} className="h-11 border-b border-border last:border-0">
                  <td className="pr-4 align-middle">
                    <input
                      className={inputClass}
                      value={editValues.name}
                      onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave(group)}
                      autoFocus
                    />
                  </td>
                  <td className="pr-4 align-middle">
                    <input
                      type="time"
                      className={timeInputClass}
                      value={editValues.scheduleStartTime}
                      onChange={(e) => setEditValues((v) => ({ ...v, scheduleStartTime: e.target.value }))}
                    />
                  </td>
                  <td className="pr-4 align-middle">
                    <input
                      type="time"
                      className={timeInputClass}
                      value={editValues.scheduleEndTime}
                      onChange={(e) => setEditValues((v) => ({ ...v, scheduleEndTime: e.target.value }))}
                    />
                  </td>
                  <td className="align-middle">
                    <div className="flex gap-2 justify-end">
                      <button className={btnPrimary} onClick={() => handleSave(group)}>
                        {t('common.save')}
                      </button>
                      <button className={btnSecondary} onClick={() => setEditingId(null)}>
                        {t('common.cancel')}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={group.id!} className="h-11 border-b border-border last:border-0">
                  <td className="pr-4 pl-[11px] align-middle">{group.name}</td>
                  <td className="pr-4 pl-[11px] align-middle font-mono text-xs text-muted-foreground">
                    {toTimeInput(group.scheduleStartTime) || '—'}
                  </td>
                  <td className="pr-4 pl-[11px] align-middle font-mono text-xs text-muted-foreground">
                    {toTimeInput(group.scheduleEndTime) || '—'}
                  </td>
                  <td className="align-middle">
                    <div className="flex gap-2 justify-end">
                      <button className={btnSecondary} onClick={() => openEdit(group)}>
                        {t('common.edit')}
                      </button>
                      <button className={btnDestructive} onClick={() => handleDelete(group.id!)}>
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
