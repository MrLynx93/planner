import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const inputClass =
  'w-full rounded-md border border-border bg-background px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const btnPrimary =
  'w-16 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors'
const btnSecondary =
  'w-16 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors'
const btnDestructive =
  'w-16 rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors'

export interface ColumnDef {
  key: string
  header: string
  placeholder?: string
}

interface EditableTableProps<T extends { id: number | null }> {
  columns: ColumnDef[]
  rows: T[]
  onAdd: (values: Record<string, string>) => Promise<unknown>
  onSave: (item: T, values: Record<string, string>) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
}

export function EditableTable<T extends { id: number | null }>({
  columns,
  rows,
  onAdd,
  onSave,
  onDelete,
}: EditableTableProps<T>) {
  const { t } = useTranslation()

  const emptyValues = () => Object.fromEntries(columns.map(c => [c.key, '']))

  const [newValues, setNewValues] = useState<Record<string, string>>(emptyValues)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>(emptyValues)

  function openEdit(item: T) {
    setEditingId(item.id!)
    setEditValues(Object.fromEntries(columns.map(c => [c.key, String((item as Record<string, unknown>)[c.key] ?? '')])))
  }

  async function handleAdd() {
    if (columns.some(c => !newValues[c.key]?.trim())) return
    await onAdd(Object.fromEntries(columns.map(c => [c.key, newValues[c.key].trim()])))
    setNewValues(emptyValues())
  }

  async function handleSave(item: T) {
    if (columns.some(c => !editValues[c.key]?.trim())) return
    await onSave(item, Object.fromEntries(columns.map(c => [c.key, editValues[c.key].trim()])))
    setEditingId(null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await onDelete(id)
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          {columns.map(col => (
            <th key={col.key} className="pb-2 pl-[11px] pr-4 font-medium">
              {col.header}
            </th>
          ))}
          <th className="pb-2 font-medium" />
        </tr>
      </thead>
      <tbody>
        <tr className="h-11 border-b border-border">
          {columns.map(col => (
            <td key={col.key} className="pr-4 align-middle">
              <input
                className={inputClass}
                placeholder={col.placeholder ?? col.header}
                value={newValues[col.key]}
                onChange={e => setNewValues(v => ({ ...v, [col.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </td>
          ))}
          <td className="align-middle">
            <div className="flex gap-2 justify-end">
              <button className={btnPrimary} onClick={handleAdd}>
                {t('common.add')}
              </button>
            </div>
          </td>
        </tr>

        {rows.map(item =>
          editingId === item.id ? (
            <tr key={item.id!} className="h-11 border-b border-border last:border-0">
              {columns.map((col, i) => (
                <td key={col.key} className="pr-4 align-middle">
                  <input
                    className={inputClass}
                    value={editValues[col.key]}
                    onChange={e => setEditValues(v => ({ ...v, [col.key]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSave(item)}
                    autoFocus={i === 0}
                  />
                </td>
              ))}
              <td className="align-middle">
                <div className="flex gap-2 justify-end">
                  <button className={btnPrimary} onClick={() => handleSave(item)}>
                    {t('common.save')}
                  </button>
                  <button className={btnSecondary} onClick={() => setEditingId(null)}>
                    {t('common.cancel')}
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={item.id!} className="h-11 border-b border-border last:border-0">
              {columns.map(col => (
                <td key={col.key} className="pr-4 pl-[11px] align-middle">
                  {String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
              <td className="align-middle">
                <div className="flex gap-2 justify-end">
                  <button className={btnSecondary} onClick={() => openEdit(item)}>
                    {t('common.edit')}
                  </button>
                  <button className={btnDestructive} onClick={() => handleDelete(item.id!)}>
                    {t('common.delete')}
                  </button>
                </div>
              </td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  )
}
