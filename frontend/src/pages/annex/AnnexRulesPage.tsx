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

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full';
const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full';

function ruleKey(r: RuleWithSourceDto) {
  return `${r.ruleType}|${r.teacherId ?? ''}|${r.groupId ?? ''}`;
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

  const [ruleType, setRuleType] = useState<RuleType>('TEACHER_WEEKLY_HOURS_MIN');
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [intValue, setIntValue] = useState('');

  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const needsTeacher = RULE_NEEDS_TEACHER.includes(ruleType);
  const needsGroup = RULE_NEEDS_GROUP.includes(ruleType);

  const globalRules = rules.filter((r) => r.annexRuleId === null);
  const annexRules = rules.filter((r) => r.annexRuleId !== null);
  const annexRuleKeys = new Set(annexRules.map(ruleKey));
  const globalRuleByKey = new Map(globalRules.map((r) => [ruleKey(r), r]));

  const sorted = [...rules].sort((a, b) => {
    const aGlobal = a.annexRuleId === null ? 0 : 1;
    const bGlobal = b.annexRuleId === null ? 0 : 1;
    if (aGlobal !== bGlobal) return aGlobal - bGlobal;
    return ruleKey(a).localeCompare(ruleKey(b));
  });

  function resetForm() {
    setRuleType('TEACHER_WEEKLY_HOURS_MIN');
    setTeacherId(null);
    setGroupId(null);
    setIntValue('');
  }

  async function handleSave() {
    if (!intValue) return;
    const dto: AnnexRuleDto = {
      id: null,
      annexId: annex.id!,
      ruleId: null,
      ruleType,
      teacherId: needsTeacher ? teacherId : null,
      teacherFirstName: null,
      teacherLastName: null,
      groupId: needsGroup ? groupId : null,
      groupName: null,
      intValue: Number(intValue),
    };
    await createRule({ annexId: annex.id!, dto });
    resetForm();
  }

  function openEdit(annexRuleId: number, value: number) {
    setEditId(annexRuleId);
    setEditValue(String(value));
  }

  async function handleUpdate(annexRuleId: number) {
    if (!editValue) return;
    await updateRule({ annexId: annex.id!, annexRuleId, intValue: Number(editValue) });
    setEditId(null);
  }

  async function handleDelete(annexRuleId: number) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    await deleteRule({ annexId: annex.id!, annexRuleId });
  }

  function ruleLabel(rule: RuleWithSourceDto): string {
    const parts: string[] = [t(`ruleTypes.${rule.ruleType}`)];
    if (rule.teacherFirstName) {
      parts.push(`${rule.teacherFirstName} ${rule.teacherLastName}`);
    } else if (RULE_NEEDS_TEACHER.includes(rule.ruleType)) {
      parts.push(t('pages.globalRules.allTeachers'));
    }
    if (rule.groupName) {
      parts.push(rule.groupName);
    } else if (RULE_NEEDS_GROUP.includes(rule.ruleType)) {
      parts.push(t('pages.globalRules.allGroups'));
    }
    return parts.join(' — ');
  }

  return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <h1 className="text-xl font-semibold">{t('pages.draftAnnex.rules.title')}</h1>

      <div className="flex gap-6">
      {/* Table */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="rounded-lg border border-border p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">{t('pages.rules.ruleType')}</th>
                <th className="pb-2 pr-4 font-medium">{t('pages.rules.value')}</th>
                <th className="pb-2 pr-4 font-medium" />
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((rule) => {
                const isGlobal = rule.annexRuleId === null;
                const key = ruleKey(rule);
                const isOverridden = isGlobal && annexRuleKeys.has(key);
                const globalValue = !isGlobal ? globalRuleByKey.get(key)?.intValue : undefined;
                const isEditing = !isGlobal && editId === rule.annexRuleId;

                return (
                  <tr
                    key={`${rule.annexRuleId ?? 'g'}-${rule.ruleId}`}
                    className={`border-b border-border last:border-0 h-10 ${isOverridden ? 'opacity-40' : ''}`}
                  >
                    <td className="pr-4 align-middle">{ruleLabel(rule)}</td>
                    <td className="pr-4 align-middle">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          className="rounded-md border border-border bg-background px-2.5 py-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-24 h-7"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className={isOverridden ? 'line-through' : ''}>
                          {rule.intValue}
                        </span>
                      )}
                      {globalValue !== undefined && !isEditing && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (global: {globalValue})
                        </span>
                      )}
                    </td>
                    <td className="pr-4 align-middle">
                      {isGlobal ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {t('pages.rules.sourceGlobal')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {t('pages.rules.sourceAnnex')}
                        </span>
                      )}
                    </td>
                    <td className="align-middle">
                      {!isGlobal && !isReadOnly && (
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                className="rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors"
                                onClick={() => handleUpdate(rule.annexRuleId!)}
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
                          ) : (
                            <>
                              <button
                                className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                                onClick={() => openEdit(rule.annexRuleId!, rule.intValue)}
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => handleDelete(rule.annexRuleId!)}
                              >
                                {t('common.delete')}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        </div>
      </div>

      {/* Add form — hidden for read-only annexes */}
      {!isReadOnly && (
        <div className="flex-1">
          <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
            <h2 className="font-medium text-sm">{t('pages.rules.add')}</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {t('pages.rules.ruleType')}
                </label>
                <select
                  className={selectClass}
                  value={ruleType}
                  onChange={(e) => {
                    setRuleType(e.target.value as RuleType);
                    setTeacherId(null);
                    setGroupId(null);
                  }}
                >
                  {ALL_RULE_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {t(`ruleTypes.${rt}`)}
                    </option>
                  ))}
                </select>
              </div>
              {needsTeacher && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {t('pages.rules.teacher')}
                  </label>
                  <select
                    className={selectClass}
                    value={teacherId ?? ''}
                    onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">{t('pages.globalRules.allTeachers')}</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.teacherId} value={teacher.teacherId}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {needsGroup && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {t('pages.rules.group')}
                  </label>
                  <select
                    className={selectClass}
                    value={groupId ?? ''}
                    onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">{t('pages.globalRules.allGroups')}</option>
                    {groups.map((g) => (
                      <option key={g.groupId} value={g.groupId}>
                        {g.groupName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {t('pages.rules.value')}
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={intValue}
                  onChange={(e) => setIntValue(e.target.value)}
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
                onClick={resetForm}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
