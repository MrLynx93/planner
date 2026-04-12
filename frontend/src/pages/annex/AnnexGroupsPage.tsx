import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { GripVertical, X } from 'lucide-react';
import type { AnnexDto, AnnexGroupDto } from '@/components/schedule/types';
import {
  useGetAnnexGroupsQuery,
  useAddAnnexGroupMutation,
  useRemoveAnnexGroupMutation,
} from '@/store/annexesApi';
import { useGetGroupsQuery } from '@/store/groupsApi';

export function AnnexGroupsPage() {
  const { t } = useTranslation();
  const annex = useOutletContext<AnnexDto>();
  const isReadOnly = annex.state === 'FINISHED';

  const { data: annexGroups = [], isLoading } = useGetAnnexGroupsQuery(
    annex.id!
  );
  const { data: allGroups = [] } = useGetGroupsQuery();
  const [addGroup] = useAddAnnexGroupMutation();
  const [removeGroup] = useRemoveAnnexGroupMutation();

  const [isDragOver, setIsDragOver] = useState(false);

  const assignedGroupIds = new Set(annexGroups.map((ag) => ag.groupId));
  const availableGroups = allGroups.filter((g) => !assignedGroupIds.has(g.id!));

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const groupId = Number(e.dataTransfer.getData('groupId'));
    if (!groupId) return;
    await addGroup({
      annexId: annex.id!,
      dto: { id: null, annexId: annex.id!, groupId, groupName: '' },
    });
  }

  async function handleRemove(ag: AnnexGroupDto) {
    await removeGroup({ annexId: annex.id!, annexGroupId: ag.id! });
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
            <p className="text-sm text-muted-foreground">
              {t('common.loading')}
            </p>
          ) : annexGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('common.noItems')}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {annexGroups.map((ag) => (
                <div
                  key={ag.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="font-medium">{ag.groupName}</span>
                  {!isReadOnly && (
                    <button
                      className="text-muted-foreground hover:text-destructive transition-colors rounded p-0.5"
                      onClick={() => handleRemove(ag)}
                    >
                      <X size={14} />
                    </button>
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
            <p className="text-sm text-muted-foreground">
              {t('common.noItems')}
            </p>
          ) : (
            availableGroups.map((g) => (
              <div
                key={g.id}
                draggable={!isReadOnly}
                onDragStart={(e) =>
                  e.dataTransfer.setData('groupId', String(g.id))
                }
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm select-none hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing"
              >
                <GripVertical
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
                <span>{g.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
