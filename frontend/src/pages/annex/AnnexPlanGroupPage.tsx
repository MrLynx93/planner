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

export function AnnexPlanGroupPage() {
  const { t } = useTranslation()
  const annex = useOutletContext<AnnexDto>()
  const annexId = annex.id!
  const editable = annex.state === 'DRAFT'

  const { data: groups = [] } = useGetAnnexGroupsQuery(annexId)
  const { data: teachers = [] } = useGetAnnexTeachersQuery(annexId)
  const { data: allBlocks = [] } = useGetAnnexTimeBlocksQuery(annexId)

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)

  const [createTimeBlock] = useCreateAnnexTimeBlockMutation()
  const [updateTimeBlock] = useUpdateAnnexTimeBlockMutation()
  const [deleteTimeBlock] = useDeleteAnnexTimeBlockMutation()

  const effectiveGroupId = selectedGroupId ?? groups[0]?.groupId ?? null
  const filteredBlocks = effectiveGroupId ? allBlocks.filter(b => b.groupId === effectiveGroupId) : []

  const handleDrop = (day: DayOfWeek, _startTime: string, teacherId: number) => {
    if (!effectiveGroupId) return
    const alreadyExists = allBlocks.some(
      b => b.teacherId === teacherId && b.groupId === effectiveGroupId && b.dayOfWeek === day,
    )
    if (alreadyExists) return
    createTimeBlock({
      annexId,
      dto: { teacherId, groupId: effectiveGroupId, dayOfWeek: day, startTime: annex.scheduleStartTime, endTime: annex.scheduleEndTime, type: 'TEMPLATE' },
    })
  }

  return (
    <div className="h-full flex min-h-0">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Group selector */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
          <label className="text-sm font-medium text-muted-foreground">
            {t('draftPlan.group')}:
          </label>
          {groups.length === 0 ? (
            <span className="text-sm text-muted-foreground">{t('common.noItems')}</span>
          ) : (
            <select
              className="text-sm border border-border rounded-md px-2 py-1.5 bg-background"
              value={effectiveGroupId ?? ''}
              onChange={e => setSelectedGroupId(Number(e.target.value))}
            >
              {groups.map(g => (
                <option key={g.groupId} value={g.groupId}>
                  {g.groupName}
                </option>
              ))}
            </select>
          )}
        </div>

        <DraftCalendarGrid
          blocks={filteredBlocks}
          colorBy="teacher"
          editable={editable}
          xAxis="days"
          onDropItem={(day, startTime, teacherId) => handleDrop(day, startTime, teacherId)}
          onResizeBlock={(id, start, end) =>
            updateTimeBlock({ annexId, annexTimeBlockId: id, startTime: start, endTime: end })
          }
          onDeleteBlock={id => deleteTimeBlock({ annexId, annexTimeBlockId: id })}
        />
      </div>

      {/* Right panel: teachers */}
      <div className="w-52 border-l border-border overflow-y-auto p-3 flex flex-col gap-1.5 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-1">
          {t('draftPlan.teachers')}
        </p>
        <div className="border-t border-border mb-1" />
        {teachers.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('common.noItems')}</p>
        ) : (
          teachers.map(teacher => (
            <div
              key={teacher.teacherId}
              draggable={editable}
              onDragStart={e => e.dataTransfer.setData('id', String(teacher.teacherId))}
              className={`px-3 py-2 rounded text-sm border border-border select-none ${
                editable
                  ? 'cursor-grab active:cursor-grabbing hover:bg-accent'
                  : 'opacity-50 cursor-default'
              }`}
            >
              {teacher.firstName} {teacher.lastName}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
