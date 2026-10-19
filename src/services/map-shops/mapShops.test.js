import test from 'node:test'
import assert from 'node:assert/strict'
import { loadNearbyMapShops, shopFetchMessage } from './loadNearbyMapShops.js'
import { prepareMapShops } from './prepareMapShops.js'
const point = { latitude: 35.1709, longitude: 136.8815, radiusMeters: 5000 }
const shop = { id: 'node/1', name: '店舗', latitude: 35.17, longitude: 136.88, quality: { status: 'osm_tagged' }, osmTags: { phone: '052-123-4567' } }

test('サーバーエラーなら別接続先に1回だけ切り替え、実店舗を返す', async () => {
  const called = []; let notice = 0
  const result = await loadNearbyMapShops({ ...point, onFallback: () => notice++, fetchShops: async ({ endpoint }) => {
    called.push(endpoint)
    if (called.length === 1) throw Object.assign(new Error('503'), { status: 503 })
    return [shop]
  } })
  assert.equal(called.length, 2)
  assert.notEqual(called[0], called[1])
  assert.equal(notice, 1)
  assert.equal(result.results[0].id, shop.id)
})
test('全接続先失敗・0件・不完全な応答を混同しない', async () => {
  let calls = 0
  await assert.rejects(loadNearbyMapShops({ ...point, fetchShops: async () => { calls++; throw new TypeError('network') } }))
  assert.equal(calls, 2)
  calls = 0
  const result = await loadNearbyMapShops({ ...point, fetchShops: async () => { calls++; return [] } })
  assert.equal(calls, 1)
  assert.deepEqual(result.results, [])
  calls = 0
  await assert.rejects(loadNearbyMapShops({ ...point, fetchShops: async () => { calls++; throw new Error('incomplete') } }))
  assert.equal(calls, 1)
})
test('取消と不正入力では通信しない', async () => {
  const controller = new AbortController(); controller.abort()
  await assert.rejects(loadNearbyMapShops({ ...point, signal: controller.signal, fetchShops: () => assert.fail() }), { name: 'AbortError' })
  await assert.rejects(loadNearbyMapShops({ ...point, latitude: 91, fetchShops: () => assert.fail() }), RangeError)
})
test('空室・営業時間を捏造せず、要確認店舗を分離して距離を計算', () => {
  const original = structuredClone(shop)
  const result = prepareMapShops(point, [shop, { ...shop, id: 'node/2', quality: { status: 'needs_review' } }])
  assert.equal(result.results.length, 1)
  assert.equal(result.reviewShops.length, 1)
  assert.equal(result.results[0].availableRooms, null)
  assert.equal(result.results[0].isOpen, null)
  assert.equal(result.results[0].phone, '052-123-4567')
  assert.ok(result.results[0].distanceMeters > 0)
  assert.deepEqual(shop, original)
})
test('障害理由をユーザー向け文言に変換する', () => {
  assert.match(shopFetchMessage({ status: 429 }), /30秒/)
  assert.match(shopFetchMessage({ status: 500 }), /障害/)
  assert.match(shopFetchMessage({ name: 'TimeoutError' }), /応答/)
})
test('利用制限時は他サーバーに連続アクセスせず、30秒間は再送しない', async () => {
  let calls = 0
  const fetchShops = async () => { calls++; throw Object.assign(new Error('429'), { status: 429 }) }
  await assert.rejects(loadNearbyMapShops({ ...point, now: () => 100, fetchShops }))
  await assert.rejects(loadNearbyMapShops({ ...point, now: () => 200, fetchShops }))
  assert.equal(calls, 1)
  await assert.rejects(loadNearbyMapShops({ ...point, now: () => 30101, fetchShops }))
  assert.equal(calls, 2)
})
