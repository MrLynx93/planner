import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import type { AnnexDto, AnnexGroupDto } from '@/components/schedule/types'
import {
  useGetAnnexGroupsQuery,
  useAddAnnexGroupMutation,
  useRemoveAnnexGroupMutation,
} from '@/store/annexesApi'
import { useGetGroupsQuery } from '@/store/groupsApi'

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function AnnexGroupsPage() {
  const { t } = useTranslation()
  const annex = useOutletContext<AnnexDto>()
  const isReadOnly = annex.state === 'FINISHED'

  const { data: annexGroups = [], isLoading } = useGetAnnexGroupsQuery(annex.id!)
  const { data: allGroups = [] } = useGetGroupsQuery()
  const [addGroup] = useAddAnnexGroupMutation()
  const [removeGroup] = useRemoveAnnexGroupMutation()

  const [adding, setAdding] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)

  const assignedGroupIds = new Set(annexGroups.map(ag => ag.groupId))
  const availableGroups = allGroups.filter(g => !assignedGroupIds.has(g.id!))

  async function handleAdd() {
    if (!selectedGroupId) return
    await addGroup({
      annexId: annex.id!,
      dto: { id: null, annexId: annex.id!, groupId: selectedGroupId, groupName: '' },
    })
    setAdding(false)
    setSelectedGroupId(null)
  }

  async function handleRemove(ag: AnnexGroupDto) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await removeGroup({ annexId: annex.id!, annexGroupId: ag.id! })
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('pages.draftAnnex.groups.title')}</h1>
        {!adding && !isReadOnly && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={() => setAdding(true)}
          >
            {t('pages.draftAnnex.groups.add')}
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">{t('pages.draftAnnex.groups.add')}</h2>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {t('pages.draftAnnex.groups.group')}
            </label>
            <select
              className={selectClass}
              value={selectedGroupId ?? ''}
              onChange={e => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('pages.draftAnnex.groups.group')}</option>
              {availableGroups.map(g => (
                <option key={g.id} value={g.id!}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
              onClick={handleAdd}
            >
              {t('common.save')}
            </button>
            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              onClick={() => { setAdding(false); setSelectedGroupId(null) }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : annexGroups.length === 0 ? (
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
            {annexGroups.map(ag => (
              <tr key={ag.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-medium">{ag.groupName}</td>
                <td className="py-2">
                  {!isReadOnly && (
                    <div className="flex justify-end">
                      <button
                        className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleRemove(ag)}
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
