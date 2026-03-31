import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import type { AnnexDto } from '@/components/schedule/types'
import type { AnnexChildGroupDto } from '@/types'
import {
  useGetAnnexGroupsQuery,
  useGetAnnexChildrenQuery,
  useAssignChildToAnnexMutation,
  useRemoveChildFromAnnexMutation,
} from '@/store/annexesApi'
import { useGetChildrenQuery } from '@/store/childrenApi'

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function AnnexChildrenPage() {
  const { t } = useTranslation()
  const annex = useOutletContext<AnnexDto>()
  const isReadOnly = annex.state === 'FINISHED'

  const { data: assignments = [], isLoading } = useGetAnnexChildrenQuery(annex.id!)
  const { data: annexGroups = [] } = useGetAnnexGroupsQuery(annex.id!)
  const { data: allChildren = [] } = useGetChildrenQuery()
  const [assignChild] = useAssignChildToAnnexMutation()
  const [removeChild] = useRemoveChildFromAnnexMutation()

  const [adding, setAdding] = useState(false)
  const [childId, setChildId] = useState<number | null>(null)
  const [groupId, setGroupId] = useState<number | null>(null)

  const assignedChildIds = new Set(assignments.map(a => a.childId))
  const availableChildren = allChildren.filter(c => !assignedChildIds.has(c.id!))

  async function handleAssign() {
    if (!childId || !groupId) return
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
    })
    setAdding(false)
    setChildId(null)
    setGroupId(null)
  }

  async function handleRemove(a: AnnexChildGroupDto) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await removeChild({ annexId: annex.id!, annexChildGroupId: a.id! })
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('pages.draftAnnex.children.title')}</h1>
        {!adding && !isReadOnly && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={() => setAdding(true)}
          >
            {t('pages.draftAnnex.children.add')}
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">{t('pages.draftAnnex.children.add')}</h2>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t('pages.draftAnnex.children.child')}
              </label>
              <select
                className={selectClass}
                value={childId ?? ''}
                onChange={e => setChildId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{t('pages.draftAnnex.children.child')}</option>
                {availableChildren.map(c => (
                  <option key={c.id} value={c.id!}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t('pages.draftAnnex.children.group')}
              </label>
              <select
                className={selectClass}
                value={groupId ?? ''}
                onChange={e => setGroupId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{t('pages.draftAnnex.children.group')}</option>
                {annexGroups.map(g => (
                  <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
              onClick={handleAssign}
            >
              {t('common.save')}
            </button>
            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              onClick={() => { setAdding(false); setChildId(null); setGroupId(null) }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">{t('pages.draftAnnex.children.child')}</th>
              <th className="pb-2 pr-4 font-medium">{t('pages.draftAnnex.children.group')}</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-medium">{a.childFirstName} {a.childLastName}</td>
                <td className="py-2 pr-4">{a.groupName}</td>
                <td className="py-2">
                  {!isReadOnly && (
                    <div className="flex justify-end">
                      <button
                        className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleRemove(a)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
