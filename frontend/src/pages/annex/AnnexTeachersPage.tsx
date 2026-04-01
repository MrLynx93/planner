import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import { GripVertical, X } from 'lucide-react'
import type { AnnexDto, AnnexTeacherDto } from '@/components/schedule/types'
import {
  useGetAnnexTeachersQuery,
  useGetAnnexGroupsQuery,
  useAddAnnexTeacherMutation,
  useUpdateAnnexTeacherMutation,
  useRemoveAnnexTeacherMutation,
} from '@/store/annexesApi'
import { useGetTeachersQuery } from '@/store/teachersApi'

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring'

export function AnnexTeachersPage() {
  const { t } = useTranslation()
  const annex = useOutletContext<AnnexDto>()
  const isReadOnly = annex.state === 'FINISHED'

  const { data: annexTeachers = [], isLoading } = useGetAnnexTeachersQuery(annex.id!)
  const { data: annexGroups = [] } = useGetAnnexGroupsQuery(annex.id!)
  const { data: allTeachers = [] } = useGetTeachersQuery()
  const [addTeacher] = useAddAnnexTeacherMutation()
  const [updateTeacher] = useUpdateAnnexTeacherMutation()
  const [removeTeacher] = useRemoveAnnexTeacherMutation()


  const [editingId, setEditingId] = useState<number | null>(null)
  const [editGroupId, setEditGroupId] = useState<number | null>(null)

  const assignedTeacherIds = new Set(annexTeachers.map(at => at.teacherId))
  const availableTeachers = allTeachers.filter(t => !assignedTeacherIds.has(t.id!))

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const teacherId = Number(e.dataTransfer.getData('teacherId'))
    if (!teacherId) return
    await addTeacher({
      annexId: annex.id!,
      dto: {
        id: null,
        annexId: annex.id!,
        teacherId,
        firstName: '',
        lastName: '',
        defaultGroupId: null,
        defaultGroupName: null,
      },
    })
  }

  function startEdit(at: AnnexTeacherDto) {
    setEditingId(at.id)
    setEditGroupId(at.defaultGroupId)
  }

  async function handleUpdateGroup(at: AnnexTeacherDto) {
    await updateTeacher({
      annexId: annex.id!,
      annexTeacherId: at.id!,
      dto: { ...at, defaultGroupId: editGroupId, defaultGroupName: null },
    })
    setEditingId(null)
  }

  async function handleRemove(at: AnnexTeacherDto) {
    await removeTeacher({ annexId: annex.id!, annexTeacherId: at.id! })
  }

  return (
    <div className="flex gap-6 p-6 h-full">
      <div
        className="flex-1 flex flex-col gap-3 min-w-0"
        onDragOver={e => { e.preventDefault() }}
        onDrop={isReadOnly ? undefined : handleDrop}
      >
        <h2 className="text-base font-semibold">{t('pages.draftAnnex.teachers.inAnnex')}</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : annexTeachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {annexTeachers.map(at => (
              <div key={at.id} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                {editingId === at.id ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium flex-1 min-w-0">{at.firstName} {at.lastName}</span>
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
                    <button
                      className="rounded bg-primary text-primary-foreground px-2 py-0.5 text-xs hover:bg-primary/90 transition-colors"
                      onClick={() => handleUpdateGroup(at)}
                    >
                      {t('common.save')}
                    </button>
                    <button
                      className="rounded border border-border px-2 py-0.5 text-xs hover:bg-accent transition-colors"
                      onClick={() => setEditingId(null)}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium flex-1 min-w-0">{at.firstName} {at.lastName}</span>
                    <span className="text-muted-foreground text-xs">
                      {at.defaultGroupName ?? <span className="italic">{t('pages.draftAnnex.teachers.noGroup')}</span>}
                    </span>
                    {!isReadOnly && (
                      <>
                        <button
                          className="text-muted-foreground hover:text-foreground transition-colors text-xs px-1.5 py-0.5 rounded hover:bg-accent"
                          onClick={() => startEdit(at)}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors rounded p-0.5"
                          onClick={() => handleRemove(at)}
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <h2 className="text-base font-semibold">{t('pages.draftAnnex.teachers.available')}</h2>
        {availableTeachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {availableTeachers.map(teacher => (
              <div
                key={teacher.id}
                draggable={!isReadOnly}
                onDragStart={e => e.dataTransfer.setData('teacherId', String(teacher.id))}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm select-none hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing"
              >
                <GripVertical size={14} className="text-muted-foreground shrink-0" />
                <span>{teacher.firstName} {teacher.lastName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
