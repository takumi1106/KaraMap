import test from 'node:test'
import assert from 'node:assert/strict'
import { searchNearbyShops } from './searchNearbyShops.js'
import { sampleRoomCatalog } from '../room-search/sampleRoomData.js'

// 応答と部屋はこのテスト専用。実店舗の設備として扱わない。
const elements = [
  { type: 'node', id: 796698691, lat: 35.002, lon: 136, tags: { name: '試験A', amenity: 'karaoke_box' } },
  { type: 'node', id: 2, lat: 35.001, lon: 136, tags: { name: '試験B', amenity: 'karaoke_box' } },
  { type: 'node', id: 3, lat: 35, lon: 136, tags: { name: 'カラオケ候補' } },
]
const catalog = [sampleRoomCatalog[0], { ...sampleRoomCatalog[0], id: 'test-b', osmIds: ['node/2'] }, { ...sampleRoomCatalog[0], id: 'test-review', osmIds: ['node/3'] }]
const options = {
  latitude: 35, longitude: 136, radiusMeters: 1000, catalog, includeTestRooms: true,
  requestOptions: { fetchImpl: async (_, request) => {
    assert.match(request.body.get('data'), /around:1000,35\.00000000,136\.00000000/)
    return { ok: true, json: async () => ({ elements }) }
  } },
}

test('周辺取得・品質・同室AND・距離順を統合する', async () => {
  const { results, reviewShops, fetchedShops } = await searchNearbyShops({ ...options,
    values: { roomType: ['normal'], smoking: ['nonSmoking'], machine: ['dam'], features: ['aiScoring'], capacity: ['1-2'] },
  })
  assert.deepEqual(results.map((shop) => shop.id), ['node/2', 'node/796698691'])
  assert.ok(results[0].distanceMeters < results[1].distanceMeters)
  assert.equal(results[0].matchedRooms.length, 1)
  assert.equal(results[0].matchedRooms[0].room.id, 'test-room-1')
  assert.ok(results.every((shop) => shop.quality.status === 'osm_tagged' && shop.isTestData))
  assert.equal(reviewShops[0].id, 'node/3')
  assert.equal(fetchedShops.length, 3)
})

test('別部屋の設備を合算しない、0件も正常', async () => {
  const { results } = await searchNearbyShops({ ...options, values: { machine: ['dam'], features: ['recording'] } })
  assert.deepEqual(results, [])
})

test('空室ONは同じ部屋の空室を判定し距離順・要確認保持も維持', async () => {
  const input = { ...options, includeTestAvailability: true, realtimeAvailable: true }
  const before = JSON.stringify(catalog)
  const { results, reviewShops } = await searchNearbyShops(input)
  assert.deepEqual(results.map((shop) => shop.id), ['node/2', 'node/796698691'])
  assert.ok(results.every((shop) => shop.matchedRooms.length === 1 && shop.matchedRooms[0].room.id === 'test-room-1'))
  assert.equal(results[0].matchedRooms[0].availability.status, 'vacant')
  assert.equal(results[0].availability.scope, 'matched_rooms')
  assert.equal(reviewShops.length, 1)
  assert.equal(JSON.stringify(catalog), before)
  assert.equal((await searchNearbyShops({ ...input, includeTestAvailability: false })).results.length, 0)
})

test('使用中・unknownの条件一致部屋を別の空室と合算しない', async () => {
  for (const roomType of ['party', 'kids']) {
    const input = { ...options, includeTestAvailability: true, values: { roomType: [roomType] } }
    assert.equal((await searchNearbyShops({ ...input, realtimeAvailable: true })).results.length, 0)
    const { results } = await searchNearbyShops({ ...input, realtimeAvailable: false })
    assert.equal(results.length, 2)
    assert.equal(results[0].matchedRooms[0].room.roomType, roomType)
  }
})

test('DAM・禁煙の空室とAI採点の使用中は同じ部屋として扱わない', async () => {
  const base = sampleRoomCatalog[0].rooms[0]
  const splitCatalog = [{ ...sampleRoomCatalog[0], rooms: [
    { ...base, id: '101', features: { aiScoring: false }, availability: { status: 'vacant', source: 'test' } },
    { ...base, id: '102', features: { aiScoring: true }, availability: { status: 'occupied', source: 'test' } },
  ] }]
  const input = { ...options, catalog: splitCatalog, includeTestAvailability: true,
    values: { machine: ['dam'], smoking: ['nonSmoking'], features: ['aiScoring'] } }
  assert.deepEqual((await searchNearbyShops({ ...input, realtimeAvailable: true })).results, [])
  const { results } = await searchNearbyShops(input)
  assert.deepEqual(results[0].matchedRooms.map((m) => m.room.id), ['102'])
})

test('部屋空室の外部指定を優先、重複・欠損・実APIを装う値は空室にしない', async () => {
  for (const states of [
    [{ storeId: 'dev-store-001', roomId: 'test-room-1', status: 'occupied', source: 'test' }],
    [{ storeId: 'dev-store-001', roomId: 'test-room-1', status: 'vacant', source: 'real' }],
    [{ storeId: 'dev-store-001', roomId: 'test-room-1' }],
    [1, 2].map(() => ({ storeId: 'dev-store-001', roomId: 'test-room-1', status: 'vacant', source: 'test' })),
  ]) {
    assert.deepEqual((await searchNearbyShops({ ...options, catalog: sampleRoomCatalog,
      realtimeAvailable: true, includeTestAvailability: true, roomAvailability: states })).results, [])
  }
  await assert.rejects(searchNearbyShops({ ...options, testShopStates: [] }), TypeError)
})

test('実設備のない店舗に情報を作らず、テスト部屋は許可時のみ', async () => {
  assert.deepEqual((await searchNearbyShops({ ...options, catalog: [] })).results, [])
  assert.deepEqual((await searchNearbyShops({ ...options, includeTestRooms: false })).results, [])
})

test('入力・品質元データを変更せず返却属性を維持する', async () => {
  const before = JSON.stringify({ elements, catalog })
  const { results, fetchedShops } = await searchNearbyShops(options)
  assert.equal(JSON.stringify({ elements, catalog }), before)
  assert.equal(fetchedShops[0].distanceMeters, undefined)
  for (const key of ['name', 'latitude', 'longitude', 'address', 'quality', 'osmTags', 'sourceRecords']) {
    assert.deepEqual(results[1][key], fetchedShops[0][key])
  }
})

test('通信エラーと入力エラーは空配列で隠さない', async () => {
  await assert.rejects(searchNearbyShops({ ...options, requestOptions: { fetchImpl: async () => ({ ok: false, status: 504 }) } }), /504/)
  await assert.rejects(searchNearbyShops({ ...options, values: { vacantOnly: true } }), TypeError)
  await assert.rejects(searchNearbyShops({ ...options, realtimeAvailable: 'true' }), TypeError)
  await assert.rejects(searchNearbyShops({ ...options, latitude: 100 }), RangeError)
})
