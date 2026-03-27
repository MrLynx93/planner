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
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function GroupsPage() {
  const { t } = useTranslation()

  const [editTarget, setEditTarget] = useState<'new' | GroupDto | null>(null)
  const [name, setName] = useState('')

  const { data: groups = [], isLoading } = useGetGroupsQuery()
  const [createGroup] = useCreateGroupMutation()
  const [updateGroup] = useUpdateGroupMutation()
  const [deleteGroup] = useDeleteGroupMutation()

  function openAdd() {
    setEditTarget('new')
    setName('')
  }

  function openEdit(group: GroupDto) {
    setEditTarget(group)
    setName(group.name)
  }

  async function handleSave() {
    if (!name.trim()) return
    if (editTarget === 'new') {
      await createGroup({ id: null, name: name.trim() })
    } else {
      await updateGroup({ ...(editTarget as GroupDto), name: name.trim() })
    }
    setEditTarget(null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await deleteGroup(id)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('pages.groups.title')}</h1>
        {editTarget === null && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={openAdd}
          >
            {t('pages.groups.add')}
          </button>
        )}
      </div>

      {editTarget !== null && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">
            {editTarget === 'new' ? t('pages.groups.add') : t('common.edit')}
          </h2>
          <div className="flex gap-3">
            <input
              className={inputClass}
              placeholder={t('common.name')}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
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
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">{t('common.name')}</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4">{group.name}</td>
                <td className="py-2">
                  <div className="flex gap-2 justify-end">
                    <button
                      className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                      onClick={() => openEdit(group)}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => handleDelete(group.id!)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
