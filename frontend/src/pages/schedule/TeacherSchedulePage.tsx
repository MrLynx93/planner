import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScheduleHeader } from '@/components/schedule/ScheduleHeader'
import { CalendarGrid } from '@/components/schedule/CalendarGrid'
import { getWeekStart, getWeekDays } from '@/components/schedule/utils'
import {
  useGetAnnexesQuery,
  useGetAnnexTeachersQuery,
  useGetAnnexTimeBlocksQuery,
} from '@/store/annexesApi'

export function TeacherSchedulePage() {
  const { t } = useTranslation()

  const [selectedAnnexId, setSelectedAnnexId] = useState<number | null>(null)
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))

  const { data: annexes = [], isLoading: annexesLoading } = useGetAnnexesQuery()
  const { data: teachers = [], isLoading: teachersLoading } = useGetAnnexTeachersQuery(
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

  // Auto-select first teacher when annex changes and teachers load
  useEffect(() => {
    if (teachers.length > 0 && selectedTeacherId === null) {
      setSelectedTeacherId(teachers[0].teacherId)
    }
  }, [teachers, selectedTeacherId])

  const handleAnnexChange = (id: number | null) => {
    setSelectedAnnexId(id)
    setSelectedTeacherId(null)
  }

  const currentAnnex = annexes.find(a => a.id === selectedAnnexId) ?? null
  const filteredBlocks = blocks.filter(b => b.teacherId === selectedTeacherId)
  const weekDays = getWeekDays(weekStart)

  const isLoading = annexesLoading || teachersLoading || blocksLoading

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
        filterItems={teachers.map(teacher => ({ id: teacher.teacherId, label: `${teacher.firstName} ${teacher.lastName}` }))}
        selectedFilterId={selectedTeacherId}
        onFilterChange={setSelectedTeacherId}
        filterPlaceholder={t('schedule.selectTeacher')}
        weekStart={weekStart}
        onWeekChange={setWeekStart}
      />
      {currentAnnex ? (
        <CalendarGrid
          blocks={filteredBlocks}
          annex={currentAnnex}
          weekDays={weekDays}
          colorBy="group"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
          {t('schedule.selectAnnex')}
        </div>
      )}
    </div>
  )
}
