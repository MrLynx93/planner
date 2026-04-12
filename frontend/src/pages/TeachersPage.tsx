import { useTranslation } from 'react-i18next';
import {
  useGetTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} from '@/store/teachersApi';
import { EditableTable } from '@/components/EditableTable';

export function TeachersPage() {
  const { t } = useTranslation();
  const { data: teachers = [], isLoading } = useGetTeachersQuery();
  const [createTeacher] = useCreateTeacherMutation();
  const [updateTeacher] = useUpdateTeacherMutation();
  const [deleteTeacher] = useDeleteTeacherMutation();

  const columns = [
    { key: 'firstName', header: t('common.firstName') },
    { key: 'lastName', header: t('common.lastName') },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-xl font-semibold">{t('pages.teachers.title')}</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <EditableTable
          columns={columns}
          rows={teachers}
          onAdd={(v) =>
            createTeacher({
              id: null,
              firstName: v.firstName,
              lastName: v.lastName,
            })
          }
          onSave={(teacher, v) =>
            updateTeacher({
              ...teacher,
              firstName: v.firstName,
              lastName: v.lastName,
            })
          }
          onDelete={(id) => deleteTeacher(id)}
        />
      )}
    </div>
  );
}
