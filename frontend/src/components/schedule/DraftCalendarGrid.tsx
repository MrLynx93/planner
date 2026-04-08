import { useState, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import type { AnnexGroupDto, DayOfWeek, ScheduleBlock } from './types'
import {
  WEEK_DAYS,
  hoursRange,
  totalGridHeight,
  timeToMinutes,
  minutesToTime,
  HOUR_HEIGHT_PX,
  timeToTop,
  blockHeight,
  formatTime,
} from './utils'
import { getColorForId } from './colors'

const DISPLAY_START = '06:00'
const DISPLAY_END = '20:00'

function assignColumns(
  blocks: ScheduleBlock[],
): Map<number, { columnIndex: number; columnCount: number }> {
  const sorted = [...blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  )
  const columnEnds: number[] = []
  const colOf = new Map<number, number>()
  for (const block of sorted) {
    const start = timeToMinutes(block.startTime)
    const end = timeToMinutes(block.endTime)
    let col = columnEnds.findIndex(e => e <= start)
    if (col === -1) col = columnEnds.length
    columnEnds[col] = end
    colOf.set(block.id, col)
  }
  const result = new Map<number, { columnIndex: number; columnCount: number }>()
  for (const block of sorted) {
    const start = timeToMinutes(block.startTime)
    const end = timeToMinutes(block.endTime)
    const overlapping = sorted.filter(
      b => timeToMinutes(b.startTime) < end && start < timeToMinutes(b.endTime),
    )
    const columnCount = Math.max(...overlapping.map(b => colOf.get(b.id)!)) + 1
    result.set(block.id, { columnIndex: colOf.get(block.id)!, columnCount })
  }
  return result
}

interface ResizeState {
  blockId: number
  handle: 'top' | 'bottom'
  startY: number
  originalStartMinutes: number
  originalEndMinutes: number
  currentStart: string
  currentEnd: string
}

export interface DraftCalendarGridProps {
  blocks: ScheduleBlock[]
  colorBy?: 'teacher' | 'group'
  editable?: boolean
  xAxis: 'days' | 'groups'
  groups?: AnnexGroupDto[]
  selectedDay?: DayOfWeek
  onDropItem: (
    dayOfWeek: DayOfWeek,
    startTime: string,
    droppedId: number,
    columnGroupId?: number,
  ) => void
  onResizeBlock: (blockId: number, newStart: string, newEnd: string) => void
  onDeleteBlock: (blockId: number) => void
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
}

export function DraftCalendarGrid({
  blocks,
  colorBy = 'teacher',
  editable = false,
  xAxis,
  groups = [],
  selectedDay = 'MONDAY',
  onDropItem,
  onResizeBlock,
  onDeleteBlock,
}: DraftCalendarGridProps) {
  const hours = hoursRange(DISPLAY_START, DISPLAY_END)
  const openingHour = Math.floor(timeToMinutes(DISPLAY_START) / 60)
  const gridHeight = totalGridHeight(DISPLAY_START, DISPLAY_END)

  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [resizePreview, setResizePreview] = useState<
    Map<number, { startTime: string; endTime: string }>
  >(new Map())
  const resizeRef = useRef<ResizeState | null>(null)

  type Column =
    | { key: string; label: string; day: DayOfWeek; groupId?: undefined }
    | { key: string; label: string; day: DayOfWeek; groupId: number }

  const columns: Column[] =
    xAxis === 'days'
      ? WEEK_DAYS.map(day => ({ key: day, label: DAY_LABELS[day], day }))
      : groups.map(g => ({
          key: String(g.groupId),
          label: g.groupName,
          day: selectedDay,
          groupId: g.groupId,
        }))

  const getBlocksForColumn = (col: Column): ScheduleBlock[] => {
    if (xAxis === 'days') {
      return blocks.filter(b => b.dayOfWeek === col.day)
    }
    return blocks.filter(b => b.dayOfWeek === selectedDay && b.groupId === col.groupId)
  }

  const computeDropTime = (e: React.DragEvent, colEl: HTMLDivElement): string => {
    const rect = colEl.getBoundingClientRect()
    const y = e.clientY - rect.top
    const rawMinutes = (y / HOUR_HEIGHT_PX) * 60 + timeToMinutes(DISPLAY_START)
    const snapped = Math.round(rawMinutes / 15) * 15
    const clamped = Math.max(
      timeToMinutes(DISPLAY_START),
      Math.min(timeToMinutes(DISPLAY_END) - 60, snapped),
    )
    return minutesToTime(clamped)
  }

  const startResize = useCallback(
    (e: React.MouseEvent, block: ScheduleBlock, handle: 'top' | 'bottom') => {
      e.preventDefault()
      e.stopPropagation()
      const state: ResizeState = {
        blockId: block.id,
        handle,
        startY: e.clientY,
        originalStartMinutes: timeToMinutes(block.startTime),
        originalEndMinutes: timeToMinutes(block.endTime),
        currentStart: block.startTime,
        currentEnd: block.endTime,
      }
      resizeRef.current = state

      const onMouseMove = (ev: MouseEvent) => {
        const s = resizeRef.current!
        const deltaY = ev.clientY - s.startY
        const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT_PX) * 60 / 15) * 15

        let newStartMinutes = s.originalStartMinutes
        let newEndMinutes = s.originalEndMinutes

        if (handle === 'bottom') {
          newEndMinutes = Math.max(s.originalStartMinutes + 15, s.originalEndMinutes + deltaMinutes)
          newEndMinutes = Math.min(timeToMinutes(DISPLAY_END), newEndMinutes)
        } else {
          newStartMinutes = Math.min(
            s.originalEndMinutes - 15,
            s.originalStartMinutes + deltaMinutes,
          )
          newStartMinutes = Math.max(timeToMinutes(DISPLAY_START), newStartMinutes)
        }

        s.currentStart = minutesToTime(newStartMinutes)
        s.currentEnd = minutesToTime(newEndMinutes)

        setResizePreview(
          prev => new Map(prev).set(s.blockId, { startTime: s.currentStart, endTime: s.currentEnd }),
        )
      }

      const onMouseUp = () => {
        const s = resizeRef.current!
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        setResizePreview(prev => {
          const m = new Map(prev)
          m.delete(s.blockId)
          return m
        })
        onResizeBlock(s.blockId, s.currentStart, s.currentEnd)
        resizeRef.current = null
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [onResizeBlock],
  )

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <div className="m-8 min-w-[400px] border border-gray-400 rounded">
        {/* Header */}
        <div className="sticky top-0 z-10 flex bg-background border-b border-gray-400">
          <div className="w-12 shrink-0" />
          {columns.map(col => (
            <div
              key={col.key}
              className="flex-1 border-l border-gray-500 px-2 py-2 text-center"
            >
              <div className="text-sm font-medium truncate">{col.label}</div>
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="flex" style={{ height: gridHeight }}>
          {/* Time axis */}
          <div className="w-12 shrink-0 relative">
            {hours.slice(0, -1).map((h, i) => (
              <div
                key={h}
                className="absolute right-2 text-xs text-muted-foreground select-none"
                style={{
                  top: (h - openingHour) * HOUR_HEIGHT_PX,
                  transform: i === 0 ? undefined : 'translateY(-50%)',
                }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Columns */}
          {columns.length === 0 && (
            <div className="flex-1 relative border-l border-gray-500">
              {hours.map(h => (
                <div
                  key={h}
                  className="absolute w-full border-t border-gray-300 z-10 pointer-events-none"
                  style={{ top: (h - openingHour) * HOUR_HEIGHT_PX }}
                />
              ))}
            </div>
          )}
          {columns.map(col => {
            const colBlocks = getBlocksForColumn(col)
            const colAssignment = assignColumns(colBlocks)
            return (
              <div
                key={col.key}
                className={`flex-1 relative border-l border-gray-500 transition-colors ${
                  editable && dragOverColumn === col.key ? 'bg-blue-50' : ''
                }`}
                onDragOver={
                  editable
                    ? e => {
                        e.preventDefault()
                        setDragOverColumn(col.key)
                      }
                    : undefined
                }
                onDragLeave={editable ? () => setDragOverColumn(null) : undefined}
                onDrop={
                  editable
                    ? e => {
                        e.preventDefault()
                        setDragOverColumn(null)
                        const droppedId = parseInt(e.dataTransfer.getData('id'))
                        const startTime = computeDropTime(e, e.currentTarget as HTMLDivElement)
                        onDropItem(col.day, startTime, droppedId, col.groupId)
                      }
                    : undefined
                }
              >
                {/* Hour lines */}
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-gray-300 z-10 pointer-events-none"
                    style={{ top: (h - openingHour) * HOUR_HEIGHT_PX }}
                  />
                ))}

                {/* Blocks */}
                {colBlocks.map(block => {
                  const preview = resizePreview.get(block.id)
                  const displayStart = preview?.startTime ?? block.startTime
                  const displayEnd = preview?.endTime ?? block.endTime

                  const color = getColorForId(
                    colorBy === 'group' ? block.groupId : block.teacherId,
                  )
                  const top = timeToTop(displayStart, DISPLAY_START)
                  const height = blockHeight(displayStart, displayEnd)
                  const layout = colAssignment.get(block.id)!
                  const leftPct = (layout.columnIndex / layout.columnCount) * 100
                  const widthPct = (1 / layout.columnCount) * 100

                  return (
                    <div
                      key={block.id}
                      className="absolute rounded group/block"
                      style={{
                        left: `calc(${leftPct}% + 1px)`,
                        width: `calc(${widthPct}% - 2px)`,
                        top: top + 1,
                        height: Math.max(height - 2, 20),
                        backgroundColor: color.bg,
                        borderLeft: `3px solid ${color.border}`,
                        zIndex: preview ? 20 : 15,
                      }}
                    >
                      {/* Content */}
                      <div className="relative z-20 px-1.5 py-0.5 overflow-hidden h-full select-none pointer-events-none">
                        <p
                          className="text-xs font-semibold leading-tight truncate"
                          style={{ color: color.text }}
                        >
                          {colorBy === 'group'
                            ? block.groupName
                            : `${block.teacherFirstName} ${block.teacherLastName}`}
                        </p>
                        {height >= 32 && (
                          <p
                            className="text-xs leading-tight truncate opacity-80"
                            style={{ color: color.text }}
                          >
                            {formatTime(displayStart)}–{formatTime(displayEnd)}
                          </p>
                        )}
                      </div>

                      {editable && (
                        <>
                          {/* Delete button */}
                          <button
                            className="absolute top-0.5 right-0.5 z-30 opacity-0 group-hover/block:opacity-100 transition-opacity rounded-full bg-white/80 hover:bg-red-100 p-0.5"
                            onClick={e => {
                              e.stopPropagation()
                              onDeleteBlock(block.id)
                            }}
                          >
                            <X className="h-3 w-3 text-red-500" />
                          </button>

                          {/* Top resize handle */}
                          <div
                            className="absolute top-0 left-0 right-0 h-2 cursor-n-resize z-30"
                            onMouseDown={e => startResize(e, block, 'top')}
                          />
                          {/* Bottom resize handle */}
                          <div
                            className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize z-30"
                            onMouseDown={e => startResize(e, block, 'bottom')}
                          />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
