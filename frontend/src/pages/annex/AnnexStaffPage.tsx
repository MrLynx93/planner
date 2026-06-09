import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, GripVertical, Pencil, Check } from 'lucide-react';
import type { AnnexDto, AnnexTeacherDto, AnnexGroupDto, GroupTag } from '@/components/schedule/types';
import type { TeacherDto, GroupDto } from '@/types';
import {
  useGetAnnexTeachersQuery,
  useGetAnnexGroupsQuery,
  useAddAnnexTeacherMutation,
  useUpdateAnnexTeacherMutation,
  useRemoveAnnexTeacherMutation,
  useAddAnnexGroupMutation,
  useUpdateAnnexGroupMutation,
  useRemoveAnnexGroupMutation,
} from '@/store/annexesApi';
import { useGetTeachersQuery } from '@/store/teachersApi';
import { useGetGroupsQuery } from '@/store/groupsApi';
import { cn } from '@/lib/utils';

const KEY_AVAILABLE = 'available-teacher-id';
const KEY_ANNEX = 'annex-teacher-id';
const KEY_TAG = 'group-tag';

const timeInputClass =
  'rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-28';

function toTimeInput(time: string | null): string {
  return time ? time.substring(0, 5) : '';
}

function fromTimeInput(value: string): string | null {
  return value ? `${value}:00` : null;
}

