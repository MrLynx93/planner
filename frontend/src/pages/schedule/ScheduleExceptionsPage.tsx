import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, AlertTriangle, Trash2 } from 'lucide-react';
import {
  useGetAnnexesQuery,
  useGetAnnexTeachersQuery,
  useGetAnnexTimeBlocksQuery,
} from '@/store/annexesApi';
import {
  useGetExceptionsQuery,
  useCreateExceptionMutation,
  useDeleteExceptionMutation,
  type CreateExceptionRequest,
} from '@/store/exceptionsApi';
import type {
  ExceptionDto,
  ExceptionModificationDto,
  ExceptionReason,
} from '@/components/schedule/types';
import { ExceptionWizardDialog } from '@/components/exceptions/ExceptionWizardDialog';

const REASON_COLORS: Record<ExceptionReason, string> = {
  SICK_LEAVE: 'bg-red-100 text-red-700 border-red-200',
  VACATION: 'bg-blue-100 text-blue-700 border-blue-200',
  DELEGATION: 'bg-purple-100 text-purple-700 border-purple-200',
  EXCHANGE: 'bg-orange-100 text-orange-700 border-orange-200',
  OVERTIME: 'bg-green-100 text-green-700 border-green-200',
  SCHEDULE_ADJUSTMENT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

function isIncomplete(mods: ExceptionModificationDto[]): boolean {
  const removes = mods.filter((m) => m.type === 'REMOVE');
  const adds = mods.filter((m) => m.type === 'ADD');
  return removes.length > 0 && adds.length < removes.length;
}

function dateRange(mods: ExceptionModificationDto[]): string {
  if (mods.length === 0) return '–';
  const dates = mods.map((m) => m.date).sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  return first === last ? first : `${first} – ${last}`;
}

function affectedTeachers(mods: ExceptionModificationDto[]): string {
  const seen = new Set<string>();
  const names: string[] = [];
  mods.forEach((m) => {
    const name = `${m.teacherFirstName} ${m.teacherLastName}`;
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  });
  return names.join(', ');
}

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none';

export function ScheduleExceptionsPage() {
  const { t } = useTranslation();

  const [selectedAnnexId, setSelectedAnnexId] = useState<number | null>(null);
  const [filterReason, setFilterReason] = useState<ExceptionReason | ''>('');
  const [filterTeacherId, setFilterTeacherId] = useState<number | ''>('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: annexes = [] } = useGetAnnexesQuery();
  const { data: exceptions = [], isLoading } = useGetExceptionsQuery(
    selectedAnnexId!,
    { skip: selectedAnnexId === null }
  );
  const { data: teachers = [] } = useGetAnnexTeachersQuery(selectedAnnexId!, {
    skip: selectedAnnexId === null,
  });
  const { data: allBlocks = [] } = useGetAnnexTimeBlocksQuery(
    selectedAnnexId!,
    { skip: selectedAnnexId === null }
  );

  const [createException] = useCreateExceptionMutation();
  const [deleteException] = useDeleteExceptionMutation();

  // Auto-select CURRENT annex
  useEffect(() => {
    if (annexes.length > 0 && selectedAnnexId === null) {
      const current = annexes.find((a) => a.state === 'CURRENT');
      setSelectedAnnexId((current ?? annexes[0]).id);
    }
  }, [annexes, selectedAnnexId]);

  const selectedAnnex = annexes.find((a) => a.id === selectedAnnexId) ?? null;
  const isReadOnly = selectedAnnex?.state === 'FINISHED';

  const REASONS: ExceptionReason[] = [
    'SICK_LEAVE',
    'VACATION',
    'DELEGATION',
    'EXCHANGE',
    'OVERTIME',
    'SCHEDULE_ADJUSTMENT',
  ];

  const filtered = exceptions.filter((ex) => {
    if (filterReason && ex.reason !== filterReason) return false;
    if (filterTeacherId) {
      const teacherName = teachers.find(
        (tc) => tc.teacherId === filterTeacherId
      );
      if (teacherName) {
        const name = `${teacherName.firstName} ${teacherName.lastName}`;
        const involves = ex.modifications.some(
          (m) => `${m.teacherFirstName} ${m.teacherLastName}` === name
        );
        if (!involves) return false;
      }
    }
    return true;
  });

  const handleCreate = async (request: CreateExceptionRequest) => {
    if (!selectedAnnexId) return;
    await createException({ annexId: selectedAnnexId, request }).unwrap();
  };

  const handleDelete = async (id: number) => {
    if (!selectedAnnexId) return;
    await deleteException({
      annexId: selectedAnnexId,
      exceptionId: id,
    }).unwrap();
    setConfirmDeleteId(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3 shrink-0">
        <h1 className="text-sm font-semibold">
          {t('pages.scheduleExceptions.title')}
        </h1>

        <select
          className={selectClass}
          value={selectedAnnexId ?? ''}
          onChange={(e) => {
            setSelectedAnnexId(e.target.value ? Number(e.target.value) : null);
            setFilterReason('');
            setFilterTeacherId('');
          }}
        >
          <option value="">{t('schedule.selectAnnex')}</option>
          {annexes.map((a) => (
            <option key={a.id} value={a.id!}>
              {a.name} ({t(`pages.annexes.states.${a.state}`)})
            </option>
          ))}
        </select>

        {isReadOnly && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {t('pages.scheduleExceptions.readOnly')}
          </span>
        )}

        <select
          className={selectClass}
          value={filterReason}
          onChange={(e) =>
            setFilterReason(e.target.value as ExceptionReason | '')
          }
        >
          <option value="">{t('pages.scheduleExceptions.allReasons')}</option>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {t(`exceptions.reasons.${r}`)}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filterTeacherId}
          onChange={(e) =>
            setFilterTeacherId(e.target.value ? Number(e.target.value) : '')
          }
        >
          <option value="">{t('pages.scheduleExceptions.allTeachers')}</option>
          {teachers.map((tc) => (
            <option key={tc.teacherId} value={tc.teacherId}>
              {tc.firstName} {tc.lastName}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        {!isReadOnly && selectedAnnexId && (
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t('pages.scheduleExceptions.new')}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {t('common.loading')}
          </div>
        ) : !selectedAnnexId ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {t('schedule.selectAnnex')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {t('common.noItems')}
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-4xl">
            {filtered.map((ex) => (
              <ExceptionCard
                key={ex.id}
                exception={ex}
                isReadOnly={isReadOnly}
                onDelete={(id) => setConfirmDeleteId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Wizard dialog */}
      {selectedAnnexId && (
        <ExceptionWizardDialog
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onSubmit={handleCreate}
          annexId={selectedAnnexId}
          teachers={teachers}
          allBlocks={allBlocks}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg border border-border bg-background p-6 shadow-lg w-80">
            <p className="text-sm mb-4">{t('common.confirmDelete')}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExceptionCard({
  exception,
  isReadOnly,
  onDelete,
}: {
  exception: ExceptionDto;
  isReadOnly: boolean;
  onDelete: (id: number) => void;
}) {
  const { t } = useTranslation();
  const incomplete = isIncomplete(exception.modifications);

  const displayTitle =
    exception.title ||
    `${affectedTeachers(exception.modifications)} – ${t(`exceptions.reasons.${exception.reason}`)}`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{displayTitle}</span>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${REASON_COLORS[exception.reason]}`}
          >
            {t(`exceptions.reasons.${exception.reason}`)}
          </span>
          {incomplete && (
            <span className="flex items-center gap-1 text-xs text-yellow-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('pages.scheduleExceptions.incomplete')}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {dateRange(exception.modifications)}
          {exception.modifications.length > 0 && (
            <span className="ml-2">
              {affectedTeachers(exception.modifications)}
            </span>
          )}
          {exception.note && (
            <span className="ml-2 italic">"{exception.note}"</span>
          )}
        </div>
      </div>

      {!isReadOnly && (
        <button
          onClick={() => onDelete(exception.id)}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
          aria-label={t('common.delete')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
