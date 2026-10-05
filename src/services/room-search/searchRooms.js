import { roomCatalog } from './roomCatalog.js'

const choices = {
  roomType: ['normal', 'party', 'kids'],
  smoking: ['nonSmoking', 'smoking'],
  machine: ['dam', 'joysound'],
  features: ['aiScoring', 'recording'],
  capacity: ['1-2', '3-4', '5-8', '9-plus'],
}
const capacityRanges = { '1-2': [1, 2], '3-4': [3, 4], '5-8': [5, 8], '9-plus': [9, 9] }
const list = (value) => Array.isArray(value) ? value : []
const hasId = (value) => typeof value === 'string' && value.trim().length > 0

function readFilters(filters) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    throw new TypeError('検索条件はオブジェクトで指定してください。')
  }
  for (const key of Object.keys(filters)) {
    if (!(key in choices) && key !== 'vacantOnly') throw new TypeError(`未対応の検索条件: ${key}`)
  }
  const result = {}
  for (const [key, allowed] of Object.entries(choices)) {
    const value = filters[key]
    const values = value == null || value === '' ? [] : Array.isArray(value) ? value : [value]
    if (values.some((item) => !allowed.includes(item))) throw new TypeError(`不正な検索条件: ${key}`)
    result[key] = values
  }
  if (filters.vacantOnly != null && typeof filters.vacantOnly !== 'boolean') {
    throw new TypeError('vacantOnly は真偽値で指定してください。')
  }
  result.vacantOnly = filters.vacantOnly === true
  return result
}

function matches(room, filters, availability) {
  if (filters.roomType.length && !filters.roomType.includes(room.roomType)) return false
  if (filters.smoking.length && !filters.smoking.includes(room.smoking)) return false
  if (!filters.machine.every((machine) => list(room.machines).includes(machine))) return false
  if (!filters.features.every((feature) => room.features?.[feature] === true)) return false
  if (filters.capacity.length) {
    const { min, max } = room.capacity ?? {}
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) return false
    if (!filters.capacity.some((value) => {
      const [lower, upper] = capacityRanges[value]
      return min <= lower && max >= upper
    })) return false
  }
  return !filters.vacantOnly || availability?.status === 'vacant'
}

/**
 * 純粋関数。通信・画面更新なし。OSM店舗に存在する登録済みの部屋だけを検索。
 * 開発データ・テスト空室は明示的な opt-in が必要。
 */
export function searchRooms({
  shops = [], catalog = roomCatalog, filters = {}, availability = [],
  includeTestRooms = false, includeTestAvailability = false,
} = {}) {
  const selected = readFilters(filters)
  const osmShops = new Map(list(shops).filter((shop) => shop && hasId(shop.id)).map((shop) => [shop.id, shop]))
  const results = []
  const storeIds = new Set()
  const linkedOsmIds = new Set()

  for (const store of list(catalog)) {
    if (!store || !hasId(store.id)) continue
    if (storeIds.has(store.id)) throw new Error(`店舗IDが重複しています: ${store.id}`)
    storeIds.add(store.id)
    const osmIds = [...new Set(list(store.osmIds))]
    for (const id of osmIds) {
      if (!/^(node|way|relation)\/[1-9]\d*$/.test(id)) throw new Error('OSM紐付けIDが不正です。')
      if (linkedOsmIds.has(id)) throw new Error(`OSM紐付けが重複しています: ${id}`)
      linkedOsmIds.add(id)
    }
    const linkedShops = osmIds.map((id) => osmShops.get(id)).filter(Boolean)
    if (!linkedShops.length) continue
    const matchedRooms = []
    const roomIds = new Set()
    for (const room of list(store.rooms)) {
      if (!room || !hasId(room.id)) continue
      if (roomIds.has(room.id)) throw new Error(`部屋IDが重複しています: ${room.id}`)
      roomIds.add(room.id)
      const kind = room.provenance?.kind
      if (kind !== 'verified' && !(includeTestRooms && kind === 'test')) continue
      if (kind === 'verified' && (!hasId(room.provenance.sourceUrl) || !hasId(room.provenance.checkedAt))) continue
      const statuses = list(availability).filter((item) => item?.storeId === store.id && item.roomId === room.id)
      // テスト空室しか受け付けない。競合する複数レコードは不明として扱う。
      const status = includeTestAvailability && statuses.length === 1 && statuses[0].source === 'test'
        ? statuses[0] : null
      if (matches(room, selected, status)) {
        matchedRooms.push({ room, availability: status, isTestData: kind === 'test' || status?.source === 'test' })
      }
    }
    if (matchedRooms.length) {
      results.push({ storeId: store.id, shop: linkedShops[0], osmIds: linkedShops.map((shop) => shop.id), matchedRooms })
    }
  }
  return results
}
