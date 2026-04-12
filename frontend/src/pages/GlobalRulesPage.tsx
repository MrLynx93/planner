import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_RULE_TYPES, RULE_NEEDS_TEACHER, RULE_NEEDS_GROUP } from '@/types';
import type { GlobalRuleDto, RuleType } from '@/types';
import {
  useGetGlobalRulesQuery,
  useCreateGlobalRuleMutation,
  useDeleteGlobalRuleMutation,
} from '@/store/globalRulesApi';
import { useGetTeachersQuery } from '@/store/teachersApi';
import { useGetGroupsQuery } from '@/store/groupsApi';

const selectClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-24';

export function GlobalRulesPage() {
  const { t } = useTranslation();

  const { data: rules = [], isLoading } = useGetGlobalRulesQuery();
  const { data: teachers = [] } = useGetTeachersQuery();
  const { data: groups = [] } = useGetGroupsQuery();
  const [createRule] = useCreateGlobalRuleMutation();
  const [deleteRule] = useDeleteGlobalRuleMutation();

  const [adding, setAdding] = useState(false);
  const [ruleType, setRuleType] = useState<RuleType>(
    'TEACHER_MONTHLY_HOURS_MIN'
  );
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [intValue, setIntValue] = useState('');

  const needsTeacher = RULE_NEEDS_TEACHER.includes(ruleType);
  const needsGroup = RULE_NEEDS_GROUP.includes(ruleType);

  function openAdd() {
    setAdding(true);
    setRuleType('TEACHER_MONTHLY_HOURS_MIN');
    setTeacherId(null);
    setGroupId(null);
    setIntValue('');
  }

  async function handleSave() {
    if (!intValue) return;
    const dto: GlobalRuleDto = {
      id: null,
      ruleType,
      teacherId: null,
      teacherFirstName: null,
      teacherLastName: null,
      groupId: null,
      groupName: null,
      intValue: Number(intValue),
    };
    await createRule(dto);
    setAdding(false);
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    await deleteRule(id);
  }

  function ruleLabel(rule: GlobalRuleDto): string {
    const parts: string[] = [t(`ruleTypes.${rule.ruleType}`)];
    if (rule.teacherFirstName)
      parts.push(`${rule.teacherFirstName} ${rule.teacherLastName}`);
    if (rule.groupName) parts.push(rule.groupName);
    return parts.join(' — ');
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {t('pages.globalRules.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('pages.globalRules.description')}
          </p>
        </div>
        {!adding && (
          <button
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm hover:bg-primary/90 transition-colors"
            onClick={openAdd}
          >
            {t('pages.rules.add')}
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
          <h2 className="font-medium text-sm">{t('pages.rules.add')}</h2>
          <div className="flex gap-3 flex-wrap items-end">
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
                  onChange={(e) =>
                    setTeacherId(e.target.value ? Number(e.target.value) : null)
                  }
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
                  onChange={(e) =>
                    setGroupId(e.target.value ? Number(e.target.value) : null)
                  }
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
              onClick={() => setAdding(false)}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('common.noItems')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">
                {t('pages.rules.ruleType')}
              </th>
              <th className="pb-2 pr-4 font-medium">
                {t('pages.rules.value')}
              </th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr
                key={rule.id}
                className="border-b border-border last:border-0"
              >
                <td className="py-2 pr-4">{ruleLabel(rule)}</td>
                <td className="py-2 pr-4">{rule.intValue}</td>
                <td className="py-2">
                  <div className="flex justify-end">
                    <button
                      className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => handleDelete(rule.id!)}
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
  );
}
