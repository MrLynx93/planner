import { useState, useEffect } from 'react'
import { Dialog } from 'radix-ui'
import { X, Stethoscope, Plane, Briefcase, ArrowLeftRight, Clock, CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AnnexTeacherDto, ExceptionReason, ScheduleBlock } from '@/components/schedule/types'
import { TemplateBlockSelector, type SelectableBlock } from './TemplateBlockSelector'
import { formatTime } from '@/components/schedule/utils'
import type { CreateExceptionRequest, CreateModificationItemRequest } from '@/store/exceptionsApi'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (request: CreateExceptionRequest) => Promise<void>
  annexId: number
  teachers: AnnexTeacherDto[]
  allBlocks: ScheduleBlock[]
  /** Pre-selected block when opened via calendar right-click */
  preselectedBlock?: ScheduleBlock
}

const REASONS: { value: ExceptionReason; icon: React.ElementType; color: string }[] = [
  { value: 'SICK_LEAVE',          icon: Stethoscope,   color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'VACATION',            icon: Plane,          color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'DELEGATION',          icon: Briefcase,      color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'EXCHANGE',            icon: ArrowLeftRight, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'OVERTIME',            icon: Clock,          color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'SCHEDULE_ADJUSTMENT', icon: CalendarClock,  color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
]

function getWeekdayDates(from: string, to: string): string[] {
  const dates: string[] = []
  const current = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  while (current <= end) {
    const dow = current.getDay()
    if (dow >= 1 && dow <= 5) {
      dates.push(current.toISOString().slice(0, 10))
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// ─── Sub-forms ──────────────────────────────────────────────────────────────

interface AbsenceFormProps {
  reason: ExceptionReason
  teachers: AnnexTeacherDto[]
  allBlocks: ScheduleBlock[]
  preselectedBlock?: ScheduleBlock
  onSubmit: (mods: CreateModificationItemRequest[], title: string, note: string) => void
}

function AbsenceForm({ reason, teachers, allBlocks, preselectedBlock, onSubmit }: AbsenceFormProps) {
  const { t } = useTranslation()
  const today = new Date().toISOString().slice(0, 10)

  const [teacherId, setTeacherId] = useState<number | null>(
    preselectedBlock?.teacherId ?? (teachers[0]?.teacherId ?? null)
  )
  const [fromDate, setFromDate] = useState(preselectedBlock
    ? (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().slice(0, 10) })()
    : today
  )
  const [toDate, setToDate] = useState(fromDate)
  const [selected, setSelected] = useState<SelectableBlock[]>([])
  const [covers, setCovers] = useState<Record<string, { teacherId: number | null; startTime: string; endTime: string }>>({})
  const [note, setNote] = useState('')

  const teacherBlocks = allBlocks.filter(b => b.teacherId === teacherId && b.type === 'TEMPLATE')
  const dates = getWeekdayDates(fromDate, toDate)

  // Auto-select all blocks when teacher or dates change
  useEffect(() => {
    const allItems: SelectableBlock[] = []
    dates.forEach(date => {
      const dow = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][new Date(date + 'T00:00:00').getDay()]
      teacherBlocks.filter(b => b.dayOfWeek === dow).forEach(b => {
        allItems.push({ timeBlockId: b.timeBlockId, date, groupId: b.groupId, groupName: b.groupName, startTime: b.startTime, endTime: b.endTime })
      })
    })
    setSelected(allItems)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, fromDate, toDate])

  const toggleBlock = (block: SelectableBlock) => {
    setSelected(prev =>
      prev.some(s => s.timeBlockId === block.timeBlockId && s.date === block.date)
        ? prev.filter(s => !(s.timeBlockId === block.timeBlockId && s.date === block.date))
        : [...prev, block]
    )
  }

  const coverKey = (b: SelectableBlock) => `${b.timeBlockId}_${b.date}`

  const handleSubmit = () => {
    const mods: CreateModificationItemRequest[] = []
    selected.forEach(b => {
      mods.push({ type: 'REMOVE', timeBlockId: b.timeBlockId, date: b.date })
      const cover = covers[coverKey(b)]
      if (cover?.teacherId) {
        mods.push({ type: 'ADD', teacherId: cover.teacherId, groupId: b.groupId, date: b.date, startTime: cover.startTime, endTime: cover.endTime })
      }
    })
    const teacher = teachers.find(tc => tc.teacherId === teacherId)
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : ''
    const reasonLabel = t(`exceptions.reasons.${reason}`)
    const title = `${teacherName} – ${reasonLabel}${fromDate !== toDate ? ` (${fromDate} – ${toDate})` : ` (${fromDate})`}`
    onSubmit(mods, title, note)
  }

  const otherTeachers = teachers.filter(tc => tc.teacherId !== teacherId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.teacher')}</label>
          <select
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
            value={teacherId ?? ''}
            onChange={e => setTeacherId(Number(e.target.value))}
          >
            {teachers.map(tc => (
              <option key={tc.teacherId} value={tc.teacherId}>
                {tc.firstName} {tc.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.from')}</label>
          <input type="date" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" value={fromDate} onChange={e => { setFromDate(e.target.value); if (e.target.value > toDate) setToDate(e.target.value) }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.to')}</label>
          <input type="date" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)} />
        </div>
      </div>

      {dates.length > 0 && teacherBlocks.length > 0 ? (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">{t('exceptions.wizard.selectBlocks')}</div>
          <TemplateBlockSelector blocks={teacherBlocks} dates={dates} selected={selected} onToggle={toggleBlock} />

          {selected.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">{t('exceptions.wizard.assignCover')}</div>
              <div className="flex flex-col gap-2">
                {selected.map(b => {
                  const key = coverKey(b)
                  const cover = covers[key] ?? { teacherId: null, startTime: b.startTime, endTime: b.endTime }
                  return (
                    <div key={key} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                      <span className="w-24 shrink-0 text-muted-foreground">{b.date.slice(5)}</span>
                      <span className="w-24 shrink-0 font-medium">{b.groupName}</span>
                      <span className="w-28 shrink-0 text-muted-foreground">{formatTime(b.startTime)}–{formatTime(b.endTime)}</span>
                      <select
                        className="rounded border border-border bg-background px-1.5 py-1 text-xs"
                        value={cover.teacherId ?? ''}
                        onChange={e => setCovers(prev => ({ ...prev, [key]: { ...cover, teacherId: e.target.value ? Number(e.target.value) : null } }))}
                      >
                        <option value="">{t('exceptions.wizard.noCover')}</option>
                        {otherTeachers.map(tc => (
                          <option key={tc.teacherId} value={tc.teacherId}>{tc.firstName} {tc.lastName}</option>
                        ))}
                      </select>
                      {cover.teacherId && (
                        <>
                          <input type="time" className="rounded border border-border bg-background px-1 py-1 text-xs" value={cover.startTime.slice(0, 5)} onChange={e => setCovers(prev => ({ ...prev, [key]: { ...cover, startTime: e.target.value + ':00' } }))} />
                          <span className="text-muted-foreground">–</span>
                          <input type="time" className="rounded border border-border bg-background px-1 py-1 text-xs" value={cover.endTime.slice(0, 5)} onChange={e => setCovers(prev => ({ ...prev, [key]: { ...cover, endTime: e.target.value + ':00' } }))} />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : dates.length > 0 ? (
        <p className="text-sm text-muted-foreground">{t('exceptions.wizard.noBlocksForTeacher')}</p>
      ) : null}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.note')}</label>
        <textarea className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm resize-none" rows={2} value={note} onChange={e => setNote(e.target.value)} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={selected.length === 0}
        className="self-end rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
      >
        {t('common.save')}
      </button>
    </div>
  )
}

interface ExchangeFormProps {
  teachers: AnnexTeacherDto[]
  allBlocks: ScheduleBlock[]
  preselectedBlock?: ScheduleBlock
  onSubmit: (mods: CreateModificationItemRequest[], title: string, note: string) => void
}

function ExchangeForm({ teachers, allBlocks, preselectedBlock, onSubmit }: ExchangeFormProps) {
  const { t } = useTranslation()
  const today = new Date().toISOString().slice(0, 10)

  const [teacherAId, setTeacherAId] = useState<number | null>(preselectedBlock?.teacherId ?? (teachers[0]?.teacherId ?? null))
  const [dateA, setDateA] = useState(today)
  const [blockAId, setBlockAId] = useState<number | null>(preselectedBlock?.timeBlockId ?? null)

  const [teacherBId, setTeacherBId] = useState<number | null>(teachers[1]?.teacherId ?? null)
  const [dateB, setDateB] = useState(today)
  const [blockBId, setBlockBId] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const dowA = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][new Date(dateA + 'T00:00:00').getDay()]
  const dowB = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][new Date(dateB + 'T00:00:00').getDay()]

  const blocksA = allBlocks.filter(b => b.teacherId === teacherAId && b.type === 'TEMPLATE' && b.dayOfWeek === dowA)
  const blocksB = allBlocks.filter(b => b.teacherId === teacherBId && b.type === 'TEMPLATE' && b.dayOfWeek === dowB)

  const blockA = blocksA.find(b => b.timeBlockId === blockAId) ?? blocksA[0] ?? null
  const blockB = blocksB.find(b => b.timeBlockId === blockBId) ?? blocksB[0] ?? null

  const handleSubmit = () => {
    if (!blockA || !blockB) return
    const teacherA = teachers.find(t => t.teacherId === teacherAId)!
    const teacherB = teachers.find(t => t.teacherId === teacherBId)!
    const mods: CreateModificationItemRequest[] = [
      { type: 'REMOVE', timeBlockId: blockA.timeBlockId, date: dateA },
      { type: 'REMOVE', timeBlockId: blockB.timeBlockId, date: dateB },
      { type: 'ADD', teacherId: teacherBId!, groupId: blockA.groupId, date: dateA, startTime: blockA.startTime, endTime: blockA.endTime },
      { type: 'ADD', teacherId: teacherAId!, groupId: blockB.groupId, date: dateB, startTime: blockB.startTime, endTime: blockB.endTime },
    ]
    const title = `${teacherA.firstName} ${teacherA.lastName} ↔ ${teacherB.firstName} ${teacherB.lastName}`
    onSubmit(mods, title, note)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Teacher A */}
        <div className="flex flex-col gap-2 rounded-md border border-border p-3">
          <div className="text-xs font-semibold uppercase text-muted-foreground">{t('exceptions.wizard.teacherA')}</div>
          <select className="rounded border border-border bg-background px-2 py-1 text-sm" value={teacherAId ?? ''} onChange={e => { setTeacherAId(Number(e.target.value)); setBlockAId(null) }}>
            {teachers.map(tc => <option key={tc.teacherId} value={tc.teacherId}>{tc.firstName} {tc.lastName}</option>)}
          </select>
          <input type="date" className="rounded border border-border bg-background px-2 py-1 text-sm" value={dateA} onChange={e => setDateA(e.target.value)} />
          {blocksA.length > 0 ? (
            <select className="rounded border border-border bg-background px-2 py-1 text-sm" value={blockAId ?? blocksA[0]?.timeBlockId ?? ''} onChange={e => setBlockAId(Number(e.target.value))}>
              {blocksA.map(b => <option key={b.timeBlockId} value={b.timeBlockId}>{b.groupName} {formatTime(b.startTime)}–{formatTime(b.endTime)}</option>)}
            </select>
          ) : (
            <p className="text-xs text-muted-foreground">{t('exceptions.wizard.noBlocksOnDay')}</p>
          )}
        </div>

        {/* Teacher B */}
        <div className="flex flex-col gap-2 rounded-md border border-border p-3">
          <div className="text-xs font-semibold uppercase text-muted-foreground">{t('exceptions.wizard.teacherB')}</div>
          <select className="rounded border border-border bg-background px-2 py-1 text-sm" value={teacherBId ?? ''} onChange={e => { setTeacherBId(Number(e.target.value)); setBlockBId(null) }}>
            {teachers.map(tc => <option key={tc.teacherId} value={tc.teacherId}>{tc.firstName} {tc.lastName}</option>)}
          </select>
          <input type="date" className="rounded border border-border bg-background px-2 py-1 text-sm" value={dateB} onChange={e => setDateB(e.target.value)} />
          {blocksB.length > 0 ? (
            <select className="rounded border border-border bg-background px-2 py-1 text-sm" value={blockBId ?? blocksB[0]?.timeBlockId ?? ''} onChange={e => setBlockBId(Number(e.target.value))}>
              {blocksB.map(b => <option key={b.timeBlockId} value={b.timeBlockId}>{b.groupName} {formatTime(b.startTime)}–{formatTime(b.endTime)}</option>)}
            </select>
          ) : (
            <p className="text-xs text-muted-foreground">{t('exceptions.wizard.noBlocksOnDay')}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.note')}</label>
        <textarea className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm resize-none" rows={2} value={note} onChange={e => setNote(e.target.value)} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!blockA || !blockB}
        className="self-end rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
      >
        {t('common.save')}
      </button>
    </div>
  )
}

interface OvertimeFormProps {
  teachers: AnnexTeacherDto[]
  allBlocks: ScheduleBlock[]
  onSubmit: (mods: CreateModificationItemRequest[], title: string, note: string) => void
}

function OvertimeForm({ teachers, allBlocks, onSubmit }: OvertimeFormProps) {
  const { t } = useTranslation()
  const today = new Date().toISOString().slice(0, 10)

  const [teacherId, setTeacherId] = useState<number | null>(teachers[0]?.teacherId ?? null)
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')

  // Infer unique groups from annex blocks
  const groups = Array.from(new Map(allBlocks.map(b => [b.groupId, { id: b.groupId, name: b.groupName }])).values())
  const [groupId, setGroupId] = useState<number | null>(groups[0]?.id ?? null)
  const [startTime, setStartTime] = useState('07:00')
  const [endTime, setEndTime] = useState('08:00')

  const handleSubmit = () => {
    if (!teacherId || !groupId) return
    const teacher = teachers.find(tc => tc.teacherId === teacherId)!
    const group = groups.find(g => g.id === groupId)!
    const mods: CreateModificationItemRequest[] = [
      { type: 'ADD', teacherId, groupId, date, startTime: startTime + ':00', endTime: endTime + ':00' },
    ]
    const title = `${teacher.firstName} ${teacher.lastName} – ${t('exceptions.reasons.OVERTIME')} (${date})`
    onSubmit(mods, title, note)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.teacher')}</label>
          <select className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" value={teacherId ?? ''} onChange={e => setTeacherId(Number(e.target.value))}>
            {teachers.map(tc => <option key={tc.teacherId} value={tc.teacherId}>{tc.firstName} {tc.lastName}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.date')}</label>
          <input type="date" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.group')}</label>
          <select className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" value={groupId ?? ''} onChange={e => setGroupId(Number(e.target.value))}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.startTime')}</label>
          <input type="time" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.endTime')}</label>
          <input type="time" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.note')}</label>
        <textarea className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm resize-none" rows={2} value={note} onChange={e => setNote(e.target.value)} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!teacherId || !groupId}
        className="self-end rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
      >
        {t('common.save')}
      </button>
    </div>
  )
}

interface ScheduleAdjustmentFormProps {
  teachers: AnnexTeacherDto[]
  allBlocks: ScheduleBlock[]
  preselectedBlock?: ScheduleBlock
  onSubmit: (mods: CreateModificationItemRequest[], title: string, note: string) => void
}

function ScheduleAdjustmentForm({ teachers, allBlocks, preselectedBlock, onSubmit }: ScheduleAdjustmentFormProps) {
  const { t } = useTranslation()
  const today = new Date().toISOString().slice(0, 10)

  const [teacherId, setTeacherId] = useState<number | null>(preselectedBlock?.teacherId ?? (teachers[0]?.teacherId ?? null))
  const [date, setDate] = useState(today)
  const [selected, setSelected] = useState<SelectableBlock[]>([])
  const [newTimes, setNewTimes] = useState<Record<string, { startTime: string; endTime: string }>>({})
  const [note, setNote] = useState('')

  const teacherBlocks = allBlocks.filter(b => b.teacherId === teacherId && b.type === 'TEMPLATE')
  const dates = date ? [date] : []

  useEffect(() => { setSelected([]) }, [teacherId, date])

  const toggleBlock = (block: SelectableBlock) => {
    setSelected(prev =>
      prev.some(s => s.timeBlockId === block.timeBlockId && s.date === block.date)
        ? prev.filter(s => !(s.timeBlockId === block.timeBlockId && s.date === block.date))
        : [...prev, block]
    )
  }

  const key = (b: SelectableBlock) => `${b.timeBlockId}_${b.date}`

  const handleSubmit = () => {
    if (selected.length === 0) return
    const mods: CreateModificationItemRequest[] = []
    selected.forEach(b => {
      const times = newTimes[key(b)] ?? { startTime: b.startTime, endTime: b.endTime }
      mods.push({ type: 'REMOVE', timeBlockId: b.timeBlockId, date: b.date })
      mods.push({ type: 'ADD', teacherId: teacherId!, groupId: b.groupId, date: b.date, startTime: times.startTime, endTime: times.endTime })
    })
    const teacher = teachers.find(tc => tc.teacherId === teacherId)
    const title = `${teacher?.firstName} ${teacher?.lastName} – ${t('exceptions.reasons.SCHEDULE_ADJUSTMENT')} (${date})`
    onSubmit(mods, title, note)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.teacher')}</label>
          <select className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" value={teacherId ?? ''} onChange={e => setTeacherId(Number(e.target.value))}>
            {teachers.map(tc => <option key={tc.teacherId} value={tc.teacherId}>{tc.firstName} {tc.lastName}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.date')}</label>
          <input type="date" className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {dates.length > 0 && (
        <>
          <TemplateBlockSelector blocks={teacherBlocks} dates={dates} selected={selected} onToggle={toggleBlock} />

          {selected.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">{t('exceptions.wizard.newTimes')}</div>
              <div className="flex flex-col gap-2">
                {selected.map(b => {
                  const k = key(b)
                  const times = newTimes[k] ?? { startTime: b.startTime.slice(0, 5), endTime: b.endTime.slice(0, 5) }
                  return (
                    <div key={k} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                      <span className="w-24 font-medium">{b.groupName}</span>
                      <span className="text-xs text-muted-foreground">{t('exceptions.wizard.originalTime')}: {formatTime(b.startTime)}–{formatTime(b.endTime)}</span>
                      <span className="ml-auto flex items-center gap-1">
                        <input type="time" className="rounded border border-border bg-background px-1 py-1 text-xs" value={times.startTime} onChange={e => setNewTimes(prev => ({ ...prev, [k]: { ...times, startTime: e.target.value } }))} />
                        <span>–</span>
                        <input type="time" className="rounded border border-border bg-background px-1 py-1 text-xs" value={times.endTime} onChange={e => setNewTimes(prev => ({ ...prev, [k]: { ...times, endTime: e.target.value } }))} />
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{t('exceptions.wizard.note')}</label>
        <textarea className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm resize-none" rows={2} value={note} onChange={e => setNote(e.target.value)} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={selected.length === 0}
        className="self-end rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
      >
        {t('common.save')}
      </button>
    </div>
  )
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

export function ExceptionWizardDialog({ open, onClose, onSubmit, teachers, allBlocks, preselectedBlock }: Props) {
  const { t } = useTranslation()
  const [reason, setReason] = useState<ExceptionReason | null>(null)

  const handleClose = () => { setReason(null); onClose() }

  const handleSubmit = async (mods: CreateModificationItemRequest[], title: string, note: string) => {
    if (!reason) return
    await onSubmit({ title, reason, note, modifications: mods })
    handleClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={open => { if (!open) handleClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[85vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold">
              {reason
                ? t(`exceptions.reasons.${reason}`)
                : t('exceptions.wizard.chooseReason')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 hover:bg-accent" aria-label={t('common.cancel')}>
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {!reason ? (
            <div className="grid grid-cols-3 gap-3">
              {REASONS.map(r => {
                const Icon = r.icon
                return (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-colors hover:opacity-80 ${r.color}`}
                  >
                    <Icon className="h-6 w-6" />
                    {t(`exceptions.reasons.${r.value}`)}
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <button onClick={() => setReason(null)} className="mb-4 text-xs text-muted-foreground hover:text-foreground">
                ← {t('exceptions.wizard.back')}
              </button>

              {(reason === 'SICK_LEAVE' || reason === 'VACATION' || reason === 'DELEGATION') && (
                <AbsenceForm reason={reason} teachers={teachers} allBlocks={allBlocks} preselectedBlock={preselectedBlock} onSubmit={handleSubmit} />
              )}
              {reason === 'EXCHANGE' && (
                <ExchangeForm teachers={teachers} allBlocks={allBlocks} preselectedBlock={preselectedBlock} onSubmit={handleSubmit} />
              )}
              {reason === 'OVERTIME' && (
                <OvertimeForm teachers={teachers} allBlocks={allBlocks} onSubmit={handleSubmit} />
              )}
              {reason === 'SCHEDULE_ADJUSTMENT' && (
                <ScheduleAdjustmentForm teachers={teachers} allBlocks={allBlocks} preselectedBlock={preselectedBlock} onSubmit={handleSubmit} />
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
