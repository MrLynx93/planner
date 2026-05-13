import { useTranslation } from 'react-i18next';

interface Props {
  currentAnnexName: string | null;

  filterItems: { id: number; label: string }[];
  selectedFilterId: number | null;
  onFilterChange: (id: number | null) => void;
  filterPlaceholder: string;

  showExceptions?: boolean;
  onShowExceptionsChange?: (v: boolean) => void;
}

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';


export function ScheduleHeader({
  currentAnnexName,
  filterItems,
  selectedFilterId,
  onFilterChange,
  filterPlaceholder,
  showExceptions,
  onShowExceptionsChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3 shrink-0">
      {/* Annex label */}
      {currentAnnexName && (
        <span className="text-sm font-medium text-foreground/80 px-1">
          {currentAnnexName}
        </span>
      )}

      <select
        className={selectClass}
        value={selectedFilterId ?? ''}
        onChange={(e) =>
          onFilterChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">{filterPlaceholder}</option>
        {filterItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>

      {/* Exceptions toggle */}
      {onShowExceptionsChange && (
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <button
            role="switch"
            aria-checked={showExceptions}
            type="button"
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${showExceptions ? 'bg-primary' : 'bg-border'}`}
            onClick={() => onShowExceptionsChange(!showExceptions)}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${showExceptions ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
            />
          </button>
          {t('schedule.showExceptions')}
        </label>
      )}

    </div>
  );
}
