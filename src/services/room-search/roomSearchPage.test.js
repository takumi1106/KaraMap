import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { searchSavedShops } from '../saved-shops/savedShops.js'
import { readRoomSearch, roomSearchParams, searchRoomPageShops } from './roomSearchPage.js'

const saved = JSON.parse(readFileSync(new URL('../../../public/data/karaoke-shops.json', import.meta.url), 'utf8'))
const { results: shops } = searchSavedShops(saved, { latitude: 35.1709, longitude: 136.8815 }, 5000)

test('URLで選択条件・空室OFFと未指定を保持する', () => {
  const input = { values: { machine: ['dam'], capacity: ['1-2'], smoking: [] }, realtimeAvailable: false }
  const decoded = readRoomSearch(new URLSearchParams(roomSearchParams(input).toString()))
  assert.deepEqual(decoded, { ...input, error: null })
  assert.deepEqual(readRoomSearch(new URLSearchParams()), { values: {}, realtimeAvailable: false, error: null })
})

test('不正URLを無条件検索として受け入れない', () => {
  for (const query of ['filters=broken', 'filters=null', 'filters=[]', 'filters={"machine":"bad"}', 'available=yes', 'filters={"vacantOnly":true}']) {
    assert.ok(readRoomSearch(new URLSearchParams(query)).error)
  }
})

test('保存実店舗から一致部屋・正式名・距離を返し元データを変更しない', () => {
  const before = JSON.stringify(shops)
  const results = searchRoomPageShops(shops, { values: { machine: ['dam'], capacity: ['1-2'] }, realtimeAvailable: false })
  assert.equal(results.length, 1)
  assert.equal(results[0].name, 'ジャンカラ 名駅東口店')
  assert.equal(results[0].matchedRooms[0].room.roomNumber, '701')
  assert.deepEqual(results[0].machines, ['DAM'])
  assert.ok(results[0].distanceMeters > 0)
  assert.equal(results[0].availableRooms, null)
  assert.equal(JSON.stringify(shops), before)
  assert.deepEqual(searchRoomPageShops(shops, { values: {}, realtimeAvailable: true }), [])
  assert.deepEqual(searchRoomPageShops(shops, { values: { smoking: ['nonSmoking'] }, realtimeAvailable: false }), [])
  assert.deepEqual(searchRoomPageShops(shops.map((shop) => ({ ...shop, quality: { status: 'needs_review' } })), { values: {}, realtimeAvailable: false }), [])
})
