import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AnnexDto, DayOfWeek } from '@/components/schedule/types'
import { DraftCalendarGrid } from '@/components/schedule/DraftCalendarGrid'
import {
  useGetAnnexGroupsQuery,
  useGetAnnexTeachersQuery,
  useGetAnnexTimeBlocksQuery,
  useCreateAnnexTimeBlockMutation,
  useUpdateAnnexTimeBlockMutation,
  useDeleteAnnexTimeBlockMutation,
} from '@/store/annexesApi'

export function AnnexPlanTeacherPage() {
  const { t } = useTranslation()
  const annex = useOutletContext<AnnexDto>()
  const annexId = annex.id!
  const editable = annex.state === 'DRAFT'

  const { data: groups = [] } = useGetAnnexGroupsQuery(annexId)
  const { data: teachers = [] } = useGetAnnexTeachersQuery(annexId)
  const { data: allBlocks = [] } = useGetAnnexTimeBlocksQuery(annexId)

  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)

  const [createTimeBlock] = useCreateAnnexTimeBlockMutation()
  const [updateTimeBlock] = useUpdateAnnexTimeBlockMutation()
  const [deleteTimeBlock] = useDeleteAnnexTimeBlockMutation()

  const effectiveTeacherId = selectedTeacherId ?? teachers[0]?.teacherId ?? null
  const filteredBlocks = effectiveTeacherId
    ? allBlocks.filter(b => b.teacherId === effectiveTeacherId)
    : []

  const handleDrop = (day: DayOfWeek, _startTime: string, groupId: number) => {
    if (!effectiveTeacherId) return
    const alreadyExists = allBlocks.some(
      b => b.teacherId === effectiveTeacherId && b.groupId === groupId && b.dayOfWeek === day,
    )
    if (alreadyExists) return
    createTimeBlock({
      annexId,
      dto: { teacherId: effectiveTeacherId, groupId, dayOfWeek: day, startTime: annex.scheduleStartTime, endTime: annex.scheduleEndTime, type: 'TEMPLATE' },
    })
  }

  return (
    <div className="h-full flex min-h-0">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Teacher selector */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
          <label className="text-sm font-medium text-muted-foreground">
            {t('draftPlan.teacher')}:
          </label>
          {teachers.length === 0 ? (
            <span className="text-sm text-muted-foreground">{t('common.noItems')}</span>
          ) : (
            <select
              className="text-sm border border-border rounded-md px-2 py-1.5 bg-background"
              value={effectiveTeacherId ?? ''}
              onChange={e => setSelectedTeacherId(Number(e.target.value))}
            >
              {teachers.map(teacher => (
                <option key={teacher.teacherId} value={teacher.teacherId}>
                  {teacher.firstName} {teacher.lastName}
                </option>
              ))}
            </select>
          )}
        </div>

        <DraftCalendarGrid
          blocks={filteredBlocks}
          colorBy="group"
          editable={editable}
          xAxis="days"
          onDropItem={(day, startTime, groupId) => handleDrop(day, startTime, groupId)}
          onResizeBlock={(id, start, end) =>
            updateTimeBlock({ annexId, annexTimeBlockId: id, startTime: start, endTime: end })
          }
          onDeleteBlock={id => deleteTimeBlock({ annexId, annexTimeBlockId: id })}
        />
      </div>

      {/* Right panel: groups */}
      <div className="w-52 border-l border-border overflow-y-auto p-3 flex flex-col gap-1.5 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-1">
          {t('draftPlan.groups')}
        </p>
        <div className="border-t border-border mb-1" />
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('common.noItems')}</p>
        ) : (
          groups.map(group => (
            <div
              key={group.groupId}
              draggable={editable}
              onDragStart={e => e.dataTransfer.setData('id', String(group.groupId))}
              className={`px-3 py-2 rounded text-sm border border-border select-none ${
                editable
                  ? 'cursor-grab active:cursor-grabbing hover:bg-accent'
                  : 'opacity-50 cursor-default'
              }`}
            >
              {group.groupName}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
