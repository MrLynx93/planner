import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import { GripVertical, X } from 'lucide-react'
import type { AnnexDto, AnnexTeacherDto } from '@/components/schedule/types'
import {
  useGetAnnexTeachersQuery,
  useAddAnnexTeacherMutation,
  useRemoveAnnexTeacherMutation,
} from '@/store/annexesApi'
import { useGetTeachersQuery } from '@/store/teachersApi'

export function AnnexTeachersPage() {
  const { t } = useTranslation()
  const annex = useOutletContext<AnnexDto>()
  const isReadOnly = annex.state === 'FINISHED'

  const { data: annexTeachers = [], isLoading } = useGetAnnexTeachersQuery(annex.id!)
  const { data: allTeachers = [] } = useGetTeachersQuery()
  const [addTeacher] = useAddAnnexTeacherMutation()
  const [removeTeacher] = useRemoveAnnexTeacherMutation()

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
      },
    })
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
              <div key={at.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span className="font-medium flex-1 min-w-0">{at.firstName} {at.lastName}</span>
                {!isReadOnly && (
                  <button
                    className="text-muted-foreground hover:text-destructive transition-colors rounded p-0.5"
                    onClick={() => handleRemove(at)}
                  >
                    <X size={14} />
                  </button>
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
