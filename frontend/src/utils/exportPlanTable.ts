import ExcelJS from 'exceljs';
import type { AnnexGroupDto, AnnexTeacherDto, DayOfWeek, ScheduleBlock } from '@/components/schedule/types';
import { WEEK_DAYS, timeToMinutes } from '@/components/schedule/utils';
import type { RuleWithSourceDto } from '@/types';

export interface ExportLabels {
  group: string;
  teacher: string;
  hours: string;
  overhours: string;
  days: Record<DayOfWeek, string>;
  groupHoursPerDay: (hours: string) => string;
  groupHoursPerWeek: (hours: string) => string;
  groupTag: (tag: string) => string;
}

// Convert CSS #rrggbb to ExcelJS ARGB (fully opaque)
function toArgb(hex: string): string {
  return 'FF' + hex.replace('#', '').toUpperCase();
}

function solidFill(hex: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb(hex) } };
}

function shortTime(time: string): string {
  const [h, m] = time.split(':');
  return `${parseInt(h)}:${m}`;
}

function computeOpeningIds(allBlocks: ScheduleBlock[]): Set<number> {
  const ids = new Set<number>();
  for (const day of WEEK_DAYS) {
    const dayBlocks = allBlocks.filter((b) => b.dayOfWeek === day);
    if (!dayBlocks.length) continue;
    const minStart = Math.min(...dayBlocks.map((b) => timeToMinutes(b.startTime)));
    dayBlocks.filter((b) => timeToMinutes(b.startTime) === minStart).forEach((b) => ids.add(b.id));
  }
  return ids;
}

function computeClosingIds(allBlocks: ScheduleBlock[]): Set<number> {
  const ids = new Set<number>();
  for (const day of WEEK_DAYS) {
    const dayBlocks = allBlocks.filter((b) => b.dayOfWeek === day);
    if (!dayBlocks.length) continue;
    const maxEnd = Math.max(...dayBlocks.map((b) => timeToMinutes(b.endTime)));
    dayBlocks.filter((b) => timeToMinutes(b.endTime) === maxEnd).forEach((b) => ids.add(b.id));
  }
  return ids;
}

type DayCellValue = string | ExcelJS.CellRichTextValue;

function countLines(value: DayCellValue): number {
  if (typeof value === 'string') return value ? value.split('\n').length : 1;
  const newlines = value.richText.reduce((n, run) => n + (run.text.match(/\n/g)?.length ?? 0), 0);
  return newlines + 1;
}

function dayBlocksCellValue(
  blocks: ScheduleBlock[],
  groupId: number,
  teacherId: number,
  day: DayOfWeek,
  openingIds: Set<number>,
  closingIds: Set<number>
): DayCellValue {
  const relevant = blocks
    .filter((b) => b.groupId === groupId && b.teacherId === teacherId && b.dayOfWeek === day)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  if (!relevant.length) return '';

  const hasMarked = relevant.some((b) => openingIds.has(b.id) || closingIds.has(b.id));
  if (!hasMarked) {
    return relevant.map((b) => `${shortTime(b.startTime)}-${shortTime(b.endTime)}`).join('\n');
  }

  const DARK = 'FF1F2937';
  const plain = (): Partial<ExcelJS.Font> => ({ size: 10, color: { argb: DARK } });
  const bold = (): Partial<ExcelJS.Font> => ({ size: 10, color: { argb: DARK }, bold: true });

  const richText: ExcelJS.RichText[] = [];
  relevant.forEach((b, i) => {
    const isOpening = openingIds.has(b.id);
    const isClosing = closingIds.has(b.id);
    if (i > 0) richText.push({ text: '\n', font: plain() });
    if (!isOpening && !isClosing) {
      richText.push({ text: `${shortTime(b.startTime)}-${shortTime(b.endTime)}`, font: plain() });
    } else {
      richText.push({ text: shortTime(b.startTime), font: isOpening ? bold() : plain() });
      richText.push({ text: '-', font: plain() });
      richText.push({ text: shortTime(b.endTime), font: isClosing ? bold() : plain() });
    }
  });

  return { richText };
}

