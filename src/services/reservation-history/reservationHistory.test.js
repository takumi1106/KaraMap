import test from 'node:test'
import assert from 'node:assert/strict'
import { historyStorageKey, readReservationHistory, saveDemoReservation, readCurrentReservation, cancelDemoReservation, withReservationLock } from './reservationHistory.js'
import { roomCatalog } from '../room-search/roomCatalog.js'
import { reservationPath } from '../search-flow/searchFlow.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}
const now = new Date('2026-11-02T10:00:00+09:00')
const input = {
  id: 'demo-1', shopId: roomCatalog[0].osmIds[0], shopName: roomCatalog[0].name,
  room: roomCatalog[0].rooms[0], start: String(new Date('2026-11-02T11:30:00+09:00').getTime()),
  duration: '2', guests: '3', context: 'origin=demo&from=search-filter&keyword=ジャンカラ',
}

test('未保存なら空、予約確認内容を保存し別の読み込みでも復元する', () => {
  const storage = memoryStorage()
  assert.deepEqual(readReservationHistory(storage, now), [])
  const record = saveDemoReservation(input, storage, now)
  assert.deepEqual(readReservationHistory(storage, now), [record])
  assert.equal(record.storeName, roomCatalog[0].name)
  assert.equal(record.roomId, roomCatalog[0].rooms[0].id)
  assert.equal(record.roomName, roomCatalog[0].rooms[0].name)
  assert.equal(record.time, '11:30')
  assert.equal(record.durationHours, 2)
  assert.equal(record.partySize, 3)
  assert.deepEqual(record.conditions, ['DAM'])
  assert.equal(record.isDemo, true)
})

test('新しい順に最大3件を保存し、4件目では最も古い履歴を外す', () => {
  const storage = memoryStorage()
  for (let i = 1; i <= 4; i++) {
    const current = new Date(now.getTime() + i * 1000)
    saveDemoReservation({ ...input, id: `demo-${i}` }, storage, current)
    cancelDemoReservation(`demo-${i}`, storage, current)
  }
  assert.deepEqual(readReservationHistory(storage, now).map((item) => item.id), ['demo-4', 'demo-3', 'demo-2'])
  assert.equal(JSON.parse(storage.getItem(historyStorageKey)).length, 3)
})

test('同一確認でも予約中は変更せず、新しい確定を拒否する', () => {
  const storage = memoryStorage()
  saveDemoReservation(input, storage, now)
  assert.throws(() => saveDemoReservation({ ...input, guests: '4' }, storage, now), /現在予約中の店舗があります/)
  assert.equal(readReservationHistory(storage, now).length, 1)
  assert.equal(readReservationHistory(storage, now)[0].partySize, 3)
})

test('保存不可・壊れた履歴を成功扱いにせず、既存データを上書きしない', () => {
  assert.throws(() => saveDemoReservation(input, { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded') } }, now))
  const storage = memoryStorage()
  for (const raw of ['broken', '{}', '[{}]']) {
    storage.setItem(historyStorageKey, raw)
    assert.throws(() => readReservationHistory(storage, now))
    assert.throws(() => saveDemoReservation(input, storage, now))
    assert.equal(storage.getItem(historyStorageKey), raw)
  }
})

test('過去時刻・定員超過・未確認フリータイムは保存しない', () => {
  const storage = memoryStorage()
  for (const patch of [{ start: String(now.getTime() - 1) }, { guests: '6' }, { duration: 'free' }]) {
    assert.throws(() => saveDemoReservation({ ...input, ...patch }, storage, now))
    assert.deepEqual(readReservationHistory(storage, now), [])
  }
})

test('履歴の再予約リンクに店舗・部屋・検索条件・デモ起点を引き継ぐ', () => {
  const record = saveDemoReservation(input, memoryStorage(), now)
  const path = new URL(reservationPath(record.shopId, record.roomId, new URLSearchParams(record.context)), 'https://example.test')
  assert.equal(path.searchParams.get('reserve'), input.shopId)
  assert.equal(path.searchParams.get('room'), input.room.id)
  assert.equal(path.searchParams.get('origin'), 'demo')
  assert.equal(path.searchParams.get('keyword'), 'ジャンカラ')
})


test('別店舗・別部屋でも有効予約がある間は追加できず保存内容も変えない', () => {
  const storage = memoryStorage()
  saveDemoReservation(input, storage, now)
  const before = storage.getItem(historyStorageKey)
  assert.throws(() => saveDemoReservation({ ...input, id: 'second', room: roomCatalog[0].rooms[1] }, storage, now), { code: 'ACTIVE_RESERVATION' })
  assert.equal(storage.getItem(historyStorageKey), before)
  assert.equal(readCurrentReservation(storage, now).id, input.id)
})

test('取消後は新しい予約が可能。古い画面からの取消は別の予約を消さない', () => {
  const storage = memoryStorage()
  saveDemoReservation(input, storage, now)
  assert.equal(cancelDemoReservation(input.id, storage, now), true)
  assert.equal(readCurrentReservation(storage, now), null)
  assert.equal(readReservationHistory(storage, now)[0].status, 'cancelled')
  saveDemoReservation({ ...input, id: 'next' }, storage, now)
  assert.equal(cancelDemoReservation(input.id, storage, now), false)
  assert.equal(readCurrentReservation(storage, now).id, 'next')
})

test('終了直前は予約中、終了時刻ちょうどで終了し新規予約を許可', () => {
  const storage = memoryStorage()
  saveDemoReservation(input, storage, now)
  const beforeEnd = new Date('2026-11-02T13:29:59+09:00')
  const end = new Date('2026-11-02T13:30:00+09:00')
  assert.ok(readCurrentReservation(storage, beforeEnd))
  assert.equal(readCurrentReservation(storage, end), null)
  assert.equal(readReservationHistory(storage, end)[0].status, 'ended')
  saveDemoReservation({ ...input, id: 'next', start: String(end.getTime()) }, storage, end)
  assert.equal(readCurrentReservation(storage, end).id, 'next')
})

test('日付をまたぐ利用は翌日の終了時刻まで有効', () => {
  const storage = memoryStorage()
  const late = new Date('2026-11-02T23:00:00+09:00')
  saveDemoReservation({ ...input, start: String(late.getTime()), duration: '3' }, storage, late)
  assert.ok(readCurrentReservation(storage, new Date('2026-11-03T01:59:59+09:00')))
  assert.equal(readCurrentReservation(storage, new Date('2026-11-03T02:00:00+09:00')), null)
})

test('旧形式の履歴も開始時刻から有効判定し、不正時刻は読み込みエラー', () => {
  const storage = memoryStorage()
  const record = saveDemoReservation(input, storage, now)
  delete record.status
  storage.setItem(historyStorageKey, JSON.stringify([record]))
  assert.equal(readCurrentReservation(storage, now).id, input.id)
  record.time = 'bad'
  storage.setItem(historyStorageKey, JSON.stringify([record]))
  assert.throws(() => readCurrentReservation(storage, now))
})

test('続けて確定要求しても1件だけ保存される', async () => {
  const storage = memoryStorage()
  const results = await Promise.allSettled([
    withReservationLock(() => saveDemoReservation(input, storage, now)),
    withReservationLock(() => saveDemoReservation({ ...input, id: 'second' }, storage, now)),
  ])
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(readReservationHistory(storage, now).length, 1)
})
