import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { GripVertical, X, Pencil, Check } from 'lucide-react';
import type { AnnexDto, AnnexGroupDto } from '@/components/schedule/types';
import {
  useGetAnnexGroupsQuery,
  useAddAnnexGroupMutation,
  useUpdateAnnexGroupMutation,
  useRemoveAnnexGroupMutation,
} from '@/store/annexesApi';
import { useGetGroupsQuery } from '@/store/groupsApi';

const timeInputClass =
  'rounded border border-border bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring w-24';

function toTimeInput(time: string | null): string {
  return time ? time.substring(0, 5) : '';
}

function fromTimeInput(value: string): string | null {
  return value ? `${value}:00` : null;
}

export function AnnexGroupsPage() {
  const { t } = useTranslation();
  const annex = useOutletContext<AnnexDto>();
  const isReadOnly = annex.state === 'FINISHED';

  const { data: annexGroups = [], isLoading } = useGetAnnexGroupsQuery(annex.id!);
  const { data: allGroups = [] } = useGetGroupsQuery();
  const [addGroup] = useAddAnnexGroupMutation();
  const [updateGroup] = useUpdateAnnexGroupMutation();
  const [removeGroup] = useRemoveAnnexGroupMutation();

  const [isDragOver, setIsDragOver] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const assignedGroupIds = new Set(annexGroups.map((ag) => ag.groupId));
  const availableGroups = allGroups.filter((g) => !assignedGroupIds.has(g.id!));

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const groupId = Number(e.dataTransfer.getData('groupId'));
    if (!groupId) return;
    await addGroup({
      annexId: annex.id!,
      dto: {
        id: null,
        annexId: annex.id!,
        groupId,
        groupName: '',
        scheduleStartTime: null,
        scheduleEndTime: null,
        effectiveScheduleStartTime: '',
        effectiveScheduleEndTime: '',
        tags: [],
      },
    });
  }

  function openEdit(ag: AnnexGroupDto) {
    setEditingId(ag.id);
    setEditStart(toTimeInput(ag.scheduleStartTime));
    setEditEnd(toTimeInput(ag.scheduleEndTime));
  }

  async function handleSaveEdit(ag: AnnexGroupDto) {
    await updateGroup({
      annexId: annex.id!,
      annexGroupId: ag.id,
      scheduleStartTime: fromTimeInput(editStart),
      scheduleEndTime: fromTimeInput(editEnd),
    });
    setEditingId(null);
  }

  async function handleRemove(ag: AnnexGroupDto) {
    await removeGroup({ annexId: annex.id!, annexGroupId: ag.id });
  }

  return (
    <div className="flex gap-6 p-6">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <h2 className="text-base font-semibold">
          {t('pages.draftAnnex.groups.inAnnex')}
        </h2>
        <div
          className={`flex flex-col gap-3 rounded-lg border-2 border-dashed p-3 transition-colors ${isDragOver && !isReadOnly ? 'border-primary bg-primary/5' : 'border-border'}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isReadOnly) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={isReadOnly ? undefined : handleDrop}
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : annexGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {annexGroups.map((ag) => (
                <div
                  key={ag.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm gap-3"
                >
                  <span className="font-medium min-w-0 truncate">{ag.groupName}</span>
                  {editingId === ag.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="time"
                        className={timeInputClass}
                        value={editStart}
                        onChange={(e) => setEditStart(e.target.value)}
                      />
                      <span className="text-muted-foreground text-xs">–</span>
                      <input
                        type="time"
                        className={timeInputClass}
                        value={editEnd}
                        onChange={(e) => setEditEnd(e.target.value)}
                      />
                      <button
                        className="text-primary hover:text-primary/80 transition-colors rounded p-0.5"
                        onClick={() => handleSaveEdit(ag)}
                        title={t('common.save')}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors rounded p-0.5"
                        onClick={() => setEditingId(null)}
                        title={t('common.cancel')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground font-mono">
                        {ag.effectiveScheduleStartTime.substring(0, 5)}
                        {' – '}
                        {ag.effectiveScheduleEndTime.substring(0, 5)}
                        {ag.scheduleStartTime === null && ag.scheduleEndTime === null && (
                          <span className="ml-1 opacity-50">(default)</span>
                        )}
                      </span>
                      {!isReadOnly && (
                        <>
                          <button
                            className="text-muted-foreground hover:text-foreground transition-colors rounded p-0.5"
                            onClick={() => openEdit(ag)}
                            title={t('common.edit')}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="text-muted-foreground hover:text-destructive transition-colors rounded p-0.5"
                            onClick={() => handleRemove(ag)}
                            title={t('common.delete')}
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <h2 className="text-base font-semibold">
          {t('pages.draftAnnex.groups.available')}
        </h2>
        <div className="flex flex-col gap-1 p-3">
          {availableGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
          ) : (
            availableGroups.map((g) => (
              <div
                key={g.id}
                draggable={!isReadOnly}
                onDragStart={(e) => e.dataTransfer.setData('groupId', String(g.id))}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm select-none hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing"
              >
                <GripVertical size={14} className="text-muted-foreground shrink-0" />
                <span>{g.name}</span>
                {(g.scheduleStartTime || g.scheduleEndTime) && (
                  <span className="text-xs text-muted-foreground font-mono ml-auto">
                    {g.scheduleStartTime?.substring(0, 5) ?? '—'}
                    {' – '}
                    {g.scheduleEndTime?.substring(0, 5) ?? '—'}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
