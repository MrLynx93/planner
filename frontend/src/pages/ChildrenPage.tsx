import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChildDto } from '@/types'
import {
  useGetChildrenQuery,
  useCreateChildMutation,
  useUpdateChildMutation,
  useDeleteChildMutation,
} from '@/store/childrenApi'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function ChildrenPage() {
  const { t } = useTranslation()

  const [editTarget, setEditTarget] = useState<'new' | ChildDto | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const { data: children = [], isLoading } = useGetChildrenQuery()
  const [createChild] = useCreateChildMutation()
  const [updateChild] = useUpdateChildMutation()
  const [deleteChild] = useDeleteChildMutation()

  function openAdd() {
    setEditTarget('new')
    setFirstName('')
    setLastName('')
  }

  function openEdit(child: ChildDto) {
    setEditTarget(child)
    setFirstName(child.firstName)
    setLastName(child.lastName)
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) return
    if (editTarget === 'new') {
      await createChild({ id: null, firstName: firstName.trim(), lastName: lastName.trim() })
    } else {
      await updateChild({ ...(editTarget as ChildDto), firstName: firstName.trim(), lastName: lastName.trim() })
    }
    setEditTarget(null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await deleteChild(id)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('pages.children.title')}</h1>
        {editTarget === null && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={openAdd}
          >
            {t('pages.children.add')}
          </button>
        )}
      </div>

      {editTarget !== null && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">
            {editTarget === 'new' ? t('pages.children.add') : t('common.edit')}
          </h2>
          <div className="flex gap-3 flex-wrap">
            <input
              className={inputClass}
              placeholder={t('common.firstName')}
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <input
              className={inputClass}
              placeholder={t('common.lastName')}
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
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
      ) : children.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <div className="flex flex-col">
          {children.map(child => (
            <div key={child.id} className="border-b border-border last:border-0">
              <div className="flex items-center py-2 gap-3">
                <span className="flex-1 text-sm">
                  {child.firstName} {child.lastName}
                </span>
                <button
                  className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                  onClick={() => openEdit(child)}
                >
                  {t('common.edit')}
                </button>
                <button
                  className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => handleDelete(child.id!)}
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
