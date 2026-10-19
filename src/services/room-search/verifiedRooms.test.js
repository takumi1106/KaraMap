import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { searchSavedShops } from '../saved-shops/savedShops.js'
import { searchNearbyShops } from '../nearby-search/searchNearbyShops.js'
import { searchRooms } from './searchRooms.js'
import { roomCatalog } from './roomCatalog.js'

const saved = JSON.parse(readFileSync(new URL('../../../public/data/karaoke-shops.json', import.meta.url), 'utf8'))
const location = { latitude: 35.1709, longitude: 136.8815 }
const { results: shops } = searchSavedShops(saved, location, 5000)
const storeId = 'jankara-meieki-higashiguchi'
const room701 = 'jankara-188-room-701'
const room702 = 'jankara-188-room-702'
const search = (filters = {}, options = {}) => searchRooms({ shops, filters, ...options })
const ids = (filters) => search(filters).flatMap((result) => result.matchedRooms.map(({ room }) => room.id))

test('保存済み実店舗と公式確認済み2室をOSM IDで紐付ける', () => {
  const before = JSON.stringify({ shops, roomCatalog })
  const results = search()
  assert.equal(results.length, 1)
  assert.equal(results[0].shop.id, 'node/13943005393')
  assert.equal(results[0].storeId, storeId)
  assert.deepEqual(ids({}), [room701, room702])
  assert.ok(results[0].matchedRooms.every((match) => !match.isTestData && match.availability === null))
  assert.equal(JSON.stringify({ shops, roomCatalog }), before)
  assert.deepEqual(search({}, { shops: [{ id: 'node/1', name: 'ジャンカラ' }] }), [])
})

test('機種・人数を同じ実在部屋で判定し、別部屋の機種を合算しない', () => {
  assert.deepEqual(ids({ machine: 'dam', capacity: '1-2' }), [room701])
  assert.deepEqual(ids({ machine: 'joysound', capacity: '5-8' }), [room702])
  assert.deepEqual(ids({ machine: 'dam', capacity: '5-8' }), [])
  assert.deepEqual(ids({ machine: ['dam', 'joysound'] }), [])
})

test('未確認の部屋分類・喫煙・採点・録音・空室は一致させない', () => {
  for (const filters of [
    { roomType: 'normal' }, { roomType: 'party' }, { roomType: 'kids' },
    { smoking: 'nonSmoking' }, { smoking: 'smoking' },
    { features: ['aiScoring'] }, { features: ['recording'] }, { vacantOnly: true },
  ]) assert.deepEqual(ids(filters), [])
  for (const room of roomCatalog[0].rooms) {
    assert.equal(room.provenance.kind, 'verified')
    assert.equal(room.provenance.sourceUrl, 'https://jankara.ne.jp/shop/188/')
    assert.equal(room.provenance.checkedAt, '2026-10-19')
    assert.ok(room.provenance.confirmedFields.includes('machineModel'))
  }
})

test('実部屋への仮空室はテスト内だけで付与し、明示許可を必要とする', () => {
  const availability = [{ storeId, roomId: room701, status: 'vacant', source: 'test' }]
  assert.deepEqual(search({ vacantOnly: true }, { availability }), [])
  const results = search({ machine: 'dam', vacantOnly: true }, { availability, includeTestAvailability: true })
  assert.equal(results[0].matchedRooms[0].room.id, room701)
  assert.equal(results[0].matchedRooms[0].isTestData, true)
  assert.deepEqual(search({ machine: 'joysound', vacantOnly: true }, { availability, includeTestAvailability: true }), [])
})

test('既存nearby-searchでも既定カタログの実部屋・品質・距離を利用できる', async () => {
  // 通信部分のみ保存済みOverpass応答に置換。外部APIへは接続しない。
  const { results } = await searchNearbyShops({
    ...location, radiusMeters: 5000,
    values: { machine: 'joysound', capacity: '5-8' },
    requestOptions: { fetchImpl: async () => ({ ok: true, json: async () => saved }) },
  })
  assert.equal(results.length, 1)
  assert.equal(results[0].id, 'node/13943005393')
  assert.equal(results[0].quality.status, 'osm_tagged')
  assert.equal(results[0].matchedRooms[0].room.id, room702)
  assert.ok(results[0].distanceMeters > 0 && results[0].distanceMeters < 1000)
  assert.equal(results[0].isTestData, false)
  assert.equal(results[0].availability.status, 'unknown')
})
