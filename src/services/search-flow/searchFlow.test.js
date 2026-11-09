import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { demoOrigin, groupByDistance, detailPath, reservationPath, searchContext, savedShopDetail } from './searchFlow.js'
import { searchSavedShops, parseSavedShops } from '../saved-shops/savedShops.js'
import { readRoomSearch, roomSearchParams, searchRoomPageShops } from '../room-search/roomSearchPage.js'

const data = JSON.parse(readFileSync(new URL('../../../public/data/karaoke-shops.json', import.meta.url), 'utf8'))
const id = 'node/13943005393'

test('5kmちょうどは近距離、超過は遠距離。各区分を距離順にし入力を変更しない', () => {
  const shops = [{ id: 'far', distanceMeters: 9000 }, { id: 'edge', distanceMeters: 5000 }, { id: 'over', distanceMeters: 5001 }, { id: 'zero', distanceMeters: 0 }]
  const before = structuredClone(shops)
  const [near, far] = groupByDistance(shops)
  assert.deepEqual(near.shops.map((shop) => shop.id), ['zero', 'edge'])
  assert.deepEqual(far.shops.map((shop) => shop.id), ['over', 'far'])
  assert.deepEqual(shops, before)
})

test('保存実店舗を距離で除外せず、近距離0件でも遠距離のDAM・JOYSOUND部屋を検索', () => {
  const remote = { latitude: 35.6812, longitude: 139.7671 }
  const { results } = searchSavedShops(data, remote, null)
  const [near, far] = groupByDistance(results)
  assert.equal(near.shops.length, 0)
  assert.equal(far.shops.length, results.length)
  assert.ok(results.length > 0)
  for (const [machine, capacity, roomNumber] of [['dam', '1-2', '701'], ['joysound', '5-8', '702']]) {
    const matches = searchRoomPageShops(results, { values: { machine: [machine], capacity: [capacity] }, realtimeAvailable: false })
    assert.equal(matches.length, 1)
    assert.equal(matches[0].matchedRooms[0].room.roomNumber, roomNumber)
    assert.ok(matches[0].distanceMeters > 5000)
    assert.ok(Number.isFinite(matches[0].latitude) && Number.isFinite(matches[0].longitude))
  }
})

test('条件未指定なら未登録店舗も表示、設備指定時は未登録店舗を一致扱いしない', () => {
  const { results } = searchSavedShops(data, demoOrigin, null)
  const all = searchRoomPageShops(results, { values: {}, realtimeAvailable: false })
  assert.equal(all.length, results.length)
  assert.ok(all.some((shop) => !shop.matchedRooms))
  const dam = searchRoomPageShops(results, { values: { machine: ['dam'] }, realtimeAvailable: false })
  assert.deepEqual(dam.map((shop) => shop.id), [id])
  assert.deepEqual(searchRoomPageShops(results, { values: { smoking: ['nonSmoking'] }, realtimeAvailable: false }), [])
})

test('名古屋駅デモも同じ全件読込・距離区分を使用し、旧半径指定も維持', () => {
  const all = searchSavedShops(data, demoOrigin, null).results
  const limited = searchSavedShops(data, demoOrigin, 5000).results
  const [near, far] = groupByDistance(all)
  assert.deepEqual(near.shops, limited)
  assert.equal(near.shops.length + far.shops.length, all.length)
})

test('詳細・予約・詳細へ戻るURLに店舗・部屋・条件・起点を保持', () => {
  const params = roomSearchParams({ values: { machine: ['joysound'], capacity: ['5-8'] }, realtimeAvailable: false })
  params.set('origin', 'demo')
  const roomId = 'jankara-188-room-702'
  const detail = new URL(detailPath(id, params, roomId), 'https://example.test')
  const reservation = new URL(reservationPath(id, roomId, detail.searchParams), detail)
  assert.equal(reservation.searchParams.get('reserve'), id)
  assert.equal(reservation.searchParams.get('room'), roomId)
  assert.equal(reservation.searchParams.get('returnTo'), 'shop-detail')
  const back = new URL(detailPath(reservation.searchParams.get('reserve'), reservation.searchParams, reservation.searchParams.get('room')), detail)
  assert.equal(back.href, detail.href)
  assert.equal(back.searchParams.get('origin'), 'demo')
  assert.deepEqual(readRoomSearch(searchContext(back.searchParams)), readRoomSearch(params))
})

