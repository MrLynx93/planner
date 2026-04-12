export interface TeacherDto {
  id: number | null;
  firstName: string;
  lastName: string;
}

export interface GroupDto {
  id: number | null;
  name: string;
}

export interface ChildDto {
  id: number | null;
  firstName: string;
  lastName: string;
}

export interface AnnexChildGroupDto {
  id: number | null;
  annexId: number;
  childId: number;
  childFirstName: string;
  childLastName: string;
  groupId: number;
  groupName: string;
}

export interface ClosedDayDto {
  id: number | null;
  date: string;
  reason: string;
}

export type RuleType =
  | 'TEACHER_MONTHLY_HOURS_MIN'
  | 'TEACHER_MAX_HOURS_PER_DAY'
  | 'GROUP_MIN_TEACHERS'
  | 'TEACHER_MAX_FREE_HOURS_MONTHLY';

export const ALL_RULE_TYPES: RuleType[] = [
  'TEACHER_MONTHLY_HOURS_MIN',
  'TEACHER_MAX_HOURS_PER_DAY',
  'GROUP_MIN_TEACHERS',
  'TEACHER_MAX_FREE_HOURS_MONTHLY',
];

export const RULE_NEEDS_TEACHER: RuleType[] = [
  'TEACHER_MONTHLY_HOURS_MIN',
  'TEACHER_MAX_HOURS_PER_DAY',
  'TEACHER_MAX_FREE_HOURS_MONTHLY',
];

export const RULE_NEEDS_GROUP: RuleType[] = ['GROUP_MIN_TEACHERS'];

export interface AnnexRuleDto {
  id: number | null;
  annexId: number | null;
  ruleId: number | null;
  ruleType: RuleType;
  groupId: number | null;
  groupName: string | null;
  teacherId: number | null;
  teacherFirstName: string | null;
  teacherLastName: string | null;
  intValue: number;
}

export interface GlobalRuleDto {
  id: number | null;
  ruleType: RuleType;
  groupId: number | null;
  groupName: string | null;
  teacherId: number | null;
  teacherFirstName: string | null;
  teacherLastName: string | null;
  intValue: number;
}

export type ViolationType =
  | 'TEACHER_MONTHLY_HOURS_TOO_LOW'
  | 'TEACHER_DAILY_HOURS_EXCEEDED'
  | 'TEACHER_FREE_HOURS_EXCEEDED'
  | 'GROUP_UNDERSTAFFED';

export interface ViolationDto {
  violationType: ViolationType;
  severity: 'ERROR' | 'WARNING';
  teacherId: number | null;
  teacherName: string | null;
  groupId: number | null;
  groupName: string | null;
  date: string | null;
  ruleValue: number;
  actualValue: number;
  message: string;
}
