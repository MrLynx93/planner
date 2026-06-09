import { useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { ScheduleBlock } from './types';
import { timeToMinutes, formatTime, minutesToTime } from './utils';
import { getColorForId } from './colors';

interface ResizeState {
  blockId: number;
  handle: 'left' | 'right';
  startX: number;
  originalStartMinutes: number;
  originalEndMinutes: number;
  currentStart: string;
  currentEnd: string;
}

interface HorizontalTimeCellProps {
  blocks: ScheduleBlock[];
  scheduleStart: string;
  scheduleEnd: string;
  editable?: boolean;
  onResizeBlock?: (blockId: number, newStart: string, newEnd: string) => void;
  onDeleteBlock?: (blockId: number) => void;
  onEditBlock?: (block: ScheduleBlock) => void;
  onBlockMouseMove?: (e: React.MouseEvent, block: ScheduleBlock) => void;
  onBlockMouseLeave?: () => void;
}

export function HorizontalTimeCell({
  blocks,
  scheduleStart,
  scheduleEnd,
  editable = false,
  onResizeBlock,
  onDeleteBlock,
  onEditBlock,
  onBlockMouseMove,
  onBlockMouseLeave,
}: HorizontalTimeCellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const didResizeRef = useRef(false);
  const [resizePreview, setResizePreview] = useState<Map<number, { startTime: string; endTime: string }>>(new Map());

  const totalMinutes = timeToMinutes(scheduleEnd) - timeToMinutes(scheduleStart);
  const startMinutes = timeToMinutes(scheduleStart);
  const endMinutes = timeToMinutes(scheduleEnd);

  const startResize = useCallback(
    (e: React.MouseEvent, block: ScheduleBlock, handle: 'left' | 'right') => {
      e.preventDefault();
      e.stopPropagation();
      didResizeRef.current = true;
      const containerWidth = containerRef.current!.getBoundingClientRect().width;

      const state: ResizeState = {
        blockId: block.id,
        handle,
        startX: e.clientX,
        originalStartMinutes: timeToMinutes(block.startTime),
        originalEndMinutes: timeToMinutes(block.endTime),
        currentStart: block.startTime,
        currentEnd: block.endTime,
      };
      resizeRef.current = state;

      const onMouseMove = (ev: MouseEvent) => {
        const s = resizeRef.current!;
        const deltaX = ev.clientX - s.startX;
        const deltaMinutes = Math.round(((deltaX / containerWidth) * totalMinutes) / 15) * 15;

        let newStart = s.originalStartMinutes;
        let newEnd = s.originalEndMinutes;

        if (handle === 'left') {
          newStart = Math.min(s.originalEndMinutes - 15, s.originalStartMinutes + deltaMinutes);
          newStart = Math.max(startMinutes, newStart);
        } else {
          newEnd = Math.max(s.originalStartMinutes + 15, s.originalEndMinutes + deltaMinutes);
          newEnd = Math.min(endMinutes, newEnd);
        }

        s.currentStart = minutesToTime(newStart);
        s.currentEnd = minutesToTime(newEnd);
        setResizePreview((prev) => new Map(prev).set(s.blockId, { startTime: s.currentStart, endTime: s.currentEnd }));
      };

      const onMouseUp = () => {
        const s = resizeRef.current!;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        setResizePreview((prev) => { const m = new Map(prev); m.delete(s.blockId); return m; });
        onResizeBlock?.(s.blockId, s.currentStart, s.currentEnd);
        resizeRef.current = null;
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [onResizeBlock, totalMinutes, startMinutes, endMinutes]
  );

  return (
    <div ref={containerRef} className="relative h-9 rounded">
      {blocks.map((block) => {
        const preview = resizePreview.get(block.id);
        const displayStart = preview?.startTime ?? block.startTime;
        const displayEnd = preview?.endTime ?? block.endTime;

        const blockStart = timeToMinutes(displayStart);
        const blockEnd = timeToMinutes(displayEnd);
        const leftPct = ((blockStart - startMinutes) / totalMinutes) * 100;
        const widthPct = ((blockEnd - blockStart) / totalMinutes) * 100;
        const color = getColorForId(block.teacherId);
        const isNarrow = widthPct < 15;

        return (
          <div
            key={block.id}
            className="absolute top-1 bottom-1 rounded overflow-visible group/block"
            style={{
              left: `${leftPct}%`,
              width: `calc(${widthPct}% - 1px)`,
              backgroundColor: color.bg,
              borderLeft: `3px solid ${color.border}`,
              zIndex: preview ? 20 : 10,
              cursor: editable ? 'pointer' : 'default',
            }}
            onMouseMove={(e) => onBlockMouseMove?.(e, block)}
            onMouseLeave={() => onBlockMouseLeave?.()}
            title={`${formatTime(block.startTime)}–${formatTime(block.endTime)}`}
            onClick={(e) => {
              e.stopPropagation();
              if (didResizeRef.current) { didResizeRef.current = false; return; }
              onEditBlock?.(block);
            }}
          >
            {!isNarrow && (
              <span
                className="absolute inset-0 flex items-center px-1.5 text-xs font-medium truncate select-none pointer-events-none"
                style={{ color: color.text }}
              >
                {formatTime(displayStart)}–{formatTime(displayEnd)}
              </span>
            )}

            {editable && (
              <>
                <button
                  className="absolute -top-1 -right-1 z-30 opacity-0 group-hover/block:opacity-100 transition-opacity rounded-full bg-white/80 hover:bg-red-100 p-0.5"
                  onClick={(e) => { e.stopPropagation(); onDeleteBlock?.(block.id); }}
                >
                  <X className="h-2.5 w-2.5 text-red-500" />
                </button>
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize z-20 rounded-l"
                  onMouseDown={(e) => startResize(e, block, 'left')}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize z-20 rounded-r"
                  onMouseDown={(e) => startResize(e, block, 'right')}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
