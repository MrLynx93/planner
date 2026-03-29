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
  'w-full rounded-md border border-border bg-background px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function TeachersPage() {
  const { t } = useTranslation()

  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')

  const { data: teachers = [], isLoading } = useGetTeachersQuery()
  const [createTeacher] = useCreateTeacherMutation()
  const [updateTeacher] = useUpdateTeacherMutation()
  const [deleteTeacher] = useDeleteTeacherMutation()

  function openEdit(teacher: TeacherDto) {
    setEditingId(teacher.id!)
    setEditFirstName(teacher.firstName)
    setEditLastName(teacher.lastName)
    setIsAdding(false)
  }

  async function handleAdd() {
    if (!newFirstName.trim() || !newLastName.trim()) return
    await createTeacher({ id: null, firstName: newFirstName.trim(), lastName: newLastName.trim() })
    setIsAdding(false)
  }

  async function handleSave(teacher: TeacherDto) {
    if (!editFirstName.trim() || !editLastName.trim()) return
    await updateTeacher({ ...teacher, firstName: editFirstName.trim(), lastName: editLastName.trim() })
    setEditingId(null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await deleteTeacher(id)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-xl font-semibold">{t('pages.teachers.title')}</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pl-11px pr-4 font-medium">{t('common.firstName')}</th>
              <th className="pb-2 pl-11px pr-4 font-medium">{t('common.lastName')}</th>
              <th className="pb-2 pl-11px font-medium" />
            </tr>
          </thead>
          <tbody>
            <tr className="h-11 border-b border-border">
                <td className="pr-4 align-middle">
                  <input
                    className={inputClass}
                    placeholder={t('common.firstName')}
                    value={newFirstName}
                    onChange={e => setNewFirstName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className="pr-4 align-middle">
                  <input
                    className={inputClass}
                    placeholder={t('common.lastName')}
                    value={newLastName}
                    onChange={e => setNewLastName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className="align-middle">
                  <div className="flex gap-2 justify-end">
                    <button
                      className="w-16 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors"
                      onClick={handleAdd}
                    >
                      {t('common.add')}
                    </button>
                  </div>
                </td>
              </tr>
            {teachers.map(teacher =>
              editingId === teacher.id ? (
                <tr key={teacher.id} className="h-11 border-b border-border last:border-0">
                  <td className="pr-4 align-middle">
                    <input
                      className={inputClass}
                      value={editFirstName}
                      onChange={e => setEditFirstName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSave(teacher)}
                      autoFocus
                    />
                  </td>
                  <td className="pr-4 align-middle">
                    <input
                      className={inputClass}
                      value={editLastName}
                      onChange={e => setEditLastName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSave(teacher)}
                    />
                  </td>
                  <td className="align-middle">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="w-16 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors"
                        onClick={() => handleSave(teacher)}
                      >
                        {t('common.save')}
                      </button>
                      <button
                        className="w-16 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                        onClick={() => setEditingId(null)}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={teacher.id} className="h-11 border-b border-border last:border-0">
                  <td className="pr-4 pl-11px align-middle">{teacher.firstName}</td>
                  <td className="pr-4 pl-11px align-middle">{teacher.lastName}</td>
                  <td className="align-middle">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="w-16 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                        onClick={() => openEdit(teacher)}
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        className="w-16 rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDelete(teacher.id!)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
