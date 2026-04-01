import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AnnexDto, DayOfWeek } from '@/components/schedule/types'
import { WEEK_DAYS } from '@/components/schedule/utils'
import { DraftCalendarGrid } from '@/components/schedule/DraftCalendarGrid'
import { OverviewWeekGrid } from '@/components/schedule/OverviewWeekGrid'
import {
  useGetAnnexGroupsQuery,
  useGetAnnexTeachersQuery,
  useGetAnnexTimeBlocksQuery,
  useCreateAnnexTimeBlockMutation,
  useUpdateAnnexTimeBlockMutation,
  useDeleteAnnexTimeBlockMutation,
} from '@/store/annexesApi'
import { cn } from '@/lib/utils'

type Mode = 'day' | 'week'

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
}

export function AnnexPlanOverviewPage() {
  const { t } = useTranslation()
  const annex = useOutletContext<AnnexDto>()
  const annexId = annex.id!
  const editable = annex.state === 'DRAFT'

  const { data: groups = [] } = useGetAnnexGroupsQuery(annexId)
  const { data: teachers = [] } = useGetAnnexTeachersQuery(annexId)
  const { data: allBlocks = [] } = useGetAnnexTimeBlocksQuery(annexId)

  const [mode, setMode] = useState<Mode>('day')
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY')

  const [createTimeBlock] = useCreateAnnexTimeBlockMutation()
  const [updateTimeBlock] = useUpdateAnnexTimeBlockMutation()
  const [deleteTimeBlock] = useDeleteAnnexTimeBlockMutation()

  const currentDayIndex = WEEK_DAYS.indexOf(selectedDay)

  const handlePrevDay = () => {
    if (currentDayIndex > 0) setSelectedDay(WEEK_DAYS[currentDayIndex - 1])
  }

  const handleNextDay = () => {
    if (currentDayIndex < WEEK_DAYS.length - 1) setSelectedDay(WEEK_DAYS[currentDayIndex + 1])
  }

  const handleDrop = (day: DayOfWeek, _startTime: string, teacherId: number, columnGroupId?: number) => {
    if (!columnGroupId) return
    const alreadyExists = allBlocks.some(
      b => b.teacherId === teacherId && b.groupId === columnGroupId && b.dayOfWeek === day,
    )
    if (alreadyExists) return
    createTimeBlock({
      annexId,
      dto: { teacherId, groupId: columnGroupId, dayOfWeek: day, startTime: annex.scheduleStartTime, endTime: annex.scheduleEndTime, type: 'TEMPLATE' },
    })
  }

  return (
    <div className="h-full flex min-h-0">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-4 shrink-0">
          {/* Mode toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors',
                mode === 'day'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent',
              )}
              onClick={() => setMode('day')}
            >
              {t('draftPlan.dayMode')}
            </button>
            <button
              className={cn(
                'px-3 py-1.5 text-sm font-medium border-l border-border transition-colors',
                mode === 'week'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent',
              )}
              onClick={() => setMode('week')}
            >
              {t('draftPlan.weekMode')}
            </button>
          </div>

          {/* Day navigation (day mode only) */}
          {mode === 'day' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                disabled={currentDayIndex === 0}
                className="p-1 rounded text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1">
                {WEEK_DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                      day === selectedDay
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
              <button
                onClick={handleNextDay}
                disabled={currentDayIndex === WEEK_DAYS.length - 1}
                className="p-1 rounded text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {mode === 'day' ? (
          <DraftCalendarGrid
            blocks={allBlocks}
            colorBy="teacher"
            editable={editable}
            xAxis="groups"
            groups={groups}
            selectedDay={selectedDay}
            onDropItem={handleDrop}
            onResizeBlock={(id, start, end) =>
              updateTimeBlock({ annexId, annexTimeBlockId: id, startTime: start, endTime: end })
            }
            onDeleteBlock={id => deleteTimeBlock({ annexId, annexTimeBlockId: id })}
          />
        ) : (
          <OverviewWeekGrid
            blocks={allBlocks}
            groups={groups}
            editable={editable}
            onResizeBlock={(id, start, end) =>
              updateTimeBlock({ annexId, annexTimeBlockId: id, startTime: start, endTime: end })
            }
            onDeleteBlock={id => deleteTimeBlock({ annexId, annexTimeBlockId: id })}
          />
        )}
      </div>

      {/* Right panel: teachers */}
      <div className="w-52 border-l border-border overflow-y-auto p-3 flex flex-col gap-1.5 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-1">
          {t('draftPlan.teachers')}
        </p>
        <div className="border-t border-border mb-1" />
        {mode === 'week' && (
          <p className="text-xs text-muted-foreground italic mb-1">{t('draftPlan.dragDisabledInWeekMode')}</p>
        )}
        {teachers.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('common.noItems')}</p>
        ) : (
          teachers.map(teacher => (
            <div
              key={teacher.teacherId}
              draggable={editable && mode === 'day'}
              onDragStart={e => e.dataTransfer.setData('id', String(teacher.teacherId))}
              className={cn(
                'px-3 py-2 rounded text-sm border border-border select-none',
                editable && mode === 'day'
                  ? 'cursor-grab active:cursor-grabbing hover:bg-accent'
                  : 'opacity-50 cursor-default',
              )}
            >
              {teacher.firstName} {teacher.lastName}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
