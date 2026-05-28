import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft, Download } from 'lucide-react';
import type { AnnexDto, AnnexGroupDto, AnnexTeacherDto, DayOfWeek, ScheduleBlock } from '@/components/schedule/types';
import { WEEK_DAYS, timeToMinutes } from '@/components/schedule/utils';
import { exportPlanTableToExcel } from '@/utils/exportPlanTable';
import { HorizontalTimeCell } from '@/components/schedule/HorizontalTimeCell';
import { cn } from '@/lib/utils';
import {
  useGetAnnexGroupsQuery,
  useGetAnnexTeachersQuery,
  useGetAnnexTimeBlocksQuery,
  useGetAnnexRulesCombinedQuery,
  useCreateAnnexTimeBlockMutation,
  useUpdateAnnexTimeBlockMutation,
  useDeleteAnnexTimeBlockMutation,
} from '@/store/annexesApi';
import type { RuleWithSourceDto } from '@/types';

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
  isLastInGroup: boolean;
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
      return [{ group, teacher: null, isFirstInGroup: true, isLastInGroup: true, groupSize: 1 }];
    }

    return sortedTeachers.map((teacher, idx) => ({
      group,
      teacher,
      isFirstInGroup: idx === 0,
      isLastInGroup: idx === sortedTeachers.length - 1,
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

function teacherTotalWeeklyHours(blocks: ScheduleBlock[], teacherId: number): number {
  const mins = blocks
    .filter((b) => b.teacherId === teacherId)
    .reduce((sum, b) => sum + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0);
  return mins / 60;
}

function effectiveMinHours(rules: RuleWithSourceDto[], teacherId: number): number | null {
  const relevant = rules.filter((r) => r.ruleType === 'TEACHER_WEEKLY_HOURS_MIN');
  return (
    relevant.find((r) => r.annexRuleId !== null && r.teacherId === teacherId)?.intValue ??
    relevant.find((r) => r.annexRuleId === null && r.teacherId === teacherId)?.intValue ??
    relevant.find((r) => r.annexRuleId !== null && r.teacherId === null)?.intValue ??
    relevant.find((r) => r.annexRuleId === null && r.teacherId === null)?.intValue ??
    null
  );
}

interface EditModal {
  block: ScheduleBlock;
  startTime: string;
  endTime: string;
}

export function AnnexPlanTablePage() {
  const { t } = useTranslation();
  const annex = useOutletContext<AnnexDto>();
  const annexId = annex.id!;
  const editable = annex.state === 'DRAFT' || annex.state === 'CURRENT';

  const { data: groups = [] } = useGetAnnexGroupsQuery(annexId);
  const { data: teachers = [] } = useGetAnnexTeachersQuery(annexId);
  const { data: allBlocks = [] } = useGetAnnexTimeBlocksQuery(annexId);
  const { data: rules = [] } = useGetAnnexRulesCombinedQuery(annexId);

  const [createTimeBlock] = useCreateAnnexTimeBlockMutation();
  const [updateTimeBlock] = useUpdateAnnexTimeBlockMutation();
  const [deleteTimeBlock] = useDeleteAnnexTimeBlockMutation();

  const [panelOpen, setPanelOpen] = useState(true);
  const [dragOverCell, setDragOverCell] = useState<{ groupId: number; day: DayOfWeek } | null>(null);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  const rows = buildRows(groups, teachers, allBlocks);

  const handleDrop = (e: React.DragEvent, groupId: number, day: DayOfWeek) => {
    e.preventDefault();
    const teacherId = Number(e.dataTransfer.getData('id'));
    setDragOverCell(null);
    if (!teacherId) return;
    const alreadyExists = allBlocks.some(
      (b) => b.teacherId === teacherId && b.groupId === groupId && b.dayOfWeek === day
    );
    if (alreadyExists) return;
    createTimeBlock({
      annexId,
      dto: {
        teacherId,
        groupId,
        dayOfWeek: day,
        startTime: annex.scheduleStartTime,
        endTime: annex.scheduleEndTime,
        type: 'TEMPLATE',
      },
    });
  };

  const handleEditBlock = (block: ScheduleBlock) => {
    if (!editable) return;
    setEditModal({
      block,
      startTime: block.startTime.substring(0, 5),
      endTime: block.endTime.substring(0, 5),
    });
  };

  const handleSaveEdit = () => {
    if (!editModal) return;
    updateTimeBlock({
      annexId,
      annexTimeBlockId: editModal.block.id,
      startTime: editModal.startTime + ':00',
      endTime: editModal.endTime + ':00',
    });
    setEditModal(null);
  };

  const handleExport = () => {
    exportPlanTableToExcel(annex.name, rows, allBlocks);
  };

  const handleDeleteFromModal = () => {
    if (!editModal) return;
    deleteTimeBlock({ annexId, annexTimeBlockId: editModal.block.id });
    setEditModal(null);
  };

  return (
    <div className="h-full flex min-h-0">
      {/* Table area */}
      <div className="flex-1 overflow-auto p-6 min-w-0">
        <div className="flex justify-end mb-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <Download className="h-4 w-4" />
            {t('draftPlan.exportExcel', 'Export to Excel')}
          </button>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="border border-border px-3 py-2 font-semibold whitespace-nowrap w-28">
                {t('draftPlan.group')}
              </th>
              <th className="border border-border px-3 py-2 font-semibold whitespace-nowrap w-32">
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
              <th className="border border-border px-3 py-2 font-semibold text-right whitespace-nowrap w-20">
                {t('draftPlan.overhours')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ group, teacher, isFirstInGroup, isLastInGroup, groupSize }) => (
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
                <td
                  className={cn(
                    'border border-border px-3 py-2 whitespace-nowrap cursor-default',
                    teacher?.defaultGroupId === group.groupId ? 'font-semibold' : 'text-muted-foreground'
                  )}
                  onMouseMove={teacher ? (e) => {
                    const content = teacher.defaultGroupId === group.groupId
                      ? t('draftPlan.tooltipAssignedHere')
                      : teacher.defaultGroupName
                        ? t('draftPlan.tooltipOverhoursInGroup', { groupName: teacher.defaultGroupName })
                        : t('draftPlan.tooltipOverhoursNoGroup');
                    setTooltip({ x: e.clientX, y: e.clientY, content });
                  } : undefined}
                  onMouseLeave={teacher ? () => setTooltip(null) : undefined}
                >
                  {teacher ? `${teacher.firstName.charAt(0)}.${teacher.lastName}` : '—'}
                </td>
                {WEEK_DAYS.map((day) => {
                  const isDragTarget =
                    dragOverCell?.groupId === group.groupId && dragOverCell?.day === day;
                  return (
                    <td
                      key={day}
                      className={cn(
                        'border border-border px-1 py-1 min-w-[120px] transition-colors',
                        !isFirstInGroup && 'border-t-transparent',
                        !isLastInGroup && 'border-b-transparent',
                        editable && isDragTarget && 'bg-primary/10 outline outline-2 outline-primary'
                      )}
                      onDragOver={
                        editable
                          ? (e) => { e.preventDefault(); setDragOverCell({ groupId: group.groupId, day }); }
                          : undefined
                      }
                      onDragLeave={editable ? () => setDragOverCell(null) : undefined}
                      onDrop={editable ? (e) => handleDrop(e, group.groupId, day) : undefined}
                    >
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
                          editable={editable}
                          onResizeBlock={(id, start, end) =>
                            updateTimeBlock({ annexId, annexTimeBlockId: id, startTime: start, endTime: end })
                          }
                          onDeleteBlock={(id) => deleteTimeBlock({ annexId, annexTimeBlockId: id })}
                          onEditBlock={handleEditBlock}
                        />
                      )}
                    </td>
                  );
                })}
                <td className="border border-border px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                  {teacher ? `${weeklyHours(allBlocks, group.groupId, teacher.teacherId)}h` : '—'}
                </td>
                <td className="border border-border px-3 py-2 text-right font-mono text-xs">
                  {(() => {
                    if (!teacher) return <span className="text-muted-foreground">—</span>;
                    const minH = effectiveMinHours(rules, teacher.teacherId);
                    if (minH === null) return <span className="text-muted-foreground">—</span>;
                    const diff = teacherTotalWeeklyHours(allBlocks, teacher.teacherId) - minH;
                    const label = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}h`;
                    const color =
                      diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-destructive' : 'text-green-600';
                    return <span className={color}>{label}</span>;
                  })()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={2 + WEEK_DAYS.length + 2}
                  className="border border-border px-3 py-8 text-center text-muted-foreground"
                >
                  {t('common.noItems')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Right panel */}
      <div
        className={cn(
          'border-l border-border shrink-0 flex flex-col transition-all duration-200',
          panelOpen ? 'w-52' : 'w-9'
        )}
      >
        <div className="flex items-center border-b border-border px-2 py-2 shrink-0">
          {panelOpen && (
            <p className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('draftPlan.teachers')}
            </p>
          )}
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title={panelOpen ? 'Collapse' : 'Expand'}
          >
            {panelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {panelOpen && (
          <div className="overflow-y-auto p-2 flex flex-col gap-1.5">
            {!editable && (
              <p className="text-xs text-muted-foreground italic px-1">
                {t('common.readOnly', 'Read-only')}
              </p>
            )}
            {teachers.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1">{t('common.noItems')}</p>
            ) : (
              teachers.map((teacher) => (
                <div
                  key={teacher.teacherId}
                  draggable={editable}
                  onDragStart={(e) => e.dataTransfer.setData('id', String(teacher.teacherId))}
                  className={cn(
                    'px-3 py-2 rounded text-sm border border-border select-none',
                    editable
                      ? 'cursor-grab active:cursor-grabbing hover:bg-accent'
                      : 'opacity-50 cursor-default'
                  )}
                >
                  {teacher.firstName.charAt(0)}.{teacher.lastName}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setEditModal(null)}
        >
          <div
            className="bg-background rounded-lg shadow-lg border border-border p-4 w-72 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold">{t('draftPlan.editBlock', 'Edit time block')}</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">{t('draftPlan.startTime', 'Start time')}</label>
              <input
                type="time"
                value={editModal.startTime}
                onChange={(e) => setEditModal({ ...editModal, startTime: e.target.value })}
                className="border border-border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">{t('draftPlan.endTime', 'End time')}</label>
              <input
                type="time"
                value={editModal.endTime}
                onChange={(e) => setEditModal({ ...editModal, endTime: e.target.value })}
                className="border border-border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveEdit}
                className="flex-1 rounded bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {t('common.save')}
              </button>
              <button
                onClick={handleDeleteFromModal}
                className="rounded border border-destructive text-destructive px-3 py-1.5 text-sm font-medium hover:bg-destructive/10 transition-colors"
              >
                {t('common.delete')}
              </button>
              <button
                onClick={() => setEditModal(null)}
                className="rounded border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-foreground text-background rounded-md shadow-lg px-3 py-2 text-sm font-medium"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
