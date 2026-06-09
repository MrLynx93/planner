import { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Download } from 'lucide-react';
import type { AnnexDto, AnnexGroupDto, AnnexTeacherDto, DayOfWeek, ScheduleBlock } from '@/components/schedule/types';
import { WEEK_DAYS, timeToMinutes } from '@/components/schedule/utils';
import { getColorForId } from '@/components/schedule/colors';
import { exportPlanTableToExcel, type ExportLabels } from '@/utils/exportPlanTable';
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
import type { RuleWithSourceDto, TemplateViolationDto } from '@/types';
import { useGetTemplateViolationsQuery } from '@/store/violationsApi';

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

function groupDailyHours(group: AnnexGroupDto): number {
  const mins =
    timeToMinutes(group.effectiveScheduleEndTime) - timeToMinutes(group.effectiveScheduleStartTime);
  return mins / 60;
}

function formatHours(h: number): string {
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
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

function HoursSummaryTable({
  teachers,
  allBlocks,
  rules,
  onTeacherMouseEnter,
  onTeacherMouseLeave,
}: {
  teachers: AnnexTeacherDto[];
  allBlocks: ScheduleBlock[];
  rules: RuleWithSourceDto[];
  onTeacherMouseEnter: (id: number) => void;
  onTeacherMouseLeave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <table className="text-sm w-full">
      <thead>
        <tr className="text-left text-xs text-muted-foreground border-b border-border">
          <th className="pb-1.5 pr-4 font-medium">{t('draftPlan.teacher')}</th>
          <th className="pb-1.5 pr-4 font-medium">{t('draftPlan.group')}</th>
          <th className="pb-1.5 pr-4 font-medium text-right">{t('draftPlan.hours')}</th>
          <th className="pb-1.5 pr-4 font-medium text-right">{t('draftPlan.minHours')}</th>
          <th className="pb-1.5 font-medium text-right">{t('draftPlan.overhours')}</th>
        </tr>
      </thead>
      <tbody>
        {teachers.map((teacher) => {
          const totalMins = allBlocks
            .filter((b) => b.teacherId === teacher.teacherId)
            .reduce((sum, b) => sum + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0);
          const totalHours = totalMins / 60;
          const minH = effectiveMinHours(rules, teacher.teacherId);
          const diff = minH !== null ? totalHours - minH : null;
          return (
            <tr key={teacher.teacherId} className="border-b border-border last:border-0 hover:bg-muted-foreground/20 transition-colors" onMouseEnter={() => onTeacherMouseEnter(teacher.teacherId)} onMouseLeave={onTeacherMouseLeave}>
              <td className="py-1.5 pr-4 font-medium">
                {teacher.firstName.charAt(0)}.{teacher.lastName}
              </td>
              <td className="py-1.5 pr-4 text-muted-foreground text-xs">
                {teacher.defaultGroupName ?? '—'}
              </td>
              <td className="py-1.5 pr-4 text-right font-mono text-xs">
                {totalHours.toFixed(1)}h
              </td>
              <td className="py-1.5 pr-4 text-right font-mono text-xs text-muted-foreground">
                {minH !== null ? `${minH}h` : '—'}
              </td>
              <td className={cn('py-1.5 text-right font-mono text-xs', diff !== null && diff < 0 ? 'text-destructive' : '')}>
                {diff !== null ? `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}h` : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function isCellHighlighted(
  v: TemplateViolationDto | null,
  row: { groupId: number; teacherId: number | null },
  day: DayOfWeek | null
): boolean {
  if (!v) return false;
  switch (v.violationType) {
    case 'TEACHER_WEEKLY_HOURS_TOO_LOW':
      return row.teacherId !== null && v.teacherId === row.teacherId;
    case 'TEACHER_DAILY_HOURS_TOO_HIGH':
      if (!row.teacherId || v.teacherId !== row.teacherId) return false;
      return day === null || v.dayOfWeek === day;
    case 'GROUP_TEACHER_COUNT_TOO_LOW':
    case 'GROUP_TEACHER_COUNT_TOO_HIGH':
      if (v.groupId !== row.groupId || day === null) return false;
      return v.dayOfWeek === day;
  }
  return false;
}

function TemplateViolationRow({
  v,
  onMouseEnter,
  onMouseLeave,
}: {
  v: TemplateViolationDto;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { t } = useTranslation();
  const dayLabel = v.dayOfWeek
    ? t(`draftPlan.daysFull.${v.dayOfWeek}` as Parameters<typeof t>[0])
    : '';
  const message = t(
    `violations.templateMessages.${v.violationType}` as Parameters<typeof t>[0],
    {
      name: v.teacherName ?? v.groupName ?? '',
      actual: v.actualValue,
      rule: v.ruleValue,
      dayOfWeek: dayLabel,
      startTime: v.startTime ? v.startTime.substring(0, 5) : '',
      endTime: v.endTime ? v.endTime.substring(0, 5) : '',
    }
  );

  return (
    <tr
      className="border-b border-border last:border-0 cursor-default hover:bg-muted-foreground/20 transition-colors"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <td className="py-1.5 pr-2 align-top">
        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap bg-destructive/10 text-destructive">
          {t('violations.error')}
        </span>
      </td>
      <td className="py-1.5 text-base text-foreground/80">{message}</td>
    </tr>
  );
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
  const { data: templateViolations = [] } = useGetTemplateViolationsQuery(annexId);

  const [createTimeBlock] = useCreateAnnexTimeBlockMutation();
  const [updateTimeBlock] = useUpdateAnnexTimeBlockMutation();
  const [deleteTimeBlock] = useDeleteAnnexTimeBlockMutation();

  const containerRef = useRef<HTMLDivElement>(null);

  const [panelOpen, setPanelOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(208);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(420);
  const resizing = useRef(false);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const delta = startX - ev.clientX;
      setPanelWidth(Math.max(160, Math.min(520, startWidth + delta)));
    };
    const onMouseUp = () => {
      resizing.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleBottomResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;
    const maxHeight = containerRef.current
      ? containerRef.current.clientHeight - 80
      : 800;

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const delta = startY - ev.clientY;
      setBottomPanelHeight(Math.max(80, Math.min(maxHeight, startHeight + delta)));
    };
    const onMouseUp = () => {
      resizing.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const [dragOverCell, setDragOverCell] = useState<{ groupId: number; day: DayOfWeek } | null>(null);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [hoveredViolation, setHoveredViolation] = useState<TemplateViolationDto | null>(null);
  const [hoveredSummaryTeacherId, setHoveredSummaryTeacherId] = useState<number | null>(null);
  const [showViolations, setShowViolations] = useState(true);
  const [showSummary, setShowSummary] = useState(true);

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
    const targetGroup = groups.find((g) => g.groupId === groupId);
    createTimeBlock({
      annexId,
      dto: {
        teacherId,
        groupId,
        dayOfWeek: day,
        startTime: targetGroup?.effectiveScheduleStartTime ?? '06:00:00',
        endTime: targetGroup?.effectiveScheduleEndTime ?? '20:00:00',
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
    const labels: ExportLabels = {
      group: t('draftPlan.group'),
      teacher: t('draftPlan.teacher'),
      hours: t('draftPlan.hours'),
      overhours: t('draftPlan.overhours'),
      days: Object.fromEntries(
        WEEK_DAYS.map((d) => [d, t(`draftPlan.days.${d}` as Parameters<typeof t>[0])])
      ) as ExportLabels['days'],
      groupHoursPerDay: (hours) => t('draftPlan.groupHoursPerDay', { hours }),
      groupHoursPerWeek: (hours) => t('draftPlan.groupHoursPerWeek', { hours }),
    };
    exportPlanTableToExcel(annex.name, rows, allBlocks, rules, labels);
  };

  const handleDeleteFromModal = () => {
    if (!editModal) return;
    deleteTimeBlock({ annexId, annexTimeBlockId: editModal.block.id });
    setEditModal(null);
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col min-h-0">
      {/* Top: table + right panel */}
      <div className="flex flex-1 min-h-0">
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
                className="group"
              >
                {isFirstInGroup && (
                  <td
                    rowSpan={groupSize}
                    className="border border-border px-3 py-2 align-top bg-muted/40"
                  >
                    <div className="font-medium text-sm">{group.groupName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {group.effectiveScheduleStartTime.substring(0, 5)}–{group.effectiveScheduleEndTime.substring(0, 5)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {t('draftPlan.groupHoursPerDay', { hours: formatHours(groupDailyHours(group)) })}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {t('draftPlan.groupHoursPerWeek', { hours: formatHours(groupDailyHours(group) * 5) })}
                    </div>
                  </td>
                )}
                <td
                  className={cn(
                    'border border-border px-3 py-2 whitespace-nowrap cursor-default transition-colors group-hover:bg-muted-foreground/20',
                    teacher?.defaultGroupId === group.groupId ? 'font-semibold' : 'text-muted-foreground',
                    hoveredSummaryTeacherId === teacher?.teacherId && 'bg-muted-foreground/20',
                    isCellHighlighted(hoveredViolation, { groupId: group.groupId, teacherId: teacher?.teacherId ?? null }, null) && 'ring-2 ring-inset ring-destructive'
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
                        'border border-border px-1 py-1 min-w-[120px] transition-colors group-hover:bg-muted-foreground/20',
                        !isFirstInGroup && 'border-t-transparent',
                        !isLastInGroup && 'border-b-transparent',
                        editable && isDragTarget && 'bg-primary/10 outline outline-2 outline-primary',
                        hoveredSummaryTeacherId === teacher?.teacherId && 'bg-muted-foreground/20',
                        isCellHighlighted(hoveredViolation, { groupId: group.groupId, teacherId: teacher?.teacherId ?? null }, day) && 'ring-2 ring-inset ring-destructive'
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
                          scheduleStart={group.effectiveScheduleStartTime}
                          scheduleEnd={group.effectiveScheduleEndTime}
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
                <td className={cn('border border-border px-3 py-2 text-right font-mono text-xs transition-colors group-hover:bg-muted-foreground/20', teacher?.defaultGroupId === group.groupId ? 'font-semibold' : 'text-muted-foreground', hoveredSummaryTeacherId === teacher?.teacherId && 'bg-muted-foreground/20', isCellHighlighted(hoveredViolation, { groupId: group.groupId, teacherId: teacher?.teacherId ?? null }, null) && 'ring-2 ring-inset ring-destructive')}>
                  {teacher ? `${weeklyHours(allBlocks, group.groupId, teacher.teacherId)}h` : '—'}
                </td>
                <td className={cn('border border-border px-3 py-2 text-right font-mono text-xs transition-colors group-hover:bg-muted-foreground/20', teacher?.defaultGroupId === group.groupId && 'font-semibold', hoveredSummaryTeacherId === teacher?.teacherId && 'bg-muted-foreground/20', isCellHighlighted(hoveredViolation, { groupId: group.groupId, teacherId: teacher?.teacherId ?? null }, null) && 'ring-2 ring-inset ring-destructive')}>
                  {(() => {
                    if (!teacher) return <span className="text-muted-foreground">—</span>;
                    const groupHours = parseFloat(weeklyHours(allBlocks, group.groupId, teacher.teacherId));
                    if (teacher.defaultGroupId === group.groupId) {
                      const minH = effectiveMinHours(rules, teacher.teacherId);
                      if (minH === null) return <span className="text-muted-foreground">—</span>;
                      const diff = groupHours - minH;
                      const label = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}h`;
                      const color = diff < 0 ? 'text-destructive' : '';
                      return <span className={color}>{label}</span>;
                    } else {
                      if (groupHours === 0) return <span className="text-muted-foreground">—</span>;
                      return <span>{`+${groupHours.toFixed(1)}h`}</span>;
                    }
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
        className="border-l border-border shrink-0 flex flex-col relative"
        style={{ width: panelOpen ? panelWidth : 36 }}
      >
        {panelOpen && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-primary/40 transition-colors"
            onMouseDown={handleResizeMouseDown}
          />
        )}
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
              teachers.map((teacher) => {
                const color = getColorForId(teacher.teacherId);
                return (
                  <div
                    key={teacher.teacherId}
                    draggable={editable}
                    onDragStart={(e) => e.dataTransfer.setData('id', String(teacher.teacherId))}
                    className={cn(
                      'px-3 py-2 rounded text-sm select-none',
                      editable ? 'cursor-grab active:cursor-grabbing' : 'opacity-50 cursor-default'
                    )}
                    style={{
                      backgroundColor: color.bg,
                      borderLeft: `3px solid ${color.border}`,
                      color: color.text,
                    }}
                  >
                    {teacher.firstName.charAt(0)}.{teacher.lastName}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      </div>{/* end top row */}

      {/* Bottom violations panel */}
      <div
        className="border-t border-border shrink-0 flex flex-col relative"
        style={{ height: bottomPanelOpen ? bottomPanelHeight : 36 }}
      >
        {/* Resize handle on top edge */}
        {bottomPanelOpen && (
          <div
            className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize z-10 hover:bg-primary/40 transition-colors"
            onMouseDown={handleBottomResizeMouseDown}
          />
        )}
        {/* Header with tabs */}
        <div className="flex items-center border-b border-border px-1 py-0 shrink-0">
          <button
            onClick={() => setShowViolations((v) => !v)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
              showViolations
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t('violations.title')}
            {templateViolations.length > 0 && (
              <span className="ml-1.5 text-destructive">({templateViolations.length})</span>
            )}
          </button>
          <button
            onClick={() => setShowSummary((v) => !v)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
              showSummary
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t('draftPlan.hoursSummary')}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setBottomPanelOpen((o) => !o)}
            className="rounded p-1 mr-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {bottomPanelOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {bottomPanelOpen && (showViolations || showSummary) && (
          <div className="flex flex-1 min-h-0">
            {showViolations && (
              <div className={cn('overflow-auto flex-1 px-4 py-3', showSummary && 'border-r border-border')}>
                {templateViolations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('violations.noViolations')}</p>
                ) : (
                  <table className="text-sm">
                    <tbody>
                      {templateViolations.map((v, i) => (
                        <TemplateViolationRow
                          key={i}
                          v={v}
                          onMouseEnter={() => setHoveredViolation(v)}
                          onMouseLeave={() => setHoveredViolation(null)}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {showSummary && (
              <div className="overflow-auto flex-1 px-4 py-3">
                <HoursSummaryTable teachers={teachers} allBlocks={allBlocks} rules={rules} onTeacherMouseEnter={setHoveredSummaryTeacherId} onTeacherMouseLeave={() => setHoveredSummaryTeacherId(null)} />
              </div>
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
