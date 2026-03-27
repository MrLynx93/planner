import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChildDto } from '@/types'
import {
  useGetChildrenQuery,
  useCreateChildMutation,
  useUpdateChildMutation,
  useDeleteChildMutation,
  useGetChildAssignmentsQuery,
  useCreateChildAssignmentMutation,
} from '@/store/childrenApi'
import { useGetGroupsQuery } from '@/store/groupsApi'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

function ChildAssignments({ child }: { child: ChildDto }) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [groupId, setGroupId] = useState<number | null>(null)
  const [fromDate, setFromDate] = useState('')

  const { data: assignments = [] } = useGetChildAssignmentsQuery(child.id!)
  const { data: groups = [] } = useGetGroupsQuery()
  const [createAssignment] = useCreateChildAssignmentMutation()

  async function handleAssign() {
    if (!groupId || !fromDate) return
    await createAssignment({
      childId: child.id!,
      dto: {
        id: null,
        childId: child.id!,
        childFirstName: child.firstName,
        childLastName: child.lastName,
        groupId,
        groupName: '',
        fromDate,
        toDate: null,
      },
    })
    setAdding(false)
    setGroupId(null)
    setFromDate('')
  }

  return (
    <div className="mt-2 pl-4 border-l-2 border-border flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{t('pages.children.assignments')}</span>
        {!adding && (
          <button
            className="rounded-md border border-border px-2 py-0.5 text-xs hover:bg-accent transition-colors"
            onClick={() => setAdding(true)}
          >
            {t('pages.children.addAssignment')}
          </button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2 flex-wrap items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('pages.children.group')}</label>
            <select
              className={selectClass}
              value={groupId ?? ''}
              onChange={e => setGroupId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('pages.children.group')}</option>
              {groups.map(g => (
                <option key={g.id} value={g.id!}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('pages.children.fromDate')}</label>
            <input
              type="date"
              className={inputClass}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>
          <button
            className="rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-xs hover:bg-primary/90 transition-colors"
            onClick={handleAssign}
          >
            {t('common.save')}
          </button>
          <button
            className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent transition-colors"
            onClick={() => setAdding(false)}
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      {assignments.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {assignments.map(a => (
            <div key={a.id} className="flex items-center gap-3 text-xs">
              <span className="font-medium">{a.groupName}</span>
              <span className="text-muted-foreground">
                {a.fromDate} → {a.toDate ?? t('pages.children.active')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ChildrenPage() {
  const { t } = useTranslation()

  const [editTarget, setEditTarget] = useState<'new' | ChildDto | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: children = [], isLoading } = useGetChildrenQuery()
  const [createChild] = useCreateChildMutation()
  const [updateChild] = useUpdateChildMutation()
  const [deleteChild] = useDeleteChildMutation()

  function openAdd() {
    setEditTarget('new')
    setFirstName('')
    setLastName('')
  }

  function openEdit(child: ChildDto) {
    setEditTarget(child)
    setFirstName(child.firstName)
    setLastName(child.lastName)
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) return
    if (editTarget === 'new') {
      await createChild({ id: null, firstName: firstName.trim(), lastName: lastName.trim() })
    } else {
      await updateChild({ ...(editTarget as ChildDto), firstName: firstName.trim(), lastName: lastName.trim() })
    }
    setEditTarget(null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await deleteChild(id)
    if (expandedId === id) setExpandedId(null)
  }

  function toggleExpand(id: number) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('pages.children.title')}</h1>
        {editTarget === null && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={openAdd}
          >
            {t('pages.children.add')}
          </button>
        )}
      </div>

      {editTarget !== null && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">
            {editTarget === 'new' ? t('pages.children.add') : t('common.edit')}
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
      ) : children.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <div className="flex flex-col">
          {children.map(child => (
            <div key={child.id} className="border-b border-border last:border-0">
              <div className="flex items-center py-2 gap-3">
                <span className="flex-1 text-sm">
                  {child.firstName} {child.lastName}
                </span>
                <button
                  className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                  onClick={() => toggleExpand(child.id!)}
                >
                  {t('pages.children.assignments')}
                </button>
                <button
                  className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                  onClick={() => openEdit(child)}
                >
                  {t('common.edit')}
                </button>
                <button
                  className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => handleDelete(child.id!)}
                >
                  {t('common.delete')}
                </button>
              </div>
              {expandedId === child.id && <ChildAssignments child={child} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