function weeklyHoursText(blocks: ScheduleBlock[], groupId: number, teacherId: number): string {
  const mins = blocks
    .filter((b) => b.groupId === groupId && b.teacherId === teacherId)
    .reduce((sum, b) => sum + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0);
  return `${(mins / 60).toFixed(1)}h`;
}

const THIN: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF9CA3AF' } };
const NONE: Partial<ExcelJS.Border> = {};
const MEDIUM: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF6B7280' } };

function groupBorder(top: boolean, bottom: boolean): Partial<ExcelJS.Borders> {
  return { top: top ? MEDIUM : THIN, bottom: bottom ? MEDIUM : THIN, left: MEDIUM, right: MEDIUM };
}

function dayBorder(top: boolean, bottom: boolean, firstDay = false, lastDay = false): Partial<ExcelJS.Borders> {
  return {
    top: top ? MEDIUM : NONE,
    bottom: bottom ? MEDIUM : NONE,
    left: firstDay ? MEDIUM : THIN,
    right: lastDay ? MEDIUM : THIN,
  };
}

function teacherBorder(top: boolean, bottom: boolean): Partial<ExcelJS.Borders> {
  return { top: top ? MEDIUM : NONE, bottom: bottom ? MEDIUM : NONE, left: THIN, right: MEDIUM };
}

function hoursBorder(top: boolean, bottom: boolean): Partial<ExcelJS.Borders> {
  return { top: top ? MEDIUM : NONE, bottom: bottom ? MEDIUM : NONE, left: MEDIUM, right: THIN };
}

