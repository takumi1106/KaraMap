// 表示用の整形のみ。店舗検索・空室判定・予約処理は行わない。
export function getMapShopInfo(shop) {
  const phone = typeof shop?.phone === 'string' ? shop.phone.trim() : ''
  const compactPhone = phone.replace(/[\s()（）-]/g, '')
  const telephone = /^\+?[0-9]{6,15}$/.test(compactPhone) ? `tel:${compactPhone}` : null
  const rooms = Array.isArray(shop?.matchedRooms)
    ? shop.matchedRooms.map((match) => ({ ...match.room, availability: match.availability ?? match.room?.availability, isTestData: match.isTestData }))
    : Array.isArray(shop?.rooms) ? shop.rooms : []
  const isTestData = shop?.isTestData === true || shop?.availability?.source === 'test'
    || /^sample(?:-|$)/.test(String(shop?.id ?? ''))
    || rooms.some((room) => room.isTestData || room.availability?.source === 'test')
  const count = shop?.availableRooms
  const availability = Number.isInteger(count) && count >= 0
    ? count > 0 ? `空室あり（${count}部屋）` : '満室'
    : availabilityLabel(shop?.availability?.status)
  return { phone, telephone, rooms, isTestData, availability, matchedOnly: Array.isArray(shop?.matchedRooms) }
}

export function availabilityLabel(status) {
  if (status === 'vacant' || status === 'available') return '空室あり'
  if (status === 'occupied') return '使用中'
  return '空室状況未確認'
}
