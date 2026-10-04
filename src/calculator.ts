export type PresetId = 'national_day' | 'leave3_13' | 'custom'

export interface HolidayInput {
  preset: PresetId
  holidayDays: number
  annualLeaveDays: number
  sleepHoursPerDay: number
  travelHours: number
  obligationHours: number
  meetingHours: number
  workHours: number
}

export interface HolidayResult {
  totalHolidayHours: number
  awakeHoursPerDay: number
  awakeHolidayHours: number
  occupiedHours: number
  freeHours: number
  holidayValuePercent: number
  effectiveHolidayDays: number
  companyHours: number
  companyDays: number
  leaveLeverage: number | null
  overfilled: boolean
}

// Update or hide seasonal choices here, without touching the form or result view.
export const holidayPresets = {
  national_day: { label: '国庆假期', detail: '按 7 天假期先算', holidayDays: 7, annualLeaveDays: 0, visible: true },
  leave3_13: { label: '请3休13', detail: '请 3 天年假，连休 13 天', holidayDays: 13, annualLeaveDays: 3, visible: true },
  custom: { label: '自定义', detail: '按你的实际安排填写', holidayDays: 1, annualLeaveDays: 0, visible: true },
} as const

export const initialInput: HolidayInput = {
  preset: 'leave3_13', holidayDays: 13, annualLeaveDays: 3,
  sleepHoursPerDay: 8, travelHours: 0, obligationHours: 0,
  meetingHours: 0, workHours: 0,
}

const valid = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

export function validateInput(input: HolidayInput): string | null {
  if (!valid(input.holidayDays, 1, 365) || !Number.isInteger(input.holidayDays)) return '休假天数请输入 1～365 的整数。'
  if (!valid(input.annualLeaveDays, 0, input.holidayDays) || !Number.isInteger(input.annualLeaveDays)) return '年假天数不能超过休假天数。'
  if (!valid(input.sleepHoursPerDay, 0, 23.5)) return '每天睡眠时间请输入 0～23.5 小时。'
  for (const key of ['travelHours', 'obligationHours', 'meetingHours', 'workHours'] as const) {
    if (!valid(input[key], 0, 8760)) return '各项时间请输入不小于 0 的有效小时数。'
  }
  return null
}

export function calculate(input: HolidayInput): HolidayResult {
  const error = validateInput(input)
  if (error) throw new Error(error)
  const totalHolidayHours = input.holidayDays * 24
  const awakeHoursPerDay = 24 - input.sleepHoursPerDay
  const awakeHolidayHours = input.holidayDays * awakeHoursPerDay
  const occupiedHours = input.travelHours + input.obligationHours + input.meetingHours + input.workHours
  const freeHours = Math.max(0, awakeHolidayHours - occupiedHours)
  const holidayValuePercent = freeHours / awakeHolidayHours * 100
  const effectiveHolidayDays = Math.min(input.holidayDays, freeHours / awakeHoursPerDay)
  const companyHours = input.meetingHours + input.workHours
  return {
    totalHolidayHours, awakeHoursPerDay, awakeHolidayHours, occupiedHours, freeHours,
    holidayValuePercent, effectiveHolidayDays, companyHours,
    companyDays: companyHours / awakeHoursPerDay,
    leaveLeverage: input.annualLeaveDays > 0 ? input.holidayDays / input.annualLeaveDays : null,
    overfilled: occupiedHours > awakeHolidayHours,
  }
}

export const formatNumber = (n: number, digits = 1) =>
  Number.isInteger(n) ? String(n) : n.toFixed(digits).replace(/\.0$/, '')

export function resultLine(percent: number): string {
  if (percent >= 85) return '这假放得挺纯。'
  if (percent >= 70) return '不错，大部分时间还是自己的。'
  if (percent >= 50) return '看起来在放假，其实安排不少。'
  if (percent >= 30) return '假期已经有点像换个地方忙。'
  return '你确定这是放假吗？'
}
