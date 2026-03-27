import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TeacherDto } from '@/types'
import {
  useGetTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} from '@/store/teachersApi'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function TeachersPage() {
  const { t } = useTranslation()

  const [editTarget, setEditTarget] = useState<'new' | TeacherDto | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const { data: teachers = [], isLoading } = useGetTeachersQuery()
  const [createTeacher] = useCreateTeacherMutation()
  const [updateTeacher] = useUpdateTeacherMutation()
  const [deleteTeacher] = useDeleteTeacherMutation()

  function openAdd() {
    setEditTarget('new')
    setFirstName('')
    setLastName('')
  }

  function openEdit(teacher: TeacherDto) {
    setEditTarget(teacher)
    setFirstName(teacher.firstName)
    setLastName(teacher.lastName)
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) return
    if (editTarget === 'new') {
      await createTeacher({ id: null, firstName: firstName.trim(), lastName: lastName.trim() })
    } else {
      await updateTeacher({ ...(editTarget as TeacherDto), firstName: firstName.trim(), lastName: lastName.trim() })
    }
    setEditTarget(null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await deleteTeacher(id)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('pages.teachers.title')}</h1>
        {editTarget === null && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={openAdd}
          >
            {t('pages.teachers.add')}
          </button>
        )}
      </div>

      {editTarget !== null && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">
            {editTarget === 'new' ? t('pages.teachers.add') : t('common.edit')}
          </h2>
          <div className="flex gap-3 flex-wrap">
            <input
              className={inputClass}
              placeholder={t('common.firstName')}
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <input
              className={inputClass}
              placeholder={t('common.lastName')}
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
              onClick={handleSave}
            >
              {t('common.save')}
            </button>
            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              onClick={() => setEditTarget(null)}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : teachers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">{t('common.firstName')}</th>
              <th className="pb-2 pr-4 font-medium">{t('common.lastName')}</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {teachers.map(teacher => (
              <tr key={teacher.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4">{teacher.firstName}</td>
                <td className="py-2 pr-4">{teacher.lastName}</td>
                <td className="py-2">
                  <div className="flex gap-2 justify-end">
                    <button
                      className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                      onClick={() => openEdit(teacher)}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => handleDelete(teacher.id!)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
