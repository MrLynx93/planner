import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AnnexDto, AnnexGroupDto, AnnexTeacherDto, DayOfWeek, ScheduleBlock } from '@/components/schedule/types';
import { WEEK_DAYS, timeToMinutes } from '@/components/schedule/utils';
import { HorizontalTimeCell } from '@/components/schedule/HorizontalTimeCell';
import {
  useGetAnnexGroupsQuery,
  useGetAnnexTeachersQuery,
  useGetAnnexTimeBlocksQuery,
} from '@/store/annexesApi';

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

interface Row {
  group: AnnexGroupDto;
  teacher: AnnexTeacherDto | null;
  isFirstInGroup: boolean;
  groupSize: number;
}

function buildRows(
  groups: AnnexGroupDto[],
  teachers: AnnexTeacherDto[],
  allBlocks: ScheduleBlock[]
): Row[] {
  return groups.flatMap((group): Row[] => {
    const groupBlocks = allBlocks.filter((b) => b.groupId === group.groupId);
    const teacherIds = [...new Set(groupBlocks.map((b) => b.teacherId))];

    const sortedTeachers = teacherIds
      .map((tid) => {
        const blocks = groupBlocks.filter((b) => b.teacherId === tid);
        const earliestStart = Math.min(...blocks.map((b) => timeToMinutes(b.startTime)));
        return { teacher: teachers.find((t) => t.teacherId === tid) ?? null, earliestStart };
      })
      .filter((x) => x.teacher !== null)
      .sort((a, b) => a.earliestStart - b.earliestStart)
      .map((x) => x.teacher as AnnexTeacherDto);

    if (sortedTeachers.length === 0) {
      return [{ group, teacher: null, isFirstInGroup: true, groupSize: 1 }];
    }

    return sortedTeachers.map((teacher, idx) => ({
      group,
      teacher,
      isFirstInGroup: idx === 0,
      groupSize: sortedTeachers.length,
    }));
  });
}

function weeklyHours(blocks: ScheduleBlock[], groupId: number, teacherId: number): string {
  const mins = blocks
    .filter((b) => b.groupId === groupId && b.teacherId === teacherId)
    .reduce((sum, b) => sum + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0);
  return (mins / 60).toFixed(1);
}

export function AnnexPlanTablePage() {
  const { t } = useTranslation();
  const annex = useOutletContext<AnnexDto>();
  const annexId = annex.id!;

  const { data: groups = [] } = useGetAnnexGroupsQuery(annexId);
  const { data: teachers = [] } = useGetAnnexTeachersQuery(annexId);
  const { data: allBlocks = [] } = useGetAnnexTimeBlocksQuery(annexId);

  const rows = buildRows(groups, teachers, allBlocks);

  return (
    <div className="overflow-auto p-6">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted text-left">
            <th className="border border-border px-3 py-2 font-semibold whitespace-nowrap w-28">
              {t('draftPlan.group')}
            </th>
            <th className="border border-border px-3 py-2 font-semibold whitespace-nowrap w-36">
              {t('draftPlan.teacher')}
            </th>
            {WEEK_DAYS.map((day) => (
              <th key={day} className="border border-border px-3 py-2 font-semibold text-center">
                {DAY_LABELS[day]}
              </th>
            ))}
            <th className="border border-border px-3 py-2 font-semibold text-right whitespace-nowrap w-16">
              {t('draftPlan.hours')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ group, teacher, isFirstInGroup, groupSize }) => (
            <tr
              key={`${group.groupId}-${teacher?.teacherId ?? 'empty'}`}
              className="hover:bg-accent/30 transition-colors"
            >
              {isFirstInGroup && (
                <td
                  rowSpan={groupSize}
                  className="border border-border px-3 py-2 font-medium align-middle bg-muted/40"
                >
                  {group.groupName}
                </td>
              )}
              <td className="border border-border px-3 py-2 whitespace-nowrap text-muted-foreground">
                {teacher ? `${teacher.firstName} ${teacher.lastName}` : '—'}
              </td>
              {WEEK_DAYS.map((day) => (
                <td key={day} className="border border-border px-1 py-1 min-w-[120px]">
                  {teacher && (
                    <HorizontalTimeCell
                      blocks={allBlocks.filter(
                        (b) =>
                          b.groupId === group.groupId &&
                          b.teacherId === teacher.teacherId &&
                          b.dayOfWeek === day
                      )}
                      scheduleStart={annex.scheduleStartTime}
                      scheduleEnd={annex.scheduleEndTime}
                    />
                  )}
                </td>
              ))}
              <td className="border border-border px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                {teacher ? `${weeklyHours(allBlocks, group.groupId, teacher.teacherId)}h` : '—'}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={2 + WEEK_DAYS.length + 1}
                className="border border-border px-3 py-8 text-center text-muted-foreground"
              >
                {t('common.noItems')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
