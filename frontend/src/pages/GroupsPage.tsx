import { useTranslation } from 'react-i18next';
import {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} from '@/store/groupsApi';
import { EditableTable } from '@/components/EditableTable';

export function GroupsPage() {
  const { t } = useTranslation();
  const { data: groups = [], isLoading } = useGetGroupsQuery();
  const [createGroup] = useCreateGroupMutation();
  const [updateGroup] = useUpdateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();

  const columns = [{ key: 'name', header: t('common.name') }];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-xl font-semibold">{t('pages.groups.title')}</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <EditableTable
          columns={columns}
          rows={groups}
          onAdd={(v) => createGroup({ id: null, name: v.name })}
          onSave={(group, v) => updateGroup({ ...group, name: v.name })}
          onDelete={(id) => deleteGroup(id)}
        />
      )}
    </div>
  );
}
