import type { ScheduleBlock } from './types';
import { timeToMinutes, formatTime } from './utils';
import { getColorForId } from './colors';

interface HorizontalTimeCellProps {
  blocks: ScheduleBlock[];
  scheduleStart: string;
  scheduleEnd: string;
}

export function HorizontalTimeCell({ blocks, scheduleStart, scheduleEnd }: HorizontalTimeCellProps) {
  const totalMinutes = timeToMinutes(scheduleEnd) - timeToMinutes(scheduleStart);
  const startMinutes = timeToMinutes(scheduleStart);

  return (
    <div className="relative h-9 bg-gray-50 rounded">
      {blocks.map((block) => {
        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);
        const leftPct = ((blockStart - startMinutes) / totalMinutes) * 100;
        const widthPct = ((blockEnd - blockStart) / totalMinutes) * 100;
        const color = getColorForId(block.teacherId);
        const widthIsNarrow = widthPct < 15;

        return (
          <div
            key={block.id}
            className="absolute top-1 bottom-1 rounded overflow-hidden"
            style={{
              left: `${leftPct}%`,
              width: `calc(${widthPct}% - 1px)`,
              backgroundColor: color.bg,
              borderLeft: `3px solid ${color.border}`,
            }}
            title={`${formatTime(block.startTime)}–${formatTime(block.endTime)}`}
          >
            {!widthIsNarrow && (
              <span
                className="absolute inset-0 flex items-center px-1 text-xs font-medium truncate select-none"
                style={{ color: color.text }}
              >
                {formatTime(block.startTime)}–{formatTime(block.endTime)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