function overhoursBorder(top: boolean, bottom: boolean): Partial<ExcelJS.Borders> {
  return { top: top ? MEDIUM : NONE, bottom: bottom ? MEDIUM : NONE, left: THIN, right: MEDIUM };
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

function overhoursValue(
  blocks: ScheduleBlock[],
  group: AnnexGroupDto,
  teacher: AnnexTeacherDto,
  rules: RuleWithSourceDto[]
): { text: string; isNegative: boolean } {
  const mins = blocks
    .filter((b) => b.groupId === group.groupId && b.teacherId === teacher.teacherId)
    .reduce((sum, b) => sum + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0);
  const groupHours = mins / 60;

  if (teacher.defaultGroupId === group.groupId) {
    const minH = effectiveMinHours(rules, teacher.teacherId);
    if (minH === null) return { text: '—', isNegative: false };
    const diff = groupHours - minH;
    return { text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}h`, isNegative: diff < 0 };
  } else {
    if (groupHours === 0) return { text: '—', isNegative: false };
    return { text: `+${groupHours.toFixed(1)}h`, isNegative: false };
  }
}

interface ExportRow {
  group: AnnexGroupDto;
  teacher: AnnexTeacherDto | null;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  groupSize: number;
}

export async function exportPlanTableToExcel(
  annexName: string,
  rows: ExportRow[],
  allBlocks: ScheduleBlock[],
  rules: RuleWithSourceDto[],
  labels: ExportLabels
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Planner';

  const sheetName = annexName.replace(/[*?:\\/\[\]]/g, '-').substring(0, 31);
  const sheet = workbook.addWorksheet(sheetName, {
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9, // A4
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    },
    headerFooter: {
      oddHeader: `&C&B${annexName}`,
      oddFooter: '&CPage &P of &N',
    },
  });

  sheet.columns = [
    { width: 24 },
    { width: 11 },
    ...WEEK_DAYS.map(() => ({ width: 18 })),
    { width: 8 },
    { width: 10 },
  ];

  // ── Header row ──────────────────────────────────────────────────────────
  const headerRow = sheet.addRow([
    labels.group, labels.teacher, ...WEEK_DAYS.map((d) => labels.days[d]), labels.hours, labels.overhours,
  ]);
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: 'FF1F2937' } };
    cell.fill = solidFill('#E5E7EB');
    cell.border = { top: MEDIUM, bottom: MEDIUM, left: MEDIUM, right: MEDIUM };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // ── Data rows ────────────────────────────────────────────────────────────
  const openingIds = computeOpeningIds(allBlocks);
  const closingIds = computeClosingIds(allBlocks);

  let sheetRowIndex = 2;
  const pendingMerges: Array<{ startRow: number; size: number }> = [];

  for (const { group, teacher, isFirstInGroup, isLastInGroup, groupSize } of rows) {
    if (!teacher) continue;
    const dayValues = WEEK_DAYS.map((day) =>
      dayBlocksCellValue(allBlocks, group.groupId, teacher.teacherId, day, openingIds, closingIds)
    );
    const hoursText = weeklyHoursText(allBlocks, group.groupId, teacher.teacherId);
    const overhours = overhoursValue(allBlocks, group, teacher, rules);
    const teacherName = `${teacher.firstName.charAt(0)}.${teacher.lastName}`;

    const groupDailyMins =
      timeToMinutes(group.effectiveScheduleEndTime) - timeToMinutes(group.effectiveScheduleStartTime);
    const groupDailyRaw = groupDailyMins / 60;
    const groupDailyH = Number.isInteger(groupDailyRaw) ? String(groupDailyRaw) : groupDailyRaw.toFixed(1);
    const groupWeeklyRaw = groupDailyRaw * 5;
    const groupWeeklyH = Number.isInteger(groupWeeklyRaw) ? String(groupWeeklyRaw) : groupWeeklyRaw.toFixed(1);
    const tagLine =
      group.tags && group.tags.length > 0
        ? group.tags.map((tag) => labels.groupTag(tag)).join(', ')
        : null;
    const groupCellText = isFirstInGroup
      ? [
          group.groupName,
          ...(tagLine ? [tagLine] : []),
          `${shortTime(group.effectiveScheduleStartTime)}-${shortTime(group.effectiveScheduleEndTime)}`,
          labels.groupHoursPerDay(groupDailyH),
          labels.groupHoursPerWeek(groupWeeklyH),
        ].join('\n')
      : '';

    const dataRow = sheet.addRow([
      groupCellText,
      teacherName,
      ...dayValues,
      hoursText,
      overhours.text,
    ]);

    const maxLines = Math.max(1, ...dayValues.map(countLines));
    dataRow.height = Math.max(20, maxLines * 16);

    dataRow.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.font = { size: 10, color: { argb: 'FF1F2937' } };
      cell.alignment = { vertical: 'middle', wrapText: true };

      if (col === 1) {
        // Group column
        cell.font = { bold: true, size: 10, color: { argb: 'FF374151' } };
        cell.fill = solidFill('#F3F4F6');
        cell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
        cell.border = groupBorder(isFirstInGroup, isLastInGroup);
      } else if (col === 2) {
        // Teacher column
        cell.font = { bold: true, size: 10, color: { argb: 'FF1F2937' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
        cell.border = teacherBorder(isFirstInGroup, isLastInGroup);
      } else if (col <= 2 + WEEK_DAYS.length) {
        // Day columns
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = dayBorder(isFirstInGroup, isLastInGroup, col === 3, col === 2 + WEEK_DAYS.length);
      } else if (col === 2 + WEEK_DAYS.length + 1) {
        // Hours column
        cell.font = { bold: true, size: 10, color: { argb: 'FF1F2937' } };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.border = hoursBorder(isFirstInGroup, isLastInGroup);
      } else {
        // Overhours column
        const isNeg = overhours.isNegative;
        cell.font = { bold: teacher.defaultGroupId === group.groupId, size: 10, color: { argb: isNeg ? 'FFDC2626' : 'FF1F2937' } };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.border = overhoursBorder(isFirstInGroup, isLastInGroup);
      }
    });

    if (isFirstInGroup && groupSize > 1) {
      pendingMerges.push({ startRow: sheetRowIndex, size: groupSize });
    }

    sheetRowIndex++;
  }

  // Apply merges after all rows are added — merging early causes ExcelJS to create
  // phantom rows internally, which makes addRow() skip indices and leave blank rows.
  for (const { startRow, size } of pendingMerges) {
    sheet.mergeCells(startRow, 1, startRow + size - 1, 1);
    const mergedCell = sheet.getCell(startRow, 1);
    mergedCell.border = { top: MEDIUM, bottom: MEDIUM, left: MEDIUM, right: MEDIUM };
    mergedCell.fill = solidFill('#F3F4F6');
    mergedCell.font = { bold: true, size: 10, color: { argb: 'FF374151' } };
    mergedCell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
  }

  // ── Download ─────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${annexName}-plan.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