test('実店舗IDから701・702号室を取得し、不明店舗・不明料金・写真を補完しない', () => {
  const shops = parseSavedShops(data)
  const shop = savedShopDetail(shops, id)
  assert.equal(shop.name, 'ジャンカラ 名駅東口店')
  assert.deepEqual(shop.rooms.map((room) => room.roomNumber), ['701', '702'])
  assert.equal(shop.image, undefined)
  assert.ok(shop.rooms.every((room) => room.price == null && room.smoking === null))
  assert.equal(savedShopDetail(shops, 'node/0'), null)
  const unknownRooms = shops.find((item) => item.id !== id)
  assert.deepEqual(savedShopDetail(shops, unknownRooms.id).rooms, [])
})

for (const [machine, capacity, roomNumber] of [['dam', '1-2', '701'], ['joysound', '5-8', '702']]) {
  test(`${machine}の検索URLから詳細・予約まで同じ実店舗と${roomNumber}号室を引き継ぐ`, () => {
    const params = roomSearchParams({ values: { machine: [machine], capacity: [capacity] }, realtimeAvailable: false })
    params.set('origin', 'demo')
    const filterHistory = new URL(`/search-filter?${params}`, 'https://example.test')
    const resultsPage = new URL(`/search?${params}`, filterHistory)
    const conditions = readRoomSearch(resultsPage.searchParams)
    const shops = searchSavedShops(data, demoOrigin, null).results
    const results = searchRoomPageShops(shops, conditions)
    assert.equal(results.length, 1)
    const match = results[0].matchedRooms[0].room
    assert.equal(match.roomNumber, roomNumber)
    const detail = new URL(detailPath(results[0].id, resultsPage.searchParams, match.id), resultsPage)
    const stored = savedShopDetail(parseSavedShops(data), detail.searchParams.get('shop'))
    const reservation = new URL(reservationPath(stored.id, match.id, detail.searchParams), detail)
    const reservedRoom = stored.rooms.find((room) => room.id === reservation.searchParams.get('room'))
    assert.equal(reservedRoom.roomNumber, roomNumber)
    assert.deepEqual(reservedRoom.machines, [machine])
    assert.equal(reservation.searchParams.get('origin'), 'demo')
    assert.deepEqual(readRoomSearch(filterHistory.searchParams), conditions)
    assert.deepEqual(readRoomSearch(reservation.searchParams), conditions)
  })
}

test('登録済み店舗は遠方でも最上部に一度だけ表示する', async () => {
  const { groupRegisteredShopsFirst } = await import('./searchFlow.js')
  const shops = [
    { id: 'node/1', distanceMeters: 100 },
    { id: 'node/2', distanceMeters: 9000 },
    { id: 'node/13943005393', distanceMeters: 40000 },
    { id: 'node/3', distanceMeters: 6000 },
  ]
  const before = JSON.stringify(shops)
  const groups = groupRegisteredShopsFirst(shops)
  assert.equal(groups.find((group) => group.id === 'registered').shops[0].id, 'node/13943005393')
  assert.deepEqual(groups.find((group) => group.id === 'far').shops.map((shop) => shop.distanceMeters), [6000, 9000])
  assert.equal(new Set(groups.flatMap((group) => group.shops.map((shop) => shop.id))).size, shops.length)
  assert.equal(JSON.stringify(shops), before)
  assert.equal(groupRegisteredShopsFirst([])[0].shops.length, 0)
})

test('デモ空室ありを距離区分より先に並べ、元データと店舗件数を保つ', async () => {
  const { groupRegisteredShopsFirst } = await import('./searchFlow.js')
  const { withDemoShopAvailability } = await import('../shop-availability/demoShopAvailability.js')
  const shops = [
    { id: 'node/1912844940', distanceMeters: 100 },
    { id: 'node/796698691', distanceMeters: 8000 },
    { id: 'node/2108373590', distanceMeters: 2000 },
    { id: 'node/999', distanceMeters: 300 },
  ]
  const before = JSON.stringify(shops)
  const decorated = shops.map(withDemoShopAvailability)
  const groups = groupRegisteredShopsFirst(decorated)
  assert.deepEqual(groups[0].shops.map((shop) => shop.distanceMeters), [2000, 8000])
  assert.equal(decorated[0].demoAvailability, 'occupied')
  assert.equal(decorated[3].demoAvailability, undefined)
  assert.equal(groups.flatMap((group) => group.shops).length, shops.length)
  assert.equal(JSON.stringify(shops), before)
})
