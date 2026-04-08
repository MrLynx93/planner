export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export type AnnexState = 'CURRENT' | 'FINISHED' | 'DRAFT'

export interface AnnexDto {
  id: number | null
  name: string
  startDate: string | null  // "YYYY-MM-DD"
  endDate: string | null
  scheduleStartTime: string    // "HH:mm:ss"
  scheduleEndTime: string
  state: AnnexState
}

export interface AnnexGroupDto {
  id: number
  annexId: number
  groupId: number
  groupName: string
}

export interface AnnexTeacherDto {
  id: number
  annexId: number
  teacherId: number
  firstName: string
  lastName: string
}

// Matches AnnexTimeBlockDto from backend
export interface ScheduleBlock {
  id: number
  annexId: number
  timeBlockId: number
  type: 'TEMPLATE' | 'MODIFICATION'
  teacherId: number
  teacherFirstName: string
  teacherLastName: string
  groupId: number
  groupName: string
  dayOfWeek: DayOfWeek
  startTime: string   // "HH:mm:ss"
  endTime: string
  date?: string       // "YYYY-MM-DD", only present on MODIFICATION blocks
}

export type ExceptionReason =
  | 'SICK_LEAVE'
  | 'VACATION'
  | 'DELEGATION'
  | 'EXCHANGE'
  | 'OVERTIME'
  | 'SCHEDULE_ADJUSTMENT'

export interface ExceptionModificationDto {
  id: number
  type: 'ADD' | 'REMOVE'
  timeBlockId: number
  teacherFirstName: string
  teacherLastName: string
  groupName: string
  startTime: string
  endTime: string
  date: string  // "YYYY-MM-DD"
}

export interface ExceptionDto {
  id: number
  annexId: number
  title: string | null
  reason: ExceptionReason
  note: string | null
  modifications: ExceptionModificationDto[]
}
