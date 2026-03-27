export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface AnnexDto {
  id: number
  name: string
  startDate: string      // "YYYY-MM-DD"
  endDate: string | null
  openingTime: string    // "HH:mm:ss"
  closingTime: string
}

export interface AnnexGroupDto {
  id: number
  annexId: number
  groupId: number
  groupName: string
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
}
