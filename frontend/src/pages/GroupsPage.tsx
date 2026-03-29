import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GroupDto } from '@/types'
import {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} from '@/store/groupsApi'

const inputClass =
  'w-full rounded-md border border-border bg-background px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function GroupsPage() {
  const { t } = useTranslation()

  const [newName, setNewName] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const { data: groups = [], isLoading } = useGetGroupsQuery()
  const [createGroup] = useCreateGroupMutation()
  const [updateGroup] = useUpdateGroupMutation()
  const [deleteGroup] = useDeleteGroupMutation()

  function openEdit(group: GroupDto) {
    setEditingId(group.id!)
    setEditName(group.name)
  }

  async function handleAdd() {
    if (!newName.trim()) return
    await createGroup({ id: null, name: newName.trim() })
    setNewName('')
  }

  async function handleSave(group: GroupDto) {
    if (!editName.trim()) return
    await updateGroup({ ...group, name: editName.trim() })
    setEditingId(null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await deleteGroup(id)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-xl font-semibold">{t('pages.groups.title')}</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pl-11px pr-4 font-medium">{t('common.name')}</th>
              <th className="pb-2 pl-11px font-medium" />
            </tr>
          </thead>
          <tbody>
            <tr className="h-11 border-b border-border">
              <td className="pr-4 align-middle">
                <input
                  className={inputClass}
                  placeholder={t('common.name')}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </td>
              <td className="align-middle">
                <div className="flex gap-2 justify-end">
                  <button
                    className="w-16 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors"
                    onClick={handleAdd}
                  >
                    {t('common.add')}
                  </button>
                </div>
              </td>
            </tr>
            {groups.map(group =>
              editingId === group.id ? (
                <tr key={group.id} className="h-11 border-b border-border last:border-0">
                  <td className="pr-4 align-middle">
                    <input
                      className={inputClass}
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSave(group)}
                      autoFocus
                    />
                  </td>
                  <td className="align-middle">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="w-16 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors"
                        onClick={() => handleSave(group)}
                      >
                        {t('common.save')}
                      </button>
                      <button
                        className="w-16 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                        onClick={() => setEditingId(null)}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={group.id} className="h-11 border-b border-border last:border-0">
                  <td className="pr-4 pl-11px align-middle">{group.name}</td>
                  <td className="align-middle">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="w-16 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                        onClick={() => openEdit(group)}
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        className="w-16 rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDelete(group.id!)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
