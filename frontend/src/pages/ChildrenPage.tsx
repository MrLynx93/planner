import { useTranslation } from 'react-i18next';
import {
  useGetChildrenQuery,
  useCreateChildMutation,
  useUpdateChildMutation,
  useDeleteChildMutation,
} from '@/store/childrenApi';
import { EditableTable } from '@/components/EditableTable';

export function ChildrenPage() {
  const { t } = useTranslation();
  const { data: children = [], isLoading } = useGetChildrenQuery();
  const [createChild] = useCreateChildMutation();
  const [updateChild] = useUpdateChildMutation();
  const [deleteChild] = useDeleteChildMutation();

  const columns = [
    { key: 'firstName', header: t('common.firstName') },
    { key: 'lastName', header: t('common.lastName') },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-xl font-semibold">{t('pages.children.title')}</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <EditableTable
          columns={columns}
          rows={children}
          onAdd={(v) =>
            createChild({
              id: null,
              firstName: v.firstName,
              lastName: v.lastName,
            })
          }
          onSave={(child, v) =>
            updateChild({
              ...child,
              firstName: v.firstName,
              lastName: v.lastName,
            })
          }
          onDelete={(id) => deleteChild(id)}
        />
      )}
    </div>
  );
}
