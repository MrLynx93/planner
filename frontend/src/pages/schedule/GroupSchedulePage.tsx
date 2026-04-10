import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScheduleHeader } from '@/components/schedule/ScheduleHeader'
import { CalendarGrid } from '@/components/schedule/CalendarGrid'
import { getWeekStart, getWeekDays } from '@/components/schedule/utils'
import { useGetAnnexesQuery, useGetAnnexGroupsQuery, useGetAnnexTeachersQuery, useGetAnnexTimeBlocksQuery } from '@/store/annexesApi'
import { useGetEffectiveScheduleQuery, useCreateExceptionMutation, useGetExceptionsQuery } from '@/store/exceptionsApi'
import { ExceptionWizardDialog } from '@/components/exceptions/ExceptionWizardDialog'
import type { DayOfWeek, ExceptionReason, RemovedExceptionBlock, ScheduleBlock } from '@/components/schedule/types'

const DAY_OF_WEEK: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export function GroupSchedulePage() {
  const { t } = useTranslation()

  const [selectedAnnexId, setSelectedAnnexId] = useState<number | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [contextBlock, setContextBlock] = useState<ScheduleBlock | null>(null)
  const [showExceptions, setShowExceptions] = useState(false)

  const { data: annexes = [], isLoading: annexesLoading } = useGetAnnexesQuery()
  const { data: groups = [], isLoading: groupsLoading } = useGetAnnexGroupsQuery(
    selectedAnnexId!,
    { skip: selectedAnnexId === null }
  )
  const weekStartStr = weekStart.toISOString().slice(0, 10)
  const { data: blocks = [], isLoading: blocksLoading } = useGetEffectiveScheduleQuery(
    { annexId: selectedAnnexId!, weekStart: weekStartStr },
    { skip: selectedAnnexId === null }
  )
  const { data: teachers = [] } = useGetAnnexTeachersQuery(selectedAnnexId!, { skip: selectedAnnexId === null })
  const { data: allBlocks = [] } = useGetAnnexTimeBlocksQuery(selectedAnnexId!, { skip: selectedAnnexId === null })
  const { data: exceptions = [] } = useGetExceptionsQuery(selectedAnnexId!, { skip: selectedAnnexId === null })

  const [createException] = useCreateExceptionMutation()

  const weekDays = getWeekDays(weekStart)
  const weekDateSet = useMemo(() => new Set(weekDays.map(d => d.toISOString().slice(0, 10))), [weekDays])
  const allBlocksByTimeBlockId = useMemo(() => new Map(allBlocks.map(b => [b.timeBlockId, b])), [allBlocks])

  const exceptionReasonByTimeBlockId = useMemo((): Map<number, ExceptionReason> => {
    const map = new Map<number, ExceptionReason>()
    for (const ex of exceptions) {
      for (const m of ex.modifications) {
        if (m.type === 'ADD') map.set(m.timeBlockId, ex.reason)
      }
    }
    return map
  }, [exceptions])

  const removedExceptions = useMemo((): RemovedExceptionBlock[] =>
    exceptions.flatMap(ex =>
      ex.modifications
        .filter(m => m.type === 'REMOVE' && weekDateSet.has(m.date))
        .filter(m => allBlocksByTimeBlockId.get(m.timeBlockId)?.groupId === selectedGroupId)
        .map(m => ({
          id: m.id,
          dayOfWeek: DAY_OF_WEEK[new Date(m.date + 'T00:00:00').getDay()],
          startTime: m.startTime,
          endTime: m.endTime,
          teacherFirstName: m.teacherFirstName,
          teacherLastName: m.teacherLastName,
          groupName: m.groupName,
          reason: ex.reason,
        }))
    )
  , [exceptions, weekDateSet, allBlocksByTimeBlockId, selectedGroupId])

  // Auto-select first annex on load
  useEffect(() => {
    if (annexes.length > 0 && selectedAnnexId === null) {
      setSelectedAnnexId(annexes[0].id)
    }
  }, [annexes, selectedAnnexId])

  // Auto-select first group when annex changes and groups load
  useEffect(() => {
    if (groups.length > 0 && selectedGroupId === null) {
      setSelectedGroupId(groups[0].groupId)
    }
  }, [groups, selectedGroupId])

  const handleAnnexChange = (id: number | null) => {
    setSelectedAnnexId(id)
    setSelectedGroupId(null)
  }

  const currentAnnex = annexes.find(a => a.id === selectedAnnexId) ?? null
  const filteredBlocks = blocks.filter(b => b.groupId === selectedGroupId)

  const isLoading = annexesLoading || groupsLoading || blocksLoading

  if (isLoading && !currentAnnex) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScheduleHeader
        annexes={annexes}
        selectedAnnexId={selectedAnnexId}
        onAnnexChange={handleAnnexChange}
        filterItems={groups.map(g => ({ id: g.groupId, label: g.groupName }))}
        selectedFilterId={selectedGroupId}
        onFilterChange={setSelectedGroupId}
        filterPlaceholder={t('schedule.selectGroup')}
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        showExceptions={showExceptions}
        onShowExceptionsChange={setShowExceptions}
      />
      {currentAnnex ? (
        <CalendarGrid
          blocks={filteredBlocks}
          annex={currentAnnex}
          weekDays={weekDays}
          onBlockContextMenu={setContextBlock}
          showExceptions={showExceptions}
          exceptionReasonByTimeBlockId={exceptionReasonByTimeBlockId}
          removedExceptions={removedExceptions}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
          {t('schedule.selectAnnex')}
        </div>
      )}

      {selectedAnnexId && (
        <ExceptionWizardDialog
          open={contextBlock !== null}
          onClose={() => setContextBlock(null)}
          onSubmit={async req => {
            await createException({ annexId: selectedAnnexId, request: req }).unwrap()
          }}
          annexId={selectedAnnexId}
          teachers={teachers}
          allBlocks={allBlocks}
          preselectedBlock={contextBlock ?? undefined}
        />
      )}
    </div>
  )
}
