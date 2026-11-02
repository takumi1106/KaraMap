const japanDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' })

export function todayInJapan(now = new Date()) {
  const parts = Object.fromEntries(japanDate.formatToParts(now).map(({ type, value }) => [type, value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function startTimes(now = new Date()) {
  const midnight = Date.parse(`${todayInJapan(now)}T00:00:00+09:00`)
  return Array.from({ length: 48 }, (_, index) => {
    const value = String(midnight + index * 30 * 60 * 1000)
    return {
      value,
      label: `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`,
      disabled: Number(value) < now.getTime(),
    }
  })
}

export function guestOptions(room) {
  const { min, max } = room?.capacity ?? {}
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) return []
  return Array.from({ length: max - min + 1 }, (_, index) => min + index)
}

export function validateReservation({ start, duration, guests, room }, now = new Date()) {
  if (!startTimes(now).some((option) => option.value === start && !option.disabled)) return '開始時刻を選び直してください。当日の現在時刻以降を選択できます。'
  // 現在の登録情報にはフリータイムの確認済み利用条件がない。
  if (!['1', '2', '3'].includes(duration)) return '利用時間を選び直してください。フリータイムの利用条件は未確認です。'
  if (!guestOptions(room).includes(Number(guests))) return '部屋の定員内で人数を選択してください。定員が未確認の場合は部屋を選び直してください。'
  return null
}
