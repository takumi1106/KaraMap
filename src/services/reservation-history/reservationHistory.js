import { startTimes, todayInJapan, validateReservation } from '../../pages/reservation-form/reservationTime.js'

export const historyStorageKey = 'karamap-demo-reservations-v1'

function validRecord(record) {
  return record && typeof record.id === 'string' && typeof record.shopId === 'string' &&
    typeof record.roomId === 'string' && typeof record.storeName === 'string' &&
    typeof record.roomName === 'string' && typeof record.date === 'string' &&
    typeof record.time === 'string' && [1, 2, 3].includes(record.durationHours) &&
    Number.isInteger(record.partySize) && record.partySize > 0 &&
    Number.isFinite(record.savedAt) && record.isDemo === true &&
    Array.isArray(record.conditions) && record.conditions.every((value) => typeof value === 'string') &&
    typeof record.context === 'string' && Number.isFinite(reservationEndsAt(record)) &&
    (record.status == null || ['active', 'ended', 'cancelled'].includes(record.status))
}

export function readReservationHistory(storage = window.localStorage, now = new Date()) {
  const raw = storage.getItem(historyStorageKey)
  if (!raw) return []
  const records = JSON.parse(raw)
  if (!Array.isArray(records) || records.some((record) => !validRecord(record))) throw new Error('保存された履歴を読み込めませんでした。')
  return records.sort((a, b) => b.savedAt - a.savedAt).slice(0, 3).map((record) => ({
    ...record,
    status: record.status === 'cancelled' ? 'cancelled' : reservationEndsAt(record) <= now.getTime() ? 'ended' : 'active',
  }))
}

export function saveDemoReservation({ id, shopId, shopName, room, start, duration, guests, context = '' }, storage = window.localStorage, now = new Date()) {
  const existing = readReservationHistory(storage, now)
  if (existing.some((record) => record.status === 'active')) {
    const error = new Error('現在予約中の店舗があります')
    error.code = 'ACTIVE_RESERVATION'
    throw error
  }
  const error = validateReservation({ start, duration, guests, room }, now)
  if (error) throw new Error(error)
  const record = {
    id, shopId, storeName: shopName, roomId: room.id, roomName: room.name,
    machineModel: room.machineModel ?? null,
    date: todayInJapan(now),
    time: startTimes(now).find((option) => option.value === start).label,
    durationHours: Number(duration), partySize: Number(guests),
    conditions: (room.machines ?? []).map((machine) => machine === 'dam' ? 'DAM' : machine === 'joysound' ? 'JOYSOUND' : machine),
    context, status: 'active', roomNumber: room.roomNumber ?? null, isDemo: true, savedAt: now.getTime(),
  }
  if (!validRecord(record)) throw new Error('店舗・部屋情報を確認してください。')
  const records = [record, ...existing.filter((item) => item.id !== id)].slice(0, 3)
  storage.setItem(historyStorageKey, JSON.stringify(records))
  return record
}


export function reservationEndsAt(record) {
  return Date.parse(`${record.date}T${record.time}:00+09:00`) + record.durationHours * 60 * 60 * 1000
}

export function readCurrentReservation(storage = window.localStorage, now = new Date()) {
  return readReservationHistory(storage, now).find((record) => record.status === 'active') ?? null
}

export function cancelDemoReservation(id, storage = window.localStorage, now = new Date()) {
  const records = readReservationHistory(storage, now)
  const current = records.find((record) => record.id === id && record.status === 'active')
  if (!current) return false
  storage.setItem(historyStorageKey, JSON.stringify(records.map((record) => record.id === id
    ? { ...record, status: 'cancelled', cancelledAt: now.getTime() } : record)))
  return true
}

// 同一オリジンの別タブからの確定・取消も同じロックで直列化する。
export function withReservationLock(action) {
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(historyStorageKey, action)
  return Promise.resolve().then(action)
}
