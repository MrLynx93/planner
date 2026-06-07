import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Trash2, AlertTriangle, X } from 'lucide-react';
import { useClearDatabaseMutation, useImportDatabaseMutation } from '@/store/adminApi';

type PendingAction = { type: 'import'; file: File } | { type: 'clear' };

function ConfirmDialog({
  action,
  onConfirm,
  onCancel,
}: {
  action: PendingAction;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const key = action.type === 'import' ? 'confirmImport' : 'confirmClear';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md mx-4 flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="text-base font-semibold">
              {t(`pages.advanced.${key}.title`)}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(`pages.advanced.${key}.message`)}
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdvancedPage() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const [clearDb] = useClearDatabaseMutation();
  const [importDb] = useImportDatabaseMutation();

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export');
      const blob = await res.blob();
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Planner_Database_${dd}_${mm}_${yyyy}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending({ type: 'import', file });
    e.target.value = '';
  }

  async function handleConfirm() {
    if (!pending) return;
    setPending(null);

    if (pending.type === 'clear') {
      await clearDb().unwrap();
    } else {
      setImporting(true);
      try {
        const formData = new FormData();
        formData.append('file', pending.file);
        await importDb(formData).unwrap();
      } finally {
        setImporting(false);
      }
    }
  }

  return (
    <>
      {pending && (
        <ConfirmDialog
          action={pending}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}

      <div className="p-6 flex flex-col gap-6 max-w-2xl">
        <h1 className="text-xl font-semibold">{t('pages.advanced.title')}</h1>

        {/* Export */}
        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">{t('pages.advanced.export.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('pages.advanced.export.description')}</p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 w-fit px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Download size={15} />
            {exporting ? t('common.loading') : t('pages.advanced.export.button')}
          </button>
        </section>

        {/* Import */}
        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">{t('pages.advanced.import.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('pages.advanced.import.description')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 w-fit px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Upload size={15} />
            {importing ? t('common.loading') : t('pages.advanced.import.button')}
          </button>
        </section>

        {/* Clear */}
        <section className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-4">
          <h2 className="text-sm font-semibold text-destructive">{t('pages.advanced.clear.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('pages.advanced.clear.description')}</p>
          <button
            onClick={() => setPending({ type: 'clear' })}
            className="flex items-center gap-2 w-fit px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
          >
            <Trash2 size={15} />
            {t('pages.advanced.clear.button')}
          </button>
        </section>
      </div>
    </>
  );
}
