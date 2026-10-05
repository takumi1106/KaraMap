import test from 'node:test'
import assert from 'node:assert/strict'
import { searchRooms } from './searchRooms.js'
import { sampleRoomCatalog, sampleAvailability } from './sampleRoomData.js'
import { normalizeKaraokeShops } from '../overpass/normalizeKaraokeShops.js'

const shops = normalizeKaraokeShops([{ type: 'node', id: 796698691, tags: { name: 'テスト用表示名' } }])
const options = { shops, catalog: sampleRoomCatalog, availability: sampleAvailability, includeTestRooms: true }
const ids = (filters, extra = {}) => searchRooms({ ...options, filters, ...extra }).flatMap((result) => result.matchedRooms.map(({ room }) => room.id))

for (const [label, filters, expected] of [
  ['条件なし', {}, [1, 2, 3]],
  ['ノーマル', { roomType: ['normal'] }, [1]],
  ['パーティー', { roomType: 'party' }, [2]],
  ['キッズ', { roomType: 'kids' }, [3]],
  ['DAM', { machine: ['dam'] }, [1]],
  ['JOYSOUND', { machine: 'joysound' }, [2, 3]],
  ['禁煙', { smoking: 'nonSmoking' }, [1, 3]],
  ['喫煙', { smoking: 'smoking' }, [2]],
  ['1〜2名', { capacity: '1-2' }, [1, 3]],
  ['3〜4名', { capacity: '3-4' }, [1, 2, 3]],
  ['5〜8名', { capacity: '5-8' }, [2, 3]],
  ['9名以上', { capacity: '9-plus' }, [2]],
  ['AI採点', { features: ['aiScoring'] }, [1, 3]],
  ['録音', { features: ['recording'] }, [2, 3]],
  ['機能AND', { features: ['aiScoring', 'recording'] }, [3]],
  ['複数条件', { machine: 'dam', smoking: 'nonSmoking', capacity: '1-2' }, [1]],
  ['別部屋の条件を合算しない', { machine: 'dam', features: ['recording'] }, []],
  ['該当なし', { roomType: 'kids', smoking: 'smoking' }, []],
  ['未指定', { machine: [], roomType: null, capacity: '', vacantOnly: false }, [1, 2, 3]],
]) {
  test(label, () => assert.deepEqual(ids(filters), expected.map((id) => `test-room-${id}`)))
}

test('一致した複数部屋を1店舗にまとめ、入力を変更しない', () => {
  const before = JSON.stringify(options)
  const results = searchRooms(options)
  assert.equal(results.length, 1)
  assert.equal(results[0].matchedRooms.length, 3)
  assert.equal(results[0].shop.id, 'node/796698691')
  assert.equal(results[0].storeId, 'dev-store-001')
  assert.ok(results[0].matchedRooms.every((item) => item.isTestData))
  assert.equal(JSON.stringify(options), before)
})

test('テスト部屋とテスト空室は明示指定時だけ有効', () => {
  assert.deepEqual(searchRooms({ ...options, includeTestRooms: false }), [])
  assert.deepEqual(ids({ vacantOnly: true }), [])
  assert.deepEqual(ids({ vacantOnly: true }, { includeTestAvailability: true }), ['test-room-1'])
})

test('空室と設備も同じ部屋で一致が必要', () => {
  assert.deepEqual(ids({ machine: 'joysound', vacantOnly: true }, { includeTestAvailability: true }), [])
})

test('欠損項目は未指定時に許容し、指定時には不一致', () => {
  const catalog = [{ id: 'partial', osmIds: [shops[0].id], rooms: [null, {}, { id: 'unknown', provenance: { kind: 'test' } }] }]
  assert.deepEqual(ids({}, { catalog }), ['unknown'])
  for (const filters of [{ machine: 'dam' }, { roomType: 'normal' }, { smoking: 'smoking' }, { features: ['aiScoring'] }, { capacity: '1-2' }, { vacantOnly: true }]) {
    assert.deepEqual(ids(filters, { catalog }), [])
  }
  assert.deepEqual(searchRooms({ shops: null, catalog: null }), [])
})

test('OSM種類違い・未取得店舗は結び付けない', () => {
  assert.deepEqual(searchRooms({ ...options, shops: [{ id: 'way/796698691' }] }), [])
  assert.deepEqual(searchRooms({ ...options, shops: [] }), [])
})

test('複数店舗を区別する', () => {
  const catalog = [...sampleRoomCatalog, { ...sampleRoomCatalog[0], id: 'dev-store-002', osmIds: ['way/123'] }]
  assert.equal(searchRooms({ ...options, catalog, shops: [...shops, { id: 'way/123' }] }).length, 2)
})

test('調査済みデータは出典・確認日が必要', () => {
  const room = { id: 'verified-room', provenance: { kind: 'verified', sourceUrl: 'https://example.com/rooms', checkedAt: '2026-10-05' } }
  const catalog = [{ id: 'store', osmIds: [shops[0].id], rooms: [room] }]
  assert.equal(searchRooms({ shops, catalog })[0].matchedRooms[0].isTestData, false)
  assert.deepEqual(searchRooms({ shops, catalog: [{ ...catalog[0], rooms: [{ ...room, provenance: { kind: 'verified' } }] }] }), [])
})

test('不正な条件を無視して全件検索しない', () => {
  assert.throws(() => ids({ machine: 'unknown' }), TypeError)
  assert.throws(() => ids({ typo: true }), TypeError)
  assert.throws(() => ids({ vacantOnly: 'true' }), TypeError)
})

test('紐付けの衝突を検出する', () => {
  assert.throws(() => searchRooms({ ...options, catalog: [...sampleRoomCatalog, { ...sampleRoomCatalog[0], id: 'another' }] }), /紐付けが重複/)
})

test('不正な収容人数は一致させない', () => {
  for (const capacity of [null, { min: 0, max: 4 }, { min: 5, max: 2 }, { min: 1, max: '4' }]) {
    const catalog = [{ ...sampleRoomCatalog[0], rooms: [{ ...sampleRoomCatalog[0].rooms[0], capacity }] }]
    assert.deepEqual(ids({ capacity: '1-2' }, { catalog }), [])
  }
})