export function AnnexStaffPage() {
  const { t } = useTranslation();
  const annex = useOutletContext<AnnexDto>();
  const annexId = annex.id!;
  const isReadOnly = annex.state === 'FINISHED';

  const { data: annexTeachers = [] } = useGetAnnexTeachersQuery(annexId);
  const { data: annexGroups = [] } = useGetAnnexGroupsQuery(annexId);
  const { data: allTeachers = [] } = useGetTeachersQuery();
  const { data: allGroups = [] } = useGetGroupsQuery();

  const [addTeacher] = useAddAnnexTeacherMutation();
  const [updateTeacher] = useUpdateAnnexTeacherMutation();
  const [removeTeacher] = useRemoveAnnexTeacherMutation();
  const [addGroup] = useAddAnnexGroupMutation();
  const [updateGroup] = useUpdateAnnexGroupMutation();
  const [removeGroup] = useRemoveAnnexGroupMutation();

  const ALL_TAGS: GroupTag[] = ['AGE_3', 'AGE_4', 'AGE_5', 'AGE_6'];

  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
  const [dragOverTagGroupId, setDragOverTagGroupId] = useState<number | null>(null);
  const [draggingAnnexTeacher, setDraggingAnnexTeacher] = useState(false);
  const [dropOverPanel, setDropOverPanel] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const assignedTeacherIds = new Set(annexTeachers.map((at) => at.teacherId));
  const availableTeachers = allTeachers.filter((t) => !assignedTeacherIds.has(t.id!));

  const teachersForGroup = (groupId: number) =>
    annexTeachers.filter((at) => at.defaultGroupId === groupId);
  const unassignedTeachers = annexTeachers.filter((at) => at.defaultGroupId === null);

  function openEditHours(ag: AnnexGroupDto) {
    setEditingGroupId(ag.id);
    setEditStart(toTimeInput(ag.scheduleStartTime));
    setEditEnd(toTimeInput(ag.scheduleEndTime));
  }

  async function saveEditHours(ag: AnnexGroupDto) {
    await updateGroup({
      annexId,
      annexGroupId: ag.id,
      scheduleStartTime: fromTimeInput(editStart),
      scheduleEndTime: fromTimeInput(editEnd),
      tags: ag.tags ?? [],
    });
    setEditingGroupId(null);
  }

  async function handleTagToggle(ag: AnnexGroupDto, tag: GroupTag) {
    const current = ag.tags ?? [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    await updateGroup({
      annexId,
      annexGroupId: ag.id,
      scheduleStartTime: ag.scheduleStartTime,
      scheduleEndTime: ag.scheduleEndTime,
      tags: next,
    });
  }

  async function handleGroupToggle(g: GroupDto, include: boolean) {
    if (include) {
      await addGroup({
        annexId,
        dto: {
          id: null,
          annexId,
          groupId: g.id!,
          groupName: g.name,
          scheduleStartTime: null,
          scheduleEndTime: null,
          effectiveScheduleStartTime: '',
          effectiveScheduleEndTime: '',
          tags: [],
        },
      });
    } else {
      const ag = annexGroups.find((ag) => ag.groupId === g.id);
      if (!ag) return;
      await removeGroup({ annexId, annexGroupId: ag.id });
    }
  }

  async function handleDrop(e: React.DragEvent, targetGroupId: number | null) {
    e.preventDefault();
    setDragOverColumn(null);

    const availableId = Number(e.dataTransfer.getData(KEY_AVAILABLE));
    const annexTeacherId = Number(e.dataTransfer.getData(KEY_ANNEX));

    if (availableId) {
      const teacher = allTeachers.find((t) => t.id === availableId);
      if (!teacher) return;
      await addTeacher({
        annexId,
        dto: {
          id: null,
          annexId,
          teacherId: availableId,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          defaultGroupId: targetGroupId,
          defaultGroupName: null,
        },
      });
    } else if (annexTeacherId) {
      const at = annexTeachers.find((a) => a.id === annexTeacherId);
      if (!at || at.defaultGroupId === targetGroupId) return;
      await updateTeacher({
        annexId,
        annexTeacherId,
        dto: { ...at, defaultGroupId: targetGroupId, defaultGroupName: null },
      });
    }
  }

  async function handleRemoveTeacher(at: AnnexTeacherDto) {
    await removeTeacher({ annexId, annexTeacherId: at.id });
  }

  function renderTeacherChip(at: AnnexTeacherDto) {
    return (
      <div
        key={at.id}
        draggable={!isReadOnly}
        onDragStart={(e) => {
          e.dataTransfer.setData(KEY_ANNEX, String(at.id));
          e.stopPropagation();
          setDraggingAnnexTeacher(true);
        }}
        onDragEnd={() => {
          setDraggingAnnexTeacher(false);
          setDropOverPanel(false);
        }}
        className={cn(
          'flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1.5 text-sm',
          !isReadOnly && 'cursor-grab active:cursor-grabbing select-none hover:bg-accent/40'
        )}
      >
        {!isReadOnly && (
          <GripVertical size={12} className="text-muted-foreground shrink-0" />
        )}
        <span className="flex-1 min-w-0 truncate">
          {at.firstName} {at.lastName}
        </span>
        {!isReadOnly && (
          <button
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0 rounded p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTeacher(at);
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT: Groups table */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 flex flex-col gap-4">
          <h1 className="text-xl font-semibold">{t('pages.annexStaff.title')}</h1>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
                  <th className="w-px px-3 py-2 text-left font-medium whitespace-nowrap">{t('pages.annexStaff.includeInAnnex')}</th>
                  <th className="w-px px-3 py-2 text-left font-medium whitespace-nowrap">{t('pages.annexStaff.groups')}</th>
                  <th className="w-px px-3 py-2 text-left font-medium whitespace-nowrap">{t('pages.annexStaff.schedule')}</th>
                  <th className="px-3 py-2 text-left font-medium min-w-[180px]">{t('pages.annexStaff.tags')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('pages.annexStaff.teachers')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {allGroups.map((g: GroupDto) => {
                  const ag = annexGroups.find((annexGroup) => annexGroup.groupId === g.id);
                  const isIncluded = !!ag;
                  const teachers = ag ? teachersForGroup(ag.groupId) : [];
                  const isOver = dragOverColumn === g.id;
                  const isEditingHours = editingGroupId === ag?.id;
                  const hasCustomHours =
                    ag && (ag.scheduleStartTime !== null || ag.scheduleEndTime !== null);

                  return (
                    <tr
                      key={g.id}
                      className={cn(
                        'transition-colors hover:bg-muted/20',
                        !isIncluded && 'opacity-50'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          disabled={isReadOnly}
                          onChange={(e) => handleGroupToggle(g, e.target.checked)}
                          className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
                        />
                      </td>

                      {/* Group name */}
                      <td className="px-3 py-3 font-medium whitespace-nowrap">{g.name}</td>

                      {/* Schedule hours */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isIncluded && ag && (
                          isEditingHours ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="time"
                                className={timeInputClass}
                                value={editStart}
                                onChange={(e) => setEditStart(e.target.value)}
                              />
                              <span className="text-muted-foreground text-sm">–</span>
                              <input
                                type="time"
                                className={timeInputClass}
                                value={editEnd}
                                onChange={(e) => setEditEnd(e.target.value)}
                              />
                              <button
                                className="text-primary hover:text-primary/80 transition-colors p-1"
                                onClick={() => saveEditHours(ag)}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                onClick={() => setEditingGroupId(null)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'font-mono',
                                  hasCustomHours ? 'text-foreground' : 'text-muted-foreground'
                                )}
                              >
                                {ag.effectiveScheduleStartTime.substring(0, 5)}
                                {' – '}
                                {ag.effectiveScheduleEndTime.substring(0, 5)}
                              </span>
                              {!isReadOnly && (
                                <button
                                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                  onClick={() => openEditHours(ag)}
                                >
                                  <Pencil size={15} />
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </td>

                      {/* Tags */}
                      <td className="px-3 py-3 min-w-[180px]">
                        {isIncluded && ag && (
                          <div
                            className={cn(
                              'flex flex-wrap gap-1.5 min-h-[36px] rounded p-1 transition-colors',
                              dragOverTagGroupId === ag.id && !isReadOnly
                                ? 'bg-primary/10 outline outline-2 outline-dashed outline-primary'
                                : ''
                            )}
                            onDragOver={(e) => {
                              if (!e.dataTransfer.types.includes(KEY_TAG) || isReadOnly) return;
                              e.preventDefault();
                              setDragOverTagGroupId(ag.id);
                            }}
                            onDragLeave={() => setDragOverTagGroupId(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverTagGroupId(null);
                              const tag = e.dataTransfer.getData(KEY_TAG) as GroupTag;
                              if (!tag || (ag.tags ?? []).includes(tag)) return;
                              handleTagToggle(ag, tag);
                            }}
                          >
                            {(ag.tags ?? []).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                              >
                                {t(`groupTags.${tag}` as Parameters<typeof t>[0])}
                                {!isReadOnly && (
                                  <button
                                    className="hover:text-destructive transition-colors"
                                    onClick={() => handleTagToggle(ag, tag)}
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Teacher drop zone */}
                      <td className="px-3 py-3">
                        {isIncluded && (
                          <div
                            className={cn(
                              'flex flex-wrap gap-1.5 min-h-[36px] rounded p-1 transition-colors',
                              isOver && !isReadOnly
                                ? 'bg-primary/10 outline outline-2 outline-dashed outline-primary'
                                : ''
                            )}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (!isReadOnly) setDragOverColumn(g.id!);
                            }}
                            onDragLeave={() => setDragOverColumn(null)}
                            onDrop={(e) => handleDrop(e, g.id!)}
                          >
                            {teachers.map(renderTeacherChip)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {unassignedTeachers.length > 0 && (
                  <tr className="transition-colors hover:bg-muted/20 text-muted-foreground">
                    <td className="px-3 py-3 text-center">—</td>
                    <td className="px-3 py-3 italic text-sm">{t('pages.annexStaff.unassigned')}</td>
                    <td className="px-3 py-3" />
                    <td className="px-3 py-3" />
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5 min-h-[36px] rounded p-1">
                        {unassignedTeachers.map(renderTeacherChip)}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* RIGHT: Available teachers */}
      <div
        className={cn(
          'w-56 shrink-0 overflow-auto border-l border-border transition-colors',
          dropOverPanel && 'bg-muted/50'
        )}
        onDragOver={(e) => {
          if (!draggingAnnexTeacher) return;
          e.preventDefault();
          setDropOverPanel(true);
        }}
        onDragLeave={() => setDropOverPanel(false)}
        onDrop={(e) => {
          setDropOverPanel(false);
          setDraggingAnnexTeacher(false);
          const annexTeacherId = Number(e.dataTransfer.getData(KEY_ANNEX));
          if (!annexTeacherId) return;
          const at = annexTeachers.find((a) => a.id === annexTeacherId);
          if (at) removeTeacher({ annexId, annexTeacherId: at.id });
        }}
      >
        <div className="p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{t('pages.annexStaff.tags')}</h2>
          <div className="flex flex-col gap-1">
            {ALL_TAGS.map((tag) => (
              <div
                key={tag}
                draggable={!isReadOnly}
                onDragStart={(e) => e.dataTransfer.setData(KEY_TAG, tag)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-sm select-none',
                  !isReadOnly
                    ? 'cursor-grab active:cursor-grabbing hover:bg-accent'
                    : 'opacity-50 cursor-default'
                )}
              >
                {!isReadOnly && <GripVertical size={12} className="text-muted-foreground shrink-0" />}
                <span>{t(`groupTags.${tag}` as Parameters<typeof t>[0])}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border" />
          <h2 className="text-sm font-semibold">{t('pages.annexStaff.availableTeachers')}</h2>
          {availableTeachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {availableTeachers.map((teacher: TeacherDto) => (
                <div
                  key={teacher.id}
                  draggable={!isReadOnly}
                  onDragStart={(e) => e.dataTransfer.setData(KEY_AVAILABLE, String(teacher.id))}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-sm select-none',
                    !isReadOnly
                      ? 'cursor-grab active:cursor-grabbing hover:bg-accent'
                      : 'opacity-50'
                  )}
                >
                  <GripVertical size={12} className="text-muted-foreground shrink-0" />
                  <span>{teacher.firstName} {teacher.lastName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
