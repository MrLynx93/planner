import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, GripVertical } from 'lucide-react';
import type { AnnexDto, AnnexTeacherDto, AnnexGroupDto } from '@/components/schedule/types';
import type { TeacherDto, GroupDto } from '@/types';
import {
  useGetAnnexTeachersQuery,
  useGetAnnexGroupsQuery,
  useAddAnnexTeacherMutation,
  useUpdateAnnexTeacherMutation,
  useRemoveAnnexTeacherMutation,
  useAddAnnexGroupMutation,
  useRemoveAnnexGroupMutation,
} from '@/store/annexesApi';
import { useGetTeachersQuery } from '@/store/teachersApi';
import { useGetGroupsQuery } from '@/store/groupsApi';
import { cn } from '@/lib/utils';

const KEY_AVAILABLE = 'available-teacher-id';
const KEY_ANNEX = 'annex-teacher-id';
const KEY_AVAILABLE_GROUP = 'available-group-id';

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
  const [removeGroup] = useRemoveAnnexGroupMutation();

  const [dragOverColumn, setDragOverColumn] = useState<number | 'unassigned' | null>(null);

  const assignedTeacherIds = new Set(annexTeachers.map((at) => at.teacherId));
  const assignedGroupIds = new Set(annexGroups.map((ag) => ag.groupId));
  const availableTeachers = allTeachers.filter((t) => !assignedTeacherIds.has(t.id!));
  const availableGroups = allGroups.filter((g) => !assignedGroupIds.has(g.id!));

  const teachersForGroup = (groupId: number) =>
    annexTeachers.filter((at) => at.defaultGroupId === groupId);
  const unassignedTeachers = annexTeachers.filter((at) => at.defaultGroupId === null);

  async function handleDrop(e: React.DragEvent, targetGroupId: number | null) {
    e.preventDefault();
    setDragOverColumn(null);

    const availableGroupId = Number(e.dataTransfer.getData(KEY_AVAILABLE_GROUP));
    if (availableGroupId) {
      const group = allGroups.find((g) => g.id === availableGroupId);
      if (!group) return;
      await addGroup({ annexId, dto: { id: null, annexId, groupId: availableGroupId, groupName: group.name } });
      return;
    }

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
    if (!window.confirm(t('common.confirmDelete'))) return;
    await removeTeacher({ annexId, annexTeacherId: at.id });
  }

  async function handleRemoveGroup(ag: AnnexGroupDto) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    await removeGroup({ annexId, annexGroupId: ag.id });
  }

  function renderTeacherChip(at: AnnexTeacherDto) {
    return (
      <div
        key={at.id}
        draggable={!isReadOnly}
        onDragStart={(e) => {
          e.dataTransfer.setData(KEY_ANNEX, String(at.id));
          e.stopPropagation();
        }}
        className={cn(
          'flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1.5 text-sm',
          !isReadOnly && 'cursor-grab active:cursor-grabbing select-none hover:bg-accent/40'
        )}
      >
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

  function renderGroupColumn(ag: AnnexGroupDto) {
    const teachers = teachersForGroup(ag.groupId);
    const isOver = dragOverColumn === ag.groupId;
    return (
      <div key={ag.groupId} className="flex flex-col gap-2 w-48 shrink-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-medium text-sm truncate">{ag.groupName}</span>
          {!isReadOnly && (
            <button
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-0.5"
              onClick={() => handleRemoveGroup(ag)}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div
          className={cn(
            'flex flex-col gap-1.5 flex-1 min-h-[80px] rounded-md border-2 border-dashed p-2 transition-colors',
            isOver && !isReadOnly ? 'border-primary bg-primary/5' : 'border-border/50'
          )}
          onDragOver={(e) => { e.preventDefault(); if (!isReadOnly) setDragOverColumn(ag.groupId); }}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={(e) => handleDrop(e, ag.groupId)}
        >
          {teachers.map(renderTeacherChip)}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto p-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t('pages.annexStaff.title')}</h1>

      {/* Assigned teachers — group columns */}
      <div className="flex gap-4 overflow-x-auto pb-2 items-start">
        {annexGroups.map(renderGroupColumn)}

        {/* Unassigned column */}
        <div className="flex flex-col gap-2 w-48 shrink-0">
          <span className="font-medium text-sm text-muted-foreground">
            {t('pages.annexStaff.groups')}
          </span>
          <div
            className={cn(
              'flex flex-col gap-1.5 flex-1 min-h-[80px] rounded-md border-2 border-dashed p-2 transition-colors',
              dragOverColumn === 'unassigned' && !isReadOnly
                ? 'border-primary bg-primary/5'
                : 'border-border/50'
            )}
            onDragOver={(e) => { e.preventDefault(); if (!isReadOnly) setDragOverColumn('unassigned'); }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, null)}
          >
            {unassignedTeachers.map(renderTeacherChip)}
          </div>
        </div>
      </div>

      {/* Available resources */}
      <div className="flex gap-4">
        {/* Available teachers */}
        <div className="flex-1 rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="text-sm font-medium">{t('pages.annexStaff.availableTeachers')}</h2>
          {availableTeachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
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

        {/* Available groups */}
        <div className="flex-1 rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="text-sm font-medium">{t('pages.annexStaff.availableGroups')}</h2>
          {availableGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableGroups.map((g: GroupDto) => (
                <div
                  key={g.id}
                  draggable={!isReadOnly}
                  onDragStart={(e) => e.dataTransfer.setData(KEY_AVAILABLE_GROUP, String(g.id))}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-sm select-none',
                    !isReadOnly
                      ? 'cursor-grab active:cursor-grabbing hover:bg-accent'
                      : 'opacity-50'
                  )}
                >
                  <GripVertical size={12} className="text-muted-foreground shrink-0" />
                  <span>{g.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
