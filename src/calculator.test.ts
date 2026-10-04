import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { calculate, initialInput, validateInput } from './calculator.ts'

test('specified 请3休13 example', () => {
  const r = calculate({ ...initialInput, travelHours: 12, obligationHours: 30, meetingHours: 2, workHours: 4 })
  assert.equal(r.totalHolidayHours, 312)
  assert.equal(r.awakeHolidayHours, 208)
  assert.equal(r.occupiedHours, 48)
  assert.equal(r.freeHours, 160)
  assert.equal(r.effectiveHolidayDays, 10)
  assert.equal(Math.round(r.holidayValuePercent), 77)
  assert.equal(r.companyHours, 6)
  assert.equal(r.companyDays, 0.375)
  assert.equal(Number(r.leaveLeverage?.toFixed(1)), 4.3)
})

test('sleep is not counted as occupied time', () => {
  const r = calculate({ ...initialInput, travelHours: 0, obligationHours: 0, meetingHours: 0, workHours: 0 })
  assert.equal(r.holidayValuePercent, 100)
  assert.equal(r.effectiveHolidayDays, 13)
})

test('overfilled holiday clamps at zero and invalid inputs are rejected', () => {
  const r = calculate({ ...initialInput, travelHours: 300 })
  assert.equal(r.freeHours, 0)
  assert.equal(r.holidayValuePercent, 0)
  assert.equal(r.effectiveHolidayDays, 0)
  assert.equal(r.overfilled, true)
  assert.ok(validateInput({ ...initialInput, sleepHoursPerDay: 24 }))
})
