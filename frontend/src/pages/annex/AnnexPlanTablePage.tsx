import { useState, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Download, Printer, Wand2 } from 'lucide-react';
import type { AnnexDto, AnnexGroupDto, AnnexTeacherDto, DayOfWeek, GroupTag, ScheduleBlock } from '@/components/schedule/types';
import { WEEK_DAYS, timeToMinutes, minutesToTime } from '@/components/schedule/utils';
import { getColorForId } from '@/components/schedule/colors';
import { exportPlanTableToExcel, printPlanTable, type ExportLabels } from '@/utils/exportPlanTable';
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
  useGeneratePlanMutation,
} from '@/store/annexesApi';
import type { RuleWithSourceDto, TemplateViolationDto } from '@/types';
import { useGetTemplateViolationsQuery } from '@/store/violationsApi';


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
        const teacher = teachers.find((t) => t.teacherId === tid) ?? null;
        const isAssigned = teacher?.defaultGroupId === group.groupId ? 0 : 1;
        return { teacher, earliestStart, isAssigned };
      })
      .filter((x) => x.teacher !== null)
      .sort((a, b) => a.isAssigned - b.isAssigned || a.earliestStart - b.earliestStart)
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

function OpenCloseSummary({
  allBlocks,
  teachers,
}: {
  allBlocks: ScheduleBlock[];
  teachers: AnnexTeacherDto[];
}) {
  const { t } = useTranslation();
  const teacherName = (id: number) => {
    const teacher = teachers.find((t) => t.teacherId === id);
    return teacher ? `${teacher.firstName.charAt(0)}.${teacher.lastName}` : String(id);
  };

  const rows = WEEK_DAYS.map((day) => {
    const dayBlocks = allBlocks.filter((b) => b.dayOfWeek === day);
    if (!dayBlocks.length) return null;
    const minStart = Math.min(...dayBlocks.map((b) => timeToMinutes(b.startTime)));
    const maxEnd = Math.max(...dayBlocks.map((b) => timeToMinutes(b.endTime)));
    const openingTeachers = [...new Set(dayBlocks.filter((b) => timeToMinutes(b.startTime) === minStart).map((b) => b.teacherId))];
    const closingTeachers = [...new Set(dayBlocks.filter((b) => timeToMinutes(b.endTime) === maxEnd).map((b) => b.teacherId))];
    return { day, openingTeachers, closingTeachers };
  }).filter(Boolean) as { day: DayOfWeek; openingTeachers: number[]; closingTeachers: number[] }[];

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>;
  }

  return (
    <table className="text-sm w-full">
      <tbody>
        {rows.map(({ day, openingTeachers, closingTeachers }) => (
          <tr key={day} className="border-b border-border last:border-0">
            <td className="py-1.5 pr-4 font-medium w-24 align-top">
              {t(`draftPlan.daysFull.${day}` as Parameters<typeof t>[0])}
            </td>
            <td className="py-1.5 space-y-0.5">
              <div className="flex gap-1.5 items-baseline">
                <span className="text-xs text-muted-foreground w-16 shrink-0">{t('draftPlan.opening')}:</span>
                <span className="text-xs font-medium text-green-700">{openingTeachers.map(teacherName).join(', ')}</span>
              </div>
              <div className="flex gap-1.5 items-baseline">
                <span className="text-xs text-muted-foreground w-16 shrink-0">{t('draftPlan.closing')}:</span>
                <span className="text-xs font-medium text-amber-700">{closingTeachers.map(teacherName).join(', ')}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function computeOverlapViolations(
  allBlocks: ScheduleBlock[],
  teachers: AnnexTeacherDto[]
): TemplateViolationDto[] {
  const violations: TemplateViolationDto[] = [];
  for (const day of WEEK_DAYS) {
    const teacherIds = [...new Set(allBlocks.filter((b) => b.dayOfWeek === day).map((b) => b.teacherId))];
    for (const teacherId of teacherIds) {
      const dayBlocks = allBlocks.filter((b) => b.dayOfWeek === day && b.teacherId === teacherId);
      const overlappingGroupIds = new Set<number>();
      for (let i = 0; i < dayBlocks.length; i++) {
        for (let j = i + 1; j < dayBlocks.length; j++) {
          const a = dayBlocks[i];
          const b = dayBlocks[j];
          if (a.groupId !== b.groupId) {
            const aStart = timeToMinutes(a.startTime);
            const aEnd = timeToMinutes(a.endTime);
            const bStart = timeToMinutes(b.startTime);
            const bEnd = timeToMinutes(b.endTime);
            if (aStart < bEnd && bStart < aEnd) {
              overlappingGroupIds.add(a.groupId);
              overlappingGroupIds.add(b.groupId);
            }
          }
        }
      }
      if (overlappingGroupIds.size > 0) {
        const teacher = teachers.find((t) => t.teacherId === teacherId);
        const groupNames = [
          ...new Set(dayBlocks.filter((b) => overlappingGroupIds.has(b.groupId)).map((b) => b.groupName)),
        ].join(', ');
        violations.push({
          violationType: 'TEACHER_OVERLAPPING_TIME_BLOCKS',
          severity: 'ERROR',
          teacherId,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : String(teacherId),
          groupId: null,
          groupName: groupNames,
          dayOfWeek: day,
          startTime: null,
          endTime: null,
          ruleValue: 0,
          actualValue: overlappingGroupIds.size,
        });
      }
    }
  }
  return violations;
}

function getGroupTimeHighlight(
  v: TemplateViolationDto | null,
  group: AnnexGroupDto
): { highlightStart: boolean; highlightEnd: boolean } {
  if (!v || v.violationType !== 'BLOCK_OUTSIDE_GROUP_HOURS' || v.groupId !== group.groupId || !v.startTime || !v.endTime) {
    return { highlightStart: false, highlightEnd: false };
  }
  return {
    highlightStart: timeToMinutes(v.startTime) < timeToMinutes(group.effectiveScheduleStartTime),
    highlightEnd: timeToMinutes(v.endTime) > timeToMinutes(group.effectiveScheduleEndTime),
  };
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
    case 'BLOCK_OUTSIDE_GROUP_HOURS':
      if (day === null) return false;
      if (v.groupId !== row.groupId) return false;
      if (row.teacherId === null || v.teacherId !== row.teacherId) return false;
      return v.dayOfWeek === day;
    case 'TEACHER_OVERLAPPING_TIME_BLOCKS':
      if (!row.teacherId || v.teacherId !== row.teacherId) return false;
      return day === null || v.dayOfWeek === day;
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
      groupName: v.groupName ?? '',
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

  const overlapViolations = useMemo(
    () => computeOverlapViolations(allBlocks, teachers),
    [allBlocks, teachers]
  );

  const allViolations = useMemo(
    () => [...templateViolations, ...overlapViolations],
    [templateViolations, overlapViolations]
  );

  const [createTimeBlock] = useCreateAnnexTimeBlockMutation();
  const [updateTimeBlock] = useUpdateAnnexTimeBlockMutation();
  const [deleteTimeBlock] = useDeleteAnnexTimeBlockMutation();
  const [generatePlan, { isLoading: isGenerating }] = useGeneratePlanMutation();

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
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [generateResult, setGenerateResult] = useState<{ blocksCreated: number; violationCount: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [hoveredViolation, setHoveredViolation] = useState<TemplateViolationDto | null>(null);
  const [hoveredSummaryTeacherId, setHoveredSummaryTeacherId] = useState<number | null>(null);
  const [showViolations, setShowViolations] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [showOpenClose, setShowOpenClose] = useState(true);

  const openingBlockIds = useMemo<Set<number>>(() => {
    const ids = new Set<number>();
    for (const day of WEEK_DAYS) {
      const dayBlocks = allBlocks.filter((b) => b.dayOfWeek === day);
      if (!dayBlocks.length) continue;
      const minStart = Math.min(...dayBlocks.map((b) => timeToMinutes(b.startTime)));
      dayBlocks.filter((b) => timeToMinutes(b.startTime) === minStart).forEach((b) => ids.add(b.id));
    }
    return ids;
  }, [allBlocks]);

  const groupDayWindows = useMemo(() => {
    const map = new Map<string, { start: string; end: string }>();
    for (const group of groups) {
      for (const day of WEEK_DAYS) {
        const dayBlocks = allBlocks.filter((b) => b.groupId === group.groupId && b.dayOfWeek === day);
        const startMins = dayBlocks.reduce(
          (min, b) => Math.min(min, timeToMinutes(b.startTime)),
          timeToMinutes(group.effectiveScheduleStartTime)
        );
        const endMins = dayBlocks.reduce(
          (max, b) => Math.max(max, timeToMinutes(b.endTime)),
          timeToMinutes(group.effectiveScheduleEndTime)
        );
        map.set(`${group.groupId}_${day}`, { start: minutesToTime(startMins), end: minutesToTime(endMins) });
      }
    }
    return map;
  }, [groups, allBlocks]);

  const closingBlockIds = useMemo<Set<number>>(() => {
    const ids = new Set<number>();
    for (const day of WEEK_DAYS) {
      const dayBlocks = allBlocks.filter((b) => b.dayOfWeek === day);
      if (!dayBlocks.length) continue;
      const maxEnd = Math.max(...dayBlocks.map((b) => timeToMinutes(b.endTime)));
      dayBlocks.filter((b) => timeToMinutes(b.endTime) === maxEnd).forEach((b) => ids.add(b.id));
    }
    return ids;
  }, [allBlocks]);

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
      hours: t('draftPlan.printHours'),
      overhours: t('draftPlan.printOverhours'),
      days: Object.fromEntries(
        WEEK_DAYS.map((d) => {
          const name = t(`draftPlan.daysFull.${d}` as Parameters<typeof t>[0]);
          return [d, name.charAt(0).toUpperCase() + name.slice(1)];
        })
      ) as ExportLabels['days'],
      groupHoursPerDay: (hours) => t('draftPlan.groupHoursPerDay', { hours }),
      groupHoursPerWeek: (hours) => t('draftPlan.groupHoursPerWeek', { hours }),
      groupTag: (tag) => t(`groupTags.${tag}` as Parameters<typeof t>[0]),
    };
    exportPlanTableToExcel(annex.name, rows, allBlocks, rules, labels);
  };

  const handlePrint = () => {
    const labels: ExportLabels = {
      group: t('draftPlan.group'),
      teacher: t('draftPlan.teacher'),
      hours: t('draftPlan.printHours'),
      overhours: t('draftPlan.printOverhours'),
      days: Object.fromEntries(
        WEEK_DAYS.map((d) => {
          const name = t(`draftPlan.daysFull.${d}` as Parameters<typeof t>[0]);
          return [d, name.charAt(0).toUpperCase() + name.slice(1)];
        })
      ) as ExportLabels['days'],
      groupHoursPerDay: (hours) => t('draftPlan.groupHoursPerDay', { hours }),
      groupHoursPerWeek: (hours) => t('draftPlan.groupHoursPerWeek', { hours }),
      groupTag: (tag) => t(`groupTags.${tag}` as Parameters<typeof t>[0]),
    };
    printPlanTable(annex.name, rows, allBlocks, rules, labels);
  };

  const handleDeleteFromModal = () => {
    if (!editModal) return;
    deleteTimeBlock({ annexId, annexTimeBlockId: editModal.block.id });
    setEditModal(null);
  };

  const handleGenerate = async () => {
    setShowGenerateConfirm(false);
    const result = await generatePlan(annexId).unwrap();
    setGenerateResult({ blocksCreated: result.blocksCreated, violationCount: result.remainingViolations.length });
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col min-h-0">
      {/* Top: table + right panel */}
      <div className="flex flex-1 min-h-0">
      {/* Table area */}
      <div className="flex-1 overflow-auto p-6 min-w-0">
        <div className="flex justify-end gap-2 mb-3">
          {annex.state === 'DRAFT' && (
            <button
              onClick={() => { setGenerateResult(null); setShowGenerateConfirm(true); }}
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? t('draftPlan.generating', 'Generating…') : t('draftPlan.generate', 'Generate')}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <Printer className="h-4 w-4" />
            {t('draftPlan.print', 'Print')}
          </button>
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
                  {t(`draftPlan.daysFull.${day}` as Parameters<typeof t>[0])}
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
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{group.groupName}</span>
                      {group.tags && group.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {group.tags.map((tag: GroupTag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary"
                            >
                              {t(`groupTags.${tag}` as Parameters<typeof t>[0])}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-mono mt-1">
                      {(() => {
                        const { highlightStart, highlightEnd } = getGroupTimeHighlight(hoveredViolation, group);
                        return (
                          <>
                            <span className={highlightStart ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                              {group.effectiveScheduleStartTime.substring(0, 5)}
                            </span>
                            <span className="text-muted-foreground">–</span>
                            <span className={highlightEnd ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                              {group.effectiveScheduleEndTime.substring(0, 5)}
                            </span>
                          </>
                        );
                      })()}
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
                          scheduleStart={groupDayWindows.get(`${group.groupId}_${day}`)?.start ?? group.effectiveScheduleStartTime}
                          scheduleEnd={groupDayWindows.get(`${group.groupId}_${day}`)?.end ?? group.effectiveScheduleEndTime}
                          editable={editable}
                          onResizeBlock={(id, start, end) =>
                            updateTimeBlock({ annexId, annexTimeBlockId: id, startTime: start, endTime: end })
                          }
                          onDeleteBlock={(id) => deleteTimeBlock({ annexId, annexTimeBlockId: id })}
                          onEditBlock={handleEditBlock}
                          onBlockMouseMove={(e, block) => {
                            const isOpening = openingBlockIds.has(block.id);
                            const isClosing = closingBlockIds.has(block.id);
                            if (!isOpening && !isClosing) return;
                            const content = isOpening && isClosing
                              ? `${t('draftPlan.opening')} & ${t('draftPlan.closing')}`
                              : isOpening
                                ? t('draftPlan.opening')
                                : t('draftPlan.closing');
                            setTooltip({ x: e.clientX, y: e.clientY, content });
                          }}
                          onBlockMouseLeave={() => setTooltip(null)}
                        />
                      )}
                    </td>
                  );
                })}
                <td className={cn('border border-border px-3 py-2 text-right font-mono text-xs transition-colors group-hover:bg-muted-foreground/20', teacher?.defaultGroupId === group.groupId ? 'font-semibold' : 'text-muted-foreground', hoveredSummaryTeacherId === teacher?.teacherId && 'bg-muted-foreground/20', isCellHighlighted(hoveredViolation, { groupId: group.groupId, teacherId: teacher?.teacherId ?? null }, null) && hoveredViolation?.violationType !== 'TEACHER_OVERLAPPING_TIME_BLOCKS' && 'ring-2 ring-inset ring-destructive')}>
                  {teacher ? `${weeklyHours(allBlocks, group.groupId, teacher.teacherId)}h` : '—'}
                </td>
                <td className={cn('border border-border px-3 py-2 text-right font-mono text-xs transition-colors group-hover:bg-muted-foreground/20', teacher?.defaultGroupId === group.groupId && 'font-semibold', hoveredSummaryTeacherId === teacher?.teacherId && 'bg-muted-foreground/20', isCellHighlighted(hoveredViolation, { groupId: group.groupId, teacherId: teacher?.teacherId ?? null }, null) && hoveredViolation?.violationType !== 'TEACHER_OVERLAPPING_TIME_BLOCKS' && 'ring-2 ring-inset ring-destructive')}>
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
                    } else if (!teacher.defaultGroupId) {
                      const totalHours = allBlocks
                        .filter((b) => b.teacherId === teacher.teacherId)
                        .reduce((sum, b) => sum + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0) / 60;
                      const minH = effectiveMinHours(rules, teacher.teacherId);
                      if (minH === null) return <span className="text-muted-foreground">—</span>;
                      const diff = totalHours - minH;
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
        <div className="flex items-center border-b border-border px-3 py-1.5 gap-2 shrink-0">
          <button
            onClick={() => setShowViolations((v) => !v)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full border transition-colors',
              showViolations
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
            )}
          >
            {t('violations.title')}
            {allViolations.length > 0 && (
              <span className={cn('ml-1.5', showViolations ? 'text-primary-foreground/80' : 'text-destructive')}>
                ({allViolations.length})
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSummary((v) => !v)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full border transition-colors',
              showSummary
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
            )}
          >
            {t('draftPlan.hoursSummary')}
          </button>
          <button
            onClick={() => setShowOpenClose((v) => !v)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full border transition-colors',
              showOpenClose
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
            )}
          >
            {t('draftPlan.openCloseTitle')}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setBottomPanelOpen((o) => !o)}
            className="rounded p-1 mr-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {bottomPanelOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {bottomPanelOpen && (showViolations || showSummary || showOpenClose) && (
          <div className="flex flex-1 min-h-0">
            {showViolations && (
              <div className={cn('overflow-auto flex-1 px-4 py-3', (showSummary || showOpenClose) && 'border-r border-border')}>
                {allViolations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('violations.noViolations')}</p>
                ) : (
                  <table className="text-sm">
                    <tbody>
                      {[...allViolations]
                        .sort((a, b) =>
                          a.violationType === 'TEACHER_OVERLAPPING_TIME_BLOCKS' && b.violationType !== 'TEACHER_OVERLAPPING_TIME_BLOCKS' ? -1
                          : b.violationType === 'TEACHER_OVERLAPPING_TIME_BLOCKS' && a.violationType !== 'TEACHER_OVERLAPPING_TIME_BLOCKS' ? 1
                          : a.violationType === 'BLOCK_OUTSIDE_GROUP_HOURS' && b.violationType !== 'BLOCK_OUTSIDE_GROUP_HOURS' ? -1
                          : b.violationType === 'BLOCK_OUTSIDE_GROUP_HOURS' && a.violationType !== 'BLOCK_OUTSIDE_GROUP_HOURS' ? 1
                          : 0
                        )
                        .map((v, i) => (
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
              <div className={cn('overflow-auto flex-1 px-4 py-3', showOpenClose && 'border-r border-border')}>
                <HoursSummaryTable teachers={teachers} allBlocks={allBlocks} rules={rules} onTeacherMouseEnter={setHoveredSummaryTeacherId} onTeacherMouseLeave={() => setHoveredSummaryTeacherId(null)} />
              </div>
            )}
            {showOpenClose && (
              <div className="overflow-auto flex-1 px-4 py-3">
                <OpenCloseSummary allBlocks={allBlocks} teachers={teachers} />
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
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                className="border border-border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">{t('draftPlan.endTime', 'End time')}</label>
              <input
                type="time"
                value={editModal.endTime}
                onChange={(e) => setEditModal({ ...editModal, endTime: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
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

      {showGenerateConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowGenerateConfirm(false)}
        >
          <div
            className="bg-background rounded-lg shadow-lg border border-border p-5 w-80 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold">{t('draftPlan.generateConfirmTitle', 'Generate schedule')}</h3>
            <p className="text-sm text-muted-foreground">{t('draftPlan.generateConfirmBody', 'This will delete all existing template blocks and generate a new schedule. Continue?')}</p>
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="flex-1 rounded bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {t('draftPlan.generate', 'Generate')}
              </button>
              <button
                onClick={() => setShowGenerateConfirm(false)}
                className="rounded border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {generateResult && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-background border border-border rounded-lg shadow-lg px-4 py-3 text-sm max-w-sm">
          <span>
            {generateResult.violationCount === 0
              ? t('draftPlan.generateSuccess', { count: generateResult.blocksCreated, defaultValue: `${generateResult.blocksCreated} blocks generated.` })
              : t('draftPlan.generatePartial', { count: generateResult.blocksCreated, violations: generateResult.violationCount, defaultValue: `${generateResult.blocksCreated} blocks generated with ${generateResult.violationCount} remaining violations.` })}
          </span>
          <button onClick={() => setGenerateResult(null)} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">✕</button>
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
