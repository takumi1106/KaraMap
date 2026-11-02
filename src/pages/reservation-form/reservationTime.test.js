import test from 'node:test'
import assert from 'node:assert/strict'
import { startTimes, todayInJapan, guestOptions, validateReservation } from './reservationTime.js'

const room = { capacity: { min: 1, max: 5 } }
const at = (time) => new Date(`2026-11-02T${time}+09:00`)
const selection = (time) => ({ start: String(at(time).getTime()), duration: '1', guests: '2', room })

test('日本時間で当日を判定し、30分刻みで48個の選択肢を作る', () => {
  assert.equal(todayInJapan(new Date('2026-11-01T15:00:00Z')), '2026-11-02')
  const options = startTimes(at('10:12:00'))
  assert.equal(options.length, 48)
  assert.equal(options.find((option) => !option.disabled).label, '10:30')
  assert.equal(options.at(-1).label, '23:30')
})
test('現在時刻ちょうどは選択可能、1秒でも過ぎた時刻は拒否', () => {
  assert.equal(validateReservation(selection('10:30:00'), at('10:30:00')), null)
  assert.ok(validateReservation(selection('10:30:00'), at('10:30:01')))
  assert.ok(validateReservation(selection('10:31:00'), at('10:00:00')))
})
test('1・2・3時間のみ許可し、未確認フリータイムを拒否', () => {
  for (const duration of ['1', '2', '3']) assert.equal(validateReservation({ ...selection('11:00:00'), duration }, at('10:00:00')), null)
  for (const duration of ['free', '0', '4']) assert.ok(validateReservation({ ...selection('11:00:00'), duration }, at('10:00:00')))
})
test('登録定員内の人数のみ許可し、定員不明を推測しない', () => {
  assert.deepEqual(guestOptions(room), [1, 2, 3, 4, 5])
  assert.deepEqual(guestOptions({ capacity: { min: 1, max: 8 } }), [1, 2, 3, 4, 5, 6, 7, 8])
  assert.deepEqual(guestOptions(null), [])
  for (const guests of ['0', '6', '2.5', '']) assert.ok(validateReservation({ ...selection('11:00:00'), guests }, at('10:00:00')))
})
test('23時30分を過ぎた当日は開始時刻なし、日付をまたいだ古い選択も拒否', () => {
  assert.ok(startTimes(at('23:30:01')).every((option) => option.disabled))
  assert.ok(validateReservation(selection('11:00:00'), new Date('2026-11-03T00:00:00+09:00')))
  assert.ok(validateReservation({ ...selection('11:00:00'), start: '' }, at('10:00:00')))
})
