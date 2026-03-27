import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnnexDto } from '@/components/schedule/types'
import {
  useGetAnnexesQuery,
  useCreateAnnexMutation,
  useUpdateAnnexMutation,
  useDeleteAnnexMutation,
} from '@/store/annexesApi'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

function toTimeInput(time: string): string {
  // Backend sends "HH:mm:ss", input[type=time] needs "HH:mm"
  return time ? time.substring(0, 5) : ''
}

function fromTimeInput(time: string): string {
  // Input gives "HH:mm", backend needs "HH:mm:ss"
  return time ? `${time}:00` : ''
}

const emptyForm = { name: '', startDate: '', endDate: '', openingTime: '', closingTime: '' }

export function AnnexesPage() {
  const { t } = useTranslation()

  const [editTarget, setEditTarget] = useState<'new' | AnnexDto | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: annexes = [], isLoading } = useGetAnnexesQuery()
  const [createAnnex] = useCreateAnnexMutation()
  const [updateAnnex] = useUpdateAnnexMutation()
  const [deleteAnnex] = useDeleteAnnexMutation()

  function set(field: keyof typeof emptyForm, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function openAdd() {
    setEditTarget('new')
    setForm(emptyForm)
  }

  function openEdit(annex: AnnexDto) {
    setEditTarget(annex)
    setForm({
      name: annex.name,
      startDate: annex.startDate,
      endDate: annex.endDate ?? '',
      openingTime: toTimeInput(annex.openingTime),
      closingTime: toTimeInput(annex.closingTime),
    })
  }

  async function handleSave() {
    if (!form.name.trim() || !form.startDate || !form.openingTime || !form.closingTime) return
    const dto: AnnexDto = {
      id: editTarget === 'new' ? null : (editTarget as AnnexDto).id,
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate || null,
      openingTime: fromTimeInput(form.openingTime),
      closingTime: fromTimeInput(form.closingTime),
    }
    if (editTarget === 'new') {
      await createAnnex(dto)
    } else {
      await updateAnnex(dto)
    }
    setEditTarget(null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return
    await deleteAnnex(id)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('pages.annexes.title')}</h1>
        {editTarget === null && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={openAdd}
          >
            {t('pages.annexes.add')}
          </button>
        )}
      </div>

      {editTarget !== null && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">
            {editTarget === 'new' ? t('pages.annexes.add') : t('common.edit')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">{t('common.name')}</label>
              <input
                className={`${inputClass} w-full`}
                value={form.name}
                onChange={e => set('name', e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('pages.annexes.startDate')}</label>
              <input
                type="date"
                className={`${inputClass} w-full`}
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('pages.annexes.endDate')}</label>
              <input
                type="date"
                className={`${inputClass} w-full`}
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('pages.annexes.openingTime')}</label>
              <input
                type="time"
                className={`${inputClass} w-full`}
                value={form.openingTime}
                onChange={e => set('openingTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('pages.annexes.closingTime')}</label>
              <input
                type="time"
                className={`${inputClass} w-full`}
                value={form.closingTime}
                onChange={e => set('closingTime', e.target.value)}
              />
            </div>
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
      ) : annexes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">{t('common.name')}</th>
              <th className="pb-2 pr-4 font-medium">{t('pages.annexes.startDate')}</th>
              <th className="pb-2 pr-4 font-medium">{t('pages.annexes.endDate')}</th>
              <th className="pb-2 pr-4 font-medium">{t('pages.annexes.openingTime')}</th>
              <th className="pb-2 pr-4 font-medium">{t('pages.annexes.closingTime')}</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {annexes.map(annex => (
              <tr key={annex.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-medium">{annex.name}</td>
                <td className="py-2 pr-4">{annex.startDate}</td>
                <td className="py-2 pr-4">{annex.endDate ?? '—'}</td>
                <td className="py-2 pr-4">{toTimeInput(annex.openingTime)}</td>
                <td className="py-2 pr-4">{toTimeInput(annex.closingTime)}</td>
                <td className="py-2">
                  <div className="flex gap-2 justify-end">
                    <button
                      className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                      onClick={() => openEdit(annex)}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => handleDelete(annex.id!)}
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
