import test from 'node:test'
import assert from 'node:assert/strict'
import { parseSavedShops, searchSavedShops, loadSavedShops } from './savedShops.js'
const origin = { latitude: 35.1709, longitude: 136.8815 }
const data = { elements: [
  { type: 'node', id: 1, lat: 35.171, lon: 136.882, tags: { name: 'テスト店舗A', amenity: 'karaoke_box' } },
  { type: 'way', id: 2, center: { lat: 35.172, lon: 136.883 }, tags: { name: 'テスト店舗B', amenity: 'karaoke_box' } },
  { type: 'node', id: 3, lat: 36, lon: 137, tags: { name: '遠方テスト店舗', amenity: 'karaoke_box' } },
  { type: 'node', id: 4, lat: 35.171, lon: 136.882, tags: { name: 'カラオケ候補' } },
] }
test('生JSONのnode/wayを正規化し、距離順・半径・品質判定を保持', () => {
  const original = structuredClone(data)
  const result = searchSavedShops(data, origin, 5000)
  assert.deepEqual(result.results.map((shop) => shop.id), ['node/1', 'way/2'])
  assert.equal(result.reviewShops.length, 1)
  assert.equal(result.results[0].availableRooms, null)
  assert.deepEqual(data, original)
})
test('GeoJSONのIDとタグを維持し、Polygon中心を推測しない', () => {
  const result = parseSavedShops({ type: 'FeatureCollection', features: [
    { type: 'Feature', properties: { '@id': 'node/1', name: 'テスト店舗', amenity: 'karaoke_box' }, geometry: { type: 'Point', coordinates: [136.88, 35.17] } },
    { type: 'Feature', id: 'way/2', properties: { name: 'テスト店舗2', amenity: 'karaoke_box' }, geometry: { type: 'Polygon', coordinates: [] } },
  ] })
  assert.equal(result[0].quality.status, 'osm_tagged')
  assert.equal(result[1].quality.status, 'needs_review')
})
test('未登録・不正JSON・不完全な取得・不正座標は空配列で隠さない', async () => {
  assert.throws(() => parseSavedShops({ remark: 'timeout', elements: [] }))
  assert.throws(() => parseSavedShops({}))
  assert.throws(() => searchSavedShops(data, {}, 5000))
  await assert.rejects(loadSavedShops({ url: '/KaraMap/data/karaoke-shops.json', fetchImpl: async () => ({ status: 404 }) }), /未登録/)
  await assert.rejects(loadSavedShops({ fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('HTML') } }) }), /JSON/)
})
test('ローカルファイルだけを読み、AbortSignalを渡す', async () => {
  const controller = new AbortController()
  const result = await loadSavedShops({ location: origin, radiusMeters: 5000, url: '/KaraMap/data/karaoke-shops.json', signal: controller.signal,
    fetchImpl: async (url, options) => {
      assert.equal(url, '/KaraMap/data/karaoke-shops.json')
      assert.equal(options.signal, controller.signal)
      return { ok: true, json: async () => data }
    },
  })
  assert.equal(result.results.length, 2)
})
