import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScheduleHeader } from '@/components/schedule/ScheduleHeader'
import { CalendarGrid } from '@/components/schedule/CalendarGrid'
import { MonthCalendarGrid } from '@/components/schedule/MonthCalendarGrid'
import { getWeekStart, getWeekDays, getMonthStart, getMonthWeeks, blockDateStr } from '@/components/schedule/utils'
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
  const [monthDate, setMonthDate] = useState<Date>(() => getMonthStart(new Date()))
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
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
    { skip: selectedAnnexId === null || viewMode !== 'week' }
  )
  const { data: teachers = [] } = useGetAnnexTeachersQuery(selectedAnnexId!, { skip: selectedAnnexId === null })
  const { data: allBlocks = [] } = useGetAnnexTimeBlocksQuery(selectedAnnexId!, { skip: selectedAnnexId === null })
  const { data: exceptions = [] } = useGetExceptionsQuery(selectedAnnexId!, { skip: selectedAnnexId === null })

  const [createException] = useCreateExceptionMutation()

  // Month view: fetch up to 6 weeks (max weeks overlapping any month)
  const monthWeekStarts = useMemo(() => getMonthWeeks(monthDate), [monthDate])
  const skipMonth = (i: number) => selectedAnnexId === null || viewMode !== 'month' || i >= monthWeekStarts.length
  const mwStr = (i: number) => monthWeekStarts[i]?.toISOString().slice(0, 10) ?? ''
  const mw0 = useGetEffectiveScheduleQuery({ annexId: selectedAnnexId ?? 0, weekStart: mwStr(0) }, { skip: skipMonth(0) })
  const mw1 = useGetEffectiveScheduleQuery({ annexId: selectedAnnexId ?? 0, weekStart: mwStr(1) }, { skip: skipMonth(1) })
  const mw2 = useGetEffectiveScheduleQuery({ annexId: selectedAnnexId ?? 0, weekStart: mwStr(2) }, { skip: skipMonth(2) })
  const mw3 = useGetEffectiveScheduleQuery({ annexId: selectedAnnexId ?? 0, weekStart: mwStr(3) }, { skip: skipMonth(3) })
  const mw4 = useGetEffectiveScheduleQuery({ annexId: selectedAnnexId ?? 0, weekStart: mwStr(4) }, { skip: skipMonth(4) })
  const mw5 = useGetEffectiveScheduleQuery({ annexId: selectedAnnexId ?? 0, weekStart: mwStr(5) }, { skip: skipMonth(5) })

  const monthBlocksByDate = useMemo(() => {
    if (viewMode !== 'month') return new Map<string, ScheduleBlock[]>()
    const weekData = [mw0.data, mw1.data, mw2.data, mw3.data, mw4.data, mw5.data]
    const map = new Map<string, ScheduleBlock[]>()
    weekData.forEach((data, i) => {
      const ws = monthWeekStarts[i]
      if (!ws || !data) return
      for (const block of data) {
        if (selectedGroupId !== null && block.groupId !== selectedGroupId) continue
        const dateStr = blockDateStr(block, ws)
        if (!map.has(dateStr)) map.set(dateStr, [])
        map.get(dateStr)!.push(block)
      }
    })
    return map
  }, [viewMode, mw0.data, mw1.data, mw2.data, mw3.data, mw4.data, mw5.data, monthWeekStarts, selectedGroupId])

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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        monthDate={monthDate}
        onMonthChange={setMonthDate}
        showExceptions={showExceptions}
        onShowExceptionsChange={setShowExceptions}
      />
      {currentAnnex ? (
        viewMode === 'week' ? (
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
          <MonthCalendarGrid
            blocksByDate={monthBlocksByDate}
            monthDate={monthDate}
          />
        )
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
