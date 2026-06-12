import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import type { AnnexDto } from '@/components/schedule/types';
import { ALL_RULE_TYPES, RULE_NEEDS_TEACHER, RULE_NEEDS_GROUP } from '@/types';
import type { AnnexRuleDto, RuleWithSourceDto, RuleType } from '@/types';
import {
  useGetAnnexRulesCombinedQuery,
  useGetAnnexTeachersQuery,
  useGetAnnexGroupsQuery,
  useCreateAnnexRuleMutation,
  useUpdateAnnexRuleMutation,
  useDeleteAnnexRuleMutation,
} from '@/store/annexesApi';

interface VirtualRow {
  key: string;
  ruleType: RuleType;
  teacherId: number | null;
  groupId: number | null;
  /** null = "all teachers" or "all groups" default row */
  entityLabel: string | null;
  /** Annex-level rule for this exact entity, if defined */
  annexRule: RuleWithSourceDto | undefined;
  /** Rule this entity inherits if no annex-specific rule exists */
  inheritedRule: RuleWithSourceDto | undefined;
}

export function AnnexRulesPage() {
  const { t } = useTranslation();
  const annex = useOutletContext<AnnexDto>();
  const isReadOnly = annex.state === 'FINISHED';

  const { data: rules = [], isLoading } = useGetAnnexRulesCombinedQuery(annex.id!);
  const { data: teachers = [] } = useGetAnnexTeachersQuery(annex.id!);
  const { data: groups = [] } = useGetAnnexGroupsQuery(annex.id!);
  const [createRule] = useCreateAnnexRuleMutation();
  const [updateRule] = useUpdateAnnexRuleMutation();
  const [deleteRule] = useDeleteAnnexRuleMutation();

  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [defineKey, setDefineKey] = useState<string | null>(null);
  const [defineValue, setDefineValue] = useState('');

  // Index existing rules
  const annexRuleByKey = new Map<string, RuleWithSourceDto>();
  const globalRuleByKey = new Map<string, RuleWithSourceDto>();
  for (const r of rules) {
    const k = `${r.ruleType}|${r.teacherId ?? ''}|${r.groupId ?? ''}`;
    if (r.annexRuleId !== null) annexRuleByKey.set(k, r);
    else globalRuleByKey.set(k, r);
  }

  // Build virtual rows grouped by rule type
  const rowsByType = new Map<RuleType, VirtualRow[]>();
  for (const rt of ALL_RULE_TYPES) {
    const allKey = `${rt}||`;
    const allAnnex = annexRuleByKey.get(allKey);
    const allGlobal = globalRuleByKey.get(allKey);
    const rows: VirtualRow[] = [];

    if (RULE_NEEDS_TEACHER.includes(rt)) {
      rows.push({
        key: allKey,
        ruleType: rt,
        teacherId: null,
        groupId: null,
        entityLabel: null,
        annexRule: allAnnex,
        inheritedRule: allGlobal,
      });
      for (const teacher of teachers) {
        const specificKey = `${rt}|${teacher.teacherId}|`;
        rows.push({
          key: specificKey,
          ruleType: rt,
          teacherId: teacher.teacherId,
          groupId: null,
          entityLabel: `${teacher.firstName} ${teacher.lastName}`,
          annexRule: annexRuleByKey.get(specificKey),
          inheritedRule:
            allAnnex ??
            globalRuleByKey.get(specificKey) ??
            allGlobal,
        });
      }
    } else if (RULE_NEEDS_GROUP.includes(rt)) {
      rows.push({
        key: allKey,
        ruleType: rt,
        teacherId: null,
        groupId: null,
        entityLabel: null,
        annexRule: allAnnex,
        inheritedRule: allGlobal,
      });
      for (const group of groups) {
        const specificKey = `${rt}||${group.groupId}`;
        rows.push({
          key: specificKey,
          ruleType: rt,
          teacherId: null,
          groupId: group.groupId,
          entityLabel: group.groupName,
          annexRule: annexRuleByKey.get(specificKey),
          inheritedRule:
            allAnnex ??
            globalRuleByKey.get(specificKey) ??
            allGlobal,
        });
      }
    }
    rowsByType.set(rt, rows);
  }

  function openEdit(annexRuleId: number, value: number) {
    setDefineKey(null);
    setEditId(annexRuleId);
    setEditValue(String(value));
  }

  async function handleUpdate(annexRuleId: number) {
    if (!editValue) return;
    await updateRule({ annexId: annex.id!, annexRuleId, intValue: Number(editValue) });
    setEditId(null);
  }

  async function handleDelete(annexRuleId: number) {
    await deleteRule({ annexId: annex.id!, annexRuleId });
  }

  function openDefine(row: VirtualRow) {
    setEditId(null);
    setDefineKey(row.key);
    setDefineValue(row.inheritedRule ? String(row.inheritedRule.intValue) : '');
  }

  async function handleDefine(row: VirtualRow) {
    if (!defineValue) return;
    const dto: AnnexRuleDto = {
      id: null,
      annexId: annex.id!,
      ruleId: null,
      ruleType: row.ruleType,
      teacherId: row.teacherId,
      teacherFirstName: null,
      teacherLastName: null,
      groupId: row.groupId,
      groupName: null,
      intValue: Number(defineValue),
    };
    await createRule({ annexId: annex.id!, dto });
    setDefineKey(null);
  }

  function allEntityLabel(rt: RuleType) {
    return RULE_NEEDS_TEACHER.includes(rt)
      ? t('pages.globalRules.allTeachers')
      : t('pages.globalRules.allGroups');
  }

  return (
    <div className="flex flex-col gap-4 p-6 w-full max-w-4xl">
      <h1 className="text-xl font-semibold">{t('pages.draftAnnex.rules.title')}</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground bg-muted/30">
                <th className="px-4 py-2 font-medium">{t('pages.rules.entity')}</th>
                <th className="px-4 py-2 font-medium w-28">{t('pages.rules.value')}</th>
                <th className="px-4 py-2 font-medium w-44" />
                <th className="px-4 py-2 font-medium w-40" />
              </tr>
            </thead>
            <tbody>
              {ALL_RULE_TYPES.map((rt) => {
                const rows = rowsByType.get(rt) ?? [];
                return (
                  <>
                    {/* Section header */}
                    <tr key={`header-${rt}`} className="bg-muted/20 border-t border-border">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-sm font-semibold text-foreground tracking-wide"
                      >
                        {t(`ruleTypes.${rt}`)}
                      </td>
                    </tr>

                    {rows.map((row) => {
                      const isAllRow = row.entityLabel === null;
                      const isEditing = row.annexRule != null && editId === row.annexRule.annexRuleId;
                      const isDefining = defineKey === row.key;
                      const hasAnnex = row.annexRule != null;
                      const hasInherited = !hasAnnex && row.inheritedRule != null;

                      return (
                        <tr
                          key={row.key}
                          className="border-t border-border/50 hover:bg-muted/10 transition-colors"
                        >
                          {/* Entity label */}
                          <td className={`py-2 align-middle ${isAllRow ? 'px-4 italic text-muted-foreground' : 'pl-8 pr-4'}`}>
                            {isAllRow ? allEntityLabel(rt) : row.entityLabel}
                          </td>

                          {/* Value */}
                          <td className="px-4 py-2 align-middle">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                className="rounded-md border border-border bg-background px-2 py-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-20 h-7"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdate(row.annexRule!.annexRuleId!)}
                                autoFocus
                              />
                            ) : isDefining ? (
                              <input
                                type="number"
                                min="0"
                                className="rounded-md border border-border bg-background px-2 py-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-20 h-7"
                                value={defineValue}
                                onChange={(e) => setDefineValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleDefine(row)}
                                autoFocus
                              />
                            ) : hasAnnex ? (
                              <span>{row.annexRule!.intValue}</span>
                            ) : hasInherited ? (
                              <span className="text-muted-foreground">{row.inheritedRule!.intValue}</span>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>

                          {/* Badge */}
                          <td className="px-4 py-2 align-middle">
                            {!isEditing && !isDefining && (
                              hasAnnex ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  {t('pages.rules.sourceAnnex')}
                                </span>
                              ) : hasInherited ? (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                  {row.inheritedRule!.annexRuleId === null
                                    ? t('pages.rules.sourceSetGlobally')
                                    : t('pages.rules.sourceSetOnAnnex')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                                  {t('pages.rules.notDefined')}
                                </span>
                              )
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-2 align-middle">
                            {!isReadOnly && (
                              <div className="flex justify-end gap-2">
                                {hasAnnex && !isEditing && (
                                  <>
                                    <button
                                      className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                                      onClick={() => openEdit(row.annexRule!.annexRuleId!, row.annexRule!.intValue)}
                                    >
                                      {t('common.edit')}
                                    </button>
                                    <button
                                      className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors min-w-[5.5rem] text-center"
                                      onClick={() => handleDelete(row.annexRule!.annexRuleId!)}
                                    >
                                      {t('common.delete')}
                                    </button>
                                  </>
                                )}
                                {hasAnnex && isEditing && (
                                  <>
                                    <button
                                      className="rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors"
                                      onClick={() => handleUpdate(row.annexRule!.annexRuleId!)}
                                    >
                                      {t('common.save')}
                                    </button>
                                    <button
                                      className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                                      onClick={() => setEditId(null)}
                                    >
                                      {t('common.cancel')}
                                    </button>
                                  </>
                                )}
                                {!hasAnnex && !isDefining && (
                                  <button
                                    className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors min-w-[5.5rem] text-center"
                                    onClick={() => openDefine(row)}
                                  >
                                    {t('pages.rules.define')}
                                  </button>
                                )}
                                {!hasAnnex && isDefining && (
                                  <>
                                    <button
                                      className="rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors"
                                      onClick={() => handleDefine(row)}
                                    >
                                      {t('common.save')}
                                    </button>
                                    <button
                                      className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                                      onClick={() => setDefineKey(null)}
                                    >
                                      {t('common.cancel')}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
