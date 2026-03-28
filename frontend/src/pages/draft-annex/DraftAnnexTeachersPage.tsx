import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnnexTeacherDto } from '@/components/schedule/types'
import {
  useGetAnnexesQuery,
  useGetAnnexTeachersQuery,
  useGetAnnexGroupsQuery,
  useAddAnnexTeacherMutation,
  useUpdateAnnexTeacherMutation,
  useRemoveAnnexTeacherMutation,
} from '@/store/annexesApi'
import { useGetTeachersQuery } from '@/store/teachersApi'

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function DraftAnnexTeachersPage() {
  const { t } = useTranslation()
  const { data: annexes = [], isLoading: loadingAnnex } = useGetAnnexesQuery()
  const draft = annexes.find(a => a.state === 'DRAFT')

  const { data: annexTeachers = [], isLoading } = useGetAnnexTeachersQuery(draft?.id!, { skip: !draft })
  const { data: annexGroups = [] } = useGetAnnexGroupsQuery(draft?.id!, { skip: !draft })
  const { data: allTeachers = [] } = useGetTeachersQuery()
  const [addTeacher] = useAddAnnexTeacherMutation()
  const [updateTeacher] = useUpdateAnnexTeacherMutation()
  const [removeTeacher] = useRemoveAnnexTeacherMutation()

  const [adding, setAdding] = useState(false)
  const [newTeacherId, setNewTeacherId] = useState<number | null>(null)
  const [newDefaultGroupId, setNewDefaultGroupId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editGroupId, setEditGroupId] = useState<number | null>(null)

  const assignedTeacherIds = new Set(annexTeachers.map(at => at.teacherId))
  const availableTeachers = allTeachers.filter(t => !assignedTeacherIds.has(t.id!))

  async function handleAdd() {
    if (!draft || !newTeacherId) return
    await addTeacher({
      annexId: draft.id!,
      dto: {
        id: null,
        annexId: draft.id!,
        teacherId: newTeacherId,
        firstName: '',
        lastName: '',
        defaultGroupId: newDefaultGroupId,
        defaultGroupName: null,
      },
    })
    setAdding(false)
    setNewTeacherId(null)
    setNewDefaultGroupId(null)
  }

  function startEdit(at: AnnexTeacherDto) {
    setEditingId(at.id)
    setEditGroupId(at.defaultGroupId)
  }

  async function handleUpdateGroup(at: AnnexTeacherDto) {
    if (!draft) return
    await updateTeacher({
      annexId: draft.id!,
      annexTeacherId: at.id!,
      dto: { ...at, defaultGroupId: editGroupId, defaultGroupName: null },
    })
    setEditingId(null)
  }

  async function handleRemove(at: AnnexTeacherDto) {
    if (!draft || !window.confirm(t('common.confirmDelete'))) return
    await removeTeacher({ annexId: draft.id!, annexTeacherId: at.id! })
  }

  if (loadingAnnex) return <p className="p-6 text-sm text-muted-foreground">{t('common.loading')}</p>
  if (!draft) return <p className="p-6 text-sm text-muted-foreground">{t('pages.draftAnnex.noDraftAnnex')}</p>

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('pages.draftAnnex.teachers.title')}</h1>
        {!adding && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={() => setAdding(true)}
          >
            {t('pages.draftAnnex.teachers.add')}
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">{t('pages.draftAnnex.teachers.add')}</h2>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t('pages.draftAnnex.teachers.teacher')}
              </label>
              <select
                className={selectClass}
                value={newTeacherId ?? ''}
                onChange={e => setNewTeacherId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{t('pages.draftAnnex.teachers.teacher')}</option>
                {availableTeachers.map(t => (
                  <option key={t.id} value={t.id!}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {t('pages.draftAnnex.teachers.defaultGroup')}
              </label>
              <select
                className={selectClass}
                value={newDefaultGroupId ?? ''}
                onChange={e => setNewDefaultGroupId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{t('pages.draftAnnex.teachers.noGroup')}</option>
                {annexGroups.map(g => (
                  <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                ))}
              </select>
            </div>
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
              onClick={() => { setAdding(false); setNewTeacherId(null); setNewDefaultGroupId(null) }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : annexTeachers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">{t('common.name')}</th>
              <th className="pb-2 pr-4 font-medium">{t('pages.draftAnnex.teachers.defaultGroup')}</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {annexTeachers.map(at => (
              <tr key={at.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-medium">{at.firstName} {at.lastName}</td>
                <td className="py-2 pr-4">
                  {editingId === at.id ? (
                    <select
                      className={selectClass}
                      value={editGroupId ?? ''}
                      onChange={e => setEditGroupId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">{t('pages.draftAnnex.teachers.noGroup')}</option>
                      {annexGroups.map(g => (
                        <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                      ))}
                    </select>
                  ) : (
                    at.defaultGroupName ?? <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2">
                  <div className="flex gap-2 justify-end">
                    {editingId === at.id ? (
                      <>
                        <button
                          className="rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors"
                          onClick={() => handleUpdateGroup(at)}
                        >
                          {t('common.save')}
                        </button>
                        <button
                          className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                          onClick={() => setEditingId(null)}
                        >
                          {t('common.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                          onClick={() => startEdit(at)}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => handleRemove(at)}
                        >
                          {t('common.delete')}
                        </button>
                      </>
                    )}
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
