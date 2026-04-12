import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { GripVertical, X } from 'lucide-react';
import type { AnnexDto } from '@/components/schedule/types';
import type { AnnexChildGroupDto } from '@/types';
import {
  useGetAnnexGroupsQuery,
  useGetAnnexChildrenQuery,
  useAssignChildToAnnexMutation,
  useRemoveChildFromAnnexMutation,
} from '@/store/annexesApi';
import { useGetChildrenQuery } from '@/store/childrenApi';

export function AnnexChildrenPage() {
  const { t } = useTranslation();
  const annex = useOutletContext<AnnexDto>();
  const isReadOnly = annex.state === 'FINISHED';

  const { data: assignments = [], isLoading } = useGetAnnexChildrenQuery(
    annex.id!
  );
  const { data: annexGroups = [] } = useGetAnnexGroupsQuery(annex.id!);
  const { data: allChildren = [] } = useGetChildrenQuery();
  const [assignChild] = useAssignChildToAnnexMutation();
  const [removeChild] = useRemoveChildFromAnnexMutation();

  const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);

  const assignedChildIds = new Set(assignments.map((a) => a.childId));
  const availableChildren = allChildren.filter(
    (c) => !assignedChildIds.has(c.id!)
  );

  async function handleDrop(e: React.DragEvent, groupId: number) {
    e.preventDefault();
    setDragOverGroupId(null);
    const childId = Number(e.dataTransfer.getData('childId'));
    if (!childId) return;
    const existing = assignments.find((a) => a.childId === childId);
    if (existing?.groupId === groupId) return;
    if (existing) {
      await removeChild({
        annexId: annex.id!,
        annexChildGroupId: existing.id!,
      });
    }
    await assignChild({
      annexId: annex.id!,
      dto: {
        id: null,
        annexId: annex.id!,
        childId,
        childFirstName: '',
        childLastName: '',
        groupId,
        groupName: '',
      },
    });
  }

  async function handleRemove(a: AnnexChildGroupDto) {
    await removeChild({ annexId: annex.id!, annexChildGroupId: a.id! });
  }

  return (
    <div className="flex gap-6 p-6 h-full">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <h2 className="text-base font-semibold">
          {t('pages.draftAnnex.children.inAnnex')}
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : annexGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {annexGroups.map((group) => {
              const groupChildren = assignments.filter(
                (a) => a.groupId === group.groupId
              );
              const isOver = dragOverGroupId === group.groupId;
              return (
                <div
                  key={group.groupId}
                  className={`rounded-lg border-2 border-dashed p-3 flex flex-col gap-2 transition-colors ${isOver && !isReadOnly ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isReadOnly) setDragOverGroupId(group.groupId);
                  }}
                  onDragLeave={() => setDragOverGroupId(null)}
                  onDrop={
                    isReadOnly ? undefined : (e) => handleDrop(e, group.groupId)
                  }
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.groupName}
                  </span>
                  {groupChildren.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      {t('common.noItems')}
                    </p>
                  ) : (
                    groupChildren.map((a) => (
                      <div
                        key={a.id}
                        draggable={!isReadOnly}
                        onDragStart={(e) =>
                          e.dataTransfer.setData('childId', String(a.childId))
                        }
                        className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm select-none cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical
                          size={14}
                          className="text-muted-foreground shrink-0"
                        />
                        <span className="font-medium flex-1 min-w-0">
                          {a.childFirstName} {a.childLastName}
                        </span>
                        {!isReadOnly && (
                          <button
                            className="text-muted-foreground hover:text-destructive transition-colors rounded p-0.5"
                            onClick={() => handleRemove(a)}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <h2 className="text-base font-semibold">
          {t('pages.draftAnnex.children.available')}
        </h2>
        {availableChildren.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {availableChildren.map((child) => (
              <div
                key={child.id}
                draggable={!isReadOnly}
                onDragStart={(e) =>
                  e.dataTransfer.setData('childId', String(child.id))
                }
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm select-none hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing"
              >
                <GripVertical
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
                <span>
                  {child.firstName} {child.lastName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
