import { calculate, initialInput, validateInput, type HolidayInput, type HolidayResult } from './calculator'

const KEY = 'niuma-holiday-value:v1'
export interface SavedState { input: HolidayInput; result: HolidayResult | null; resultInput: HolidayInput | null }

export function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { input: initialInput, result: null, resultInput: null }
    const parsed = JSON.parse(raw) as Partial<SavedState>
    const input = parsed.input as HolidayInput
    if (!input || !['national_day', 'leave3_13', 'custom'].includes(input.preset) || validateInput(input)) throw new Error('Invalid saved input')
    const resultInput = parsed.resultInput as HolidayInput | null
    const hasResult = parsed.result && resultInput && !validateInput(resultInput)
    return { input, result: hasResult ? calculate(resultInput) : null, resultInput: hasResult ? resultInput : null }
  } catch {
    return { input: initialInput, result: null, resultInput: null }
  }
}

export function saveState(state: SavedState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private browsing can deny storage */ }
}
