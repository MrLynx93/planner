import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_RULE_TYPES, RULE_NEEDS_TEACHER, RULE_NEEDS_GROUP } from '@/types';
import type { GlobalRuleDto, RuleType } from '@/types';
import {
  useGetGlobalRulesQuery,
  useCreateGlobalRuleMutation,
  useUpdateGlobalRuleMutation,
  useDeleteGlobalRuleMutation,
} from '@/store/globalRulesApi';
import { useGetTeachersQuery } from '@/store/teachersApi';
import { useGetGroupsQuery } from '@/store/groupsApi';

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full';
const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full';

// Teacher-count rules (GROUP_MIN/MAX_TEACHERS) only make sense as whole numbers;
// hour-based rules (TEACHER_WEEKLY_HOURS_MIN, TEACHER_MAX_HOURS_PER_DAY) allow partial hours.
function ruleStep(ruleType: RuleType): string {
  return RULE_NEEDS_GROUP.includes(ruleType) ? '1' : '0.25';
}

export function GlobalRulesPage() {
  const { t } = useTranslation();

  const { data: rules = [], isLoading } = useGetGlobalRulesQuery();
  const { data: teachers = [] } = useGetTeachersQuery();
  const { data: groups = [] } = useGetGroupsQuery();
  const [createRule] = useCreateGlobalRuleMutation();
  const [updateRule] = useUpdateGlobalRuleMutation();
  const [deleteRule] = useDeleteGlobalRuleMutation();

  const [ruleType, setRuleType] = useState<RuleType>('TEACHER_WEEKLY_HOURS_MIN');
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [intValue, setIntValue] = useState('');

  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const sorted = [...rules].sort((a, b) =>
    `${a.ruleType}|${a.teacherId ?? ''}|${a.groupId ?? ''}`.localeCompare(
      `${b.ruleType}|${b.teacherId ?? ''}|${b.groupId ?? ''}`
    )
  );

  const needsTeacher = RULE_NEEDS_TEACHER.includes(ruleType);
  const needsGroup = RULE_NEEDS_GROUP.includes(ruleType);

  function resetForm() {
    setRuleType('TEACHER_WEEKLY_HOURS_MIN');
    setTeacherId(null);
    setGroupId(null);
    setIntValue('');
  }

  async function handleSave() {
    if (!intValue) return;
    const dto: GlobalRuleDto = {
      id: null,
      ruleType,
      teacherId: needsTeacher ? teacherId : null,
      teacherFirstName: null,
      teacherLastName: null,
      groupId: needsGroup ? groupId : null,
      groupName: null,
      intValue: Number(intValue),
    };
    await createRule(dto);
    resetForm();
  }

  function openEdit(ruleId: number, value: number) {
    setEditId(ruleId);
    setEditValue(String(value));
  }

  async function handleUpdate(id: number) {
    if (!editValue) return;
    await updateRule({ id, intValue: Number(editValue) });
    setEditId(null);
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    await deleteRule(id);
  }

  function ruleLabel(rule: GlobalRuleDto): string {
    const parts: string[] = [t(`ruleTypes.${rule.ruleType}`)];
    if (rule.teacherFirstName) parts.push(`${rule.teacherFirstName} ${rule.teacherLastName}`);
    if (rule.groupName) parts.push(rule.groupName);
    return parts.join(' — ');
  }

  return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <div>
        <h1 className="text-xl font-semibold">{t('pages.globalRules.title')}</h1>
        <p className="mt-1 inline-block rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">{t('pages.globalRules.description')}</p>
      </div>

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
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((rule) => (
                <tr key={rule.id} className="border-b border-border last:border-0 h-10">
                  <td className="pr-4 align-middle">{ruleLabel(rule)}</td>
                  <td className="pr-4 align-middle">
                    {editId === rule.id ? (
                      <input
                        type="number"
                        min="0"
                        step={ruleStep(rule.ruleType)}
                        className="rounded-md border border-border bg-background px-2.5 py-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-24 h-7"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(rule.id!)}
                        autoFocus
                      />
                    ) : (
                      rule.intValue
                    )}
                  </td>
                  <td className="align-middle">
                    <div className="flex justify-end gap-2">
                      {editId === rule.id ? (
                        <>
                          <button
                            className="rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs hover:bg-primary/90 transition-colors"
                            onClick={() => handleUpdate(rule.id!)}
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
                            onClick={() => openEdit(rule.id!, rule.intValue)}
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => handleDelete(rule.id!)}
                          >
                            {t('common.delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>

      {/* Add form */}
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
                    <option key={teacher.id} value={teacher.id!}>
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
                    <option key={g.id} value={g.id!}>
                      {g.name}
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
                step={ruleStep(ruleType)}
                className={inputClass}
                value={intValue}
                onChange={(e) => setIntValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
      </div>
    </div>
  );
}
