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
const MEDIUM: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF6B7280' } };

function groupBorder(top: boolean, bottom: boolean): Partial<ExcelJS.Borders> {
  return { top: top ? MEDIUM : THIN, bottom: bottom ? MEDIUM : THIN, left: MEDIUM, right: MEDIUM };
}

function dayBorder(top: boolean, bottom: boolean, firstDay = false, lastDay = false): Partial<ExcelJS.Borders> {
  return {
    top: top ? MEDIUM : THIN,
    bottom: bottom ? MEDIUM : THIN,
    left: firstDay ? MEDIUM : THIN,
    right: lastDay ? MEDIUM : THIN,
  };
}

function teacherBorder(top: boolean, bottom: boolean): Partial<ExcelJS.Borders> {
  return { top: top ? MEDIUM : THIN, bottom: bottom ? MEDIUM : THIN, left: THIN, right: MEDIUM };
}

function hoursBorder(top: boolean, bottom: boolean): Partial<ExcelJS.Borders> {
  return { top: top ? MEDIUM : THIN, bottom: bottom ? MEDIUM : THIN, left: MEDIUM, right: THIN };
}

function overhoursBorder(top: boolean, bottom: boolean): Partial<ExcelJS.Borders> {
  return { top: top ? MEDIUM : THIN, bottom: bottom ? MEDIUM : THIN, left: THIN, right: MEDIUM };
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
  headerRow.height = 36;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: 'FF1F2937' } };
    cell.fill = solidFill('#E5E7EB');
    cell.border = { top: MEDIUM, bottom: MEDIUM, left: MEDIUM, right: MEDIUM };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  // ── Data rows ────────────────────────────────────────────────────────────
  const openingIds = computeOpeningIds(allBlocks);
  const closingIds = computeClosingIds(allBlocks);

  const GROUP_BG_COLORS_XL = [
    '#fefce8', '#f0fdf4', '#eff6ff', '#fdf2f8',
    '#faf5ff', '#fff7ed', '#f0f9ff', '#f0fdfa',
  ];
  let groupIndex = -1;

  let sheetRowIndex = 2;
  const pendingMerges: Array<{ startRow: number; size: number; bgColor: string }> = [];

  for (const { group, teacher, isFirstInGroup, isLastInGroup, groupSize } of rows) {
    if (!teacher) continue;
    if (isFirstInGroup) groupIndex++;
    const bgColor = GROUP_BG_COLORS_XL[groupIndex % GROUP_BG_COLORS_XL.length];
    const isDefault = teacher.defaultGroupId === group.groupId;
    const dayValues = WEEK_DAYS.map((day) =>
      dayBlocksCellValue(allBlocks, group.groupId, teacher.teacherId, day, openingIds, closingIds)
    );
    const hoursText = weeklyHoursText(allBlocks, group.groupId, teacher.teacherId);
    const overhours = overhoursValue(allBlocks, group, teacher, rules);
    const teacherName = `${teacher.firstName.charAt(0)}.${teacher.lastName}`;
    const MUTED = 'FF374151';

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
      cell.fill = solidFill(bgColor);

      if (col === 1) {
        // Group column
        cell.font = { bold: true, size: 10, color: { argb: 'FF374151' } };
        cell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
        cell.border = groupBorder(isFirstInGroup, isLastInGroup);
      } else if (col === 2) {
        // Teacher column
        cell.font = { bold: isDefault, size: 10, color: { argb: isDefault ? 'FF1F2937' : MUTED } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
        cell.border = teacherBorder(isFirstInGroup, isLastInGroup);
      } else if (col <= 2 + WEEK_DAYS.length) {
        // Day columns
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = dayBorder(isFirstInGroup, isLastInGroup, col === 3, col === 2 + WEEK_DAYS.length);
      } else if (col === 2 + WEEK_DAYS.length + 1) {
        // Hours column
        cell.font = { bold: isDefault, size: 10, color: { argb: isDefault ? 'FF1F2937' : MUTED } };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.border = hoursBorder(isFirstInGroup, isLastInGroup);
      } else {
        // Overhours column
        const isNeg = overhours.isNegative;
        cell.font = { bold: isDefault, size: 10, color: { argb: isNeg ? 'FFDC2626' : 'FF1F2937' } };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.border = overhoursBorder(isFirstInGroup, isLastInGroup);
      }
    });

    if (isFirstInGroup && groupSize > 1) {
      pendingMerges.push({ startRow: sheetRowIndex, size: groupSize, bgColor });
    }

    sheetRowIndex++;
  }

  // Apply merges after all rows are added — merging early causes ExcelJS to create
  // phantom rows internally, which makes addRow() skip indices and leave blank rows.
  for (const { startRow, size, bgColor } of pendingMerges) {
    sheet.mergeCells(startRow, 1, startRow + size - 1, 1);
    const mergedCell = sheet.getCell(startRow, 1);
    mergedCell.border = { top: MEDIUM, bottom: MEDIUM, left: MEDIUM, right: MEDIUM };
    mergedCell.fill = solidFill(bgColor);
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

export function printPlanTable(
  annexName: string,
  rows: ExportRow[],
  allBlocks: ScheduleBlock[],
  rules: RuleWithSourceDto[],
  labels: ExportLabels
): void {
  const openingIds = computeOpeningIds(allBlocks);
  const closingIds = computeClosingIds(allBlocks);

  function dayBlocksHtml(groupId: number, teacherId: number, day: DayOfWeek): string {
    const relevant = allBlocks
      .filter((b) => b.groupId === groupId && b.teacherId === teacherId && b.dayOfWeek === day)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    if (!relevant.length) return '';
    return relevant
      .map((b) => {
        const isOpening = openingIds.has(b.id);
        const isClosing = closingIds.has(b.id);
        const s = shortTime(b.startTime);
        const e = shortTime(b.endTime);
        if (!isOpening && !isClosing) return `${s}-${e}`;
        return `${isOpening ? `<strong>${s}</strong>` : s}-${isClosing ? `<strong>${e}</strong>` : e}`;
      })
      .join('<br>');
  }

  const GROUP_BG_COLORS = [
    '#fefce8', '#f0fdf4', '#eff6ff', '#fdf2f8',
    '#faf5ff', '#fff7ed', '#f0f9ff', '#f0fdfa',
  ];

  let bodyRows = '';
  let groupIndex = -1;
  for (const { group, teacher, isFirstInGroup, groupSize } of rows) {
    if (!teacher) continue;
    if (isFirstInGroup) groupIndex++;
    const bg = GROUP_BG_COLORS[groupIndex % GROUP_BG_COLORS.length];
    const bgStyle = `background-color:${bg}`;

    const dailyMins =
      timeToMinutes(group.effectiveScheduleEndTime) - timeToMinutes(group.effectiveScheduleStartTime);
    const dailyRaw = dailyMins / 60;
    const dailyH = Number.isInteger(dailyRaw) ? String(dailyRaw) : dailyRaw.toFixed(1);
    const weeklyRaw = dailyRaw * 5;
    const weeklyH = Number.isInteger(weeklyRaw) ? String(weeklyRaw) : weeklyRaw.toFixed(1);
    const tagLine =
      group.tags && group.tags.length > 0
        ? group.tags.map((tag) => labels.groupTag(tag)).join(', ')
        : '';

    const totalMins = allBlocks
      .filter((b) => b.groupId === group.groupId && b.teacherId === teacher.teacherId)
      .reduce((sum, b) => sum + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0);
    const hoursText = `${(totalMins / 60).toFixed(1)}h`;

    const ov = overhoursValue(allBlocks, group, teacher, rules);
    const teacherName = `${teacher.firstName.charAt(0)}.${teacher.lastName}`;
    const isDefault = teacher.defaultGroupId === group.groupId;

    bodyRows += `<tr${isFirstInGroup ? ' class="group-start"' : ''}>`;

    if (isFirstInGroup) {
      bodyRows += `<td rowspan="${groupSize}" class="group-cell col-sep" style="${bgStyle}">
        <div class="group-name">${group.groupName}</div>
        ${tagLine ? `<div class="mono muted">${tagLine}</div>` : ''}
        <div class="mono muted">${shortTime(group.effectiveScheduleStartTime)}&ndash;${shortTime(group.effectiveScheduleEndTime)}</div>
        <div class="mono muted">${labels.groupHoursPerDay(dailyH)}</div>
        <div class="mono muted">${labels.groupHoursPerWeek(weeklyH)}</div>
      </td>`;
    }

    bodyRows += `<td class="${isDefault ? 'bold' : 'muted'} col-sep" style="${bgStyle}">${teacherName}</td>`;
    for (const day of WEEK_DAYS) {
      const isFriday = day === 'FRIDAY';
      bodyRows += `<td class="${isFriday ? 'col-sep' : ''}" style="${bgStyle}">${dayBlocksHtml(group.groupId, teacher.teacherId, day)}</td>`;
    }
    bodyRows += `<td class="num ${isDefault ? 'bold' : 'muted'}" style="${bgStyle}">${hoursText}</td>`;
    bodyRows += `<td class="num ${isDefault ? 'bold' : ''} ${ov.isNegative ? 'red' : ''}" style="${bgStyle}">${ov.text}</td>`;

    bodyRows += '</tr>';
  }

  const headerCells = [
    `<th class="col-sep">${labels.group}</th>`,
    `<th class="col-sep">${labels.teacher}</th>`,
    ...WEEK_DAYS.map((d) => `<th${d === 'FRIDAY' ? ' class="col-sep"' : ''}>${labels.days[d]}</th>`),
    `<th>${labels.hours}</th>`,
    `<th>${labels.overhours}</th>`,
  ].join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${annexName}</title>
<style>
@page { size: A4 landscape; margin: 1cm; }
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: Arial, sans-serif; font-size: 9pt; color: #1f2937; }
h1 { font-size: 12pt; text-align: center; margin-bottom: 8px; font-weight: 700; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; border: 2px solid #374151; }
th, td { border: 1px solid #d1d5db; border-top: 1px solid #9ca3af; padding: 3px 5px; vertical-align: middle; font-size: 8pt; }
th { background: #e5e7eb; border-top: 1px solid #9ca3af; font-weight: 600; text-align: center; word-break: break-word; }
td { word-break: break-word; }
tr.group-start > td { border-top: 2px solid #374151; }
th:first-child, td.group-cell { width: 14%; }
th:nth-child(2), tr > td:first-child:not(.group-cell) { width: 12%; }
th:nth-last-child(2) { width: 9%; }
th:last-child { width: 9%; }
.group-cell { text-align: center; vertical-align: top; }
.col-sep { border-right: 2px solid #374151; }
.group-name { font-weight: 700; margin-bottom: 2px; }
.mono { font-family: monospace; font-size: 7.5pt; }
.muted { color: #374151; }
.bold { font-weight: 700; }
.num { text-align: right; font-family: monospace; white-space: nowrap; }
.red { color: #dc2626; }
</style>
</head>
<body>
<h1>${annexName}</h1>
<table>
<thead><tr>${headerCells}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
</body>
</html>`;

  const electronAPI = (window as unknown as Record<string, unknown>).electronAPI as
    | { printToPDF: (html: string, fileName: string) => Promise<void> }
    | undefined;

  if (electronAPI) {
    electronAPI.printToPDF(html, annexName);
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;visibility:hidden;';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open();
  doc.write(html);
  doc.close();
  const originalTitle = document.title;
  document.title = annexName;
  iframe.contentWindow!.focus();
  iframe.contentWindow!.print();
  iframe.contentWindow!.addEventListener('afterprint', () => {
    document.title = originalTitle;
    document.body.removeChild(iframe);
  });
}
