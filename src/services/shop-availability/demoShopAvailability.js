// 表示確認用の固定データ。実店舗の空室状況や部屋設備を示すものではない。
const demoStatuses = {
  'node/796698691': 'vacant',
  'node/2108373590': 'vacant',
  'node/1912844940': 'occupied',
  'node/2090850509': 'occupied',
}

export function withDemoShopAvailability(shop) {
  const status = demoStatuses[shop.id]
  return status ? { ...shop, demoAvailability: status } : shop
}

export function hasVacantAvailability(shop) {
  return shop.demoAvailability === 'vacant' ||
    shop.matchedRooms?.some(({ availability }) => availability?.status === 'vacant') === true
}
