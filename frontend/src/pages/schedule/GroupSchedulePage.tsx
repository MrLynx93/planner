import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScheduleHeader } from '@/components/schedule/ScheduleHeader'
import { CalendarGrid } from '@/components/schedule/CalendarGrid'
import { getWeekStart, getWeekDays } from '@/components/schedule/utils'
import {
  useGetAnnexesQuery,
  useGetAnnexGroupsQuery,
  useGetAnnexTimeBlocksQuery,
} from '@/store/annexesApi'

export function GroupSchedulePage() {
  const { t } = useTranslation()

  const [selectedAnnexId, setSelectedAnnexId] = useState<number | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))

  const { data: annexes = [], isLoading: annexesLoading } = useGetAnnexesQuery()
  const { data: groups = [], isLoading: groupsLoading } = useGetAnnexGroupsQuery(
    selectedAnnexId!,
    { skip: selectedAnnexId === null }
  )
  const { data: blocks = [], isLoading: blocksLoading } = useGetAnnexTimeBlocksQuery(
    selectedAnnexId!,
    { skip: selectedAnnexId === null }
  )

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
  const weekDays = getWeekDays(weekStart)

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
        groups={groups}
        selectedGroupId={selectedGroupId}
        onGroupChange={setSelectedGroupId}
        weekStart={weekStart}
        onWeekChange={setWeekStart}
      />
      {currentAnnex ? (
        <CalendarGrid
          blocks={filteredBlocks}
          annex={currentAnnex}
          weekDays={weekDays}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
          {t('schedule.selectAnnex')}
        </div>
      )}
    </div>
  )
}
