import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeKaraokeShops } from './normalizeKaraokeShops.js'
import { fetchKaraokeShops, NAGOYA_KARAOKE_QUERY } from './fetchKaraokeShops.js'

const jsonResponse = (data) => ({ ok: true, json: async () => data })

test('node・way・relation の座標と種類別IDを保持する', () => {
  const shops = normalizeKaraokeShops([
    { type: 'node', id: 1, lat: 35, lon: 136, tags: { name: '店舗A', 'addr:full': '名古屋市' } },
    { type: 'way', id: 1, center: { lat: 36, lon: 137 } },
    { type: 'relation', id: 1, center: { lat: 37, lon: 138 } },
  ])
  assert.deepEqual(shops.map(({ id, latitude, longitude }) => [id, latitude, longitude]), [
    ['node/1', 35, 136], ['way/1', 36, 137], ['relation/1', 37, 138],
  ])
  assert.equal(shops[0].address, '名古屋市')
  assert.equal(shops[0].osmId, 1)
})

test('欠損・不正要素・重複に耐え、座標0を保持する', () => {
  const shops = normalizeKaraokeShops([
    null, {}, { type: 'node', id: -1 },
    { type: 'node', id: 2, lat: 0, lon: 0 },
    { type: 'node', id: 2 },
    { type: 'way', id: 3, center: { lat: 100, lon: '136' }, tags: null },
  ])
  assert.equal(shops.length, 2)
  assert.equal(shops[0].latitude, 0)
  assert.equal(shops[0].longitude, 0)
  assert.equal(shops[1].latitude, null)
  assert.equal(shops[1].longitude, null)
  assert.equal(shops[1].name, null)
  assert.equal(shops[1].address, null)
  assert.deepEqual(normalizeKaraokeShops(null), [])
})

test('住所タグを結合し、日本語名の代替を使う', () => {
  const [shop] = normalizeKaraokeShops([{ type: 'node', id: 1, tags: {
    'name:ja': ' 店舗B ', 'addr:province': '愛知県', 'addr:city': '名古屋市',
    'addr:housenumber': '1-2',
  } }])
  assert.equal(shop.name, '店舗B')
  assert.equal(shop.address, '愛知県 名古屋市 1-2')
})

test('指定クエリをPOSTし、0件を正常に返す', async () => {
  const result = await fetchKaraokeShops({ fetchImpl: async (url, options) => {
    assert.equal(url, 'https://overpass-api.de/api/interpreter')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['User-Agent'], 'KaraMAP/0.0.0 (https://github.com/takumi1106/KaraMap)')
    assert.equal(options.body.get('data'), NAGOYA_KARAOKE_QUERY)
    return jsonResponse({ elements: [] })
  } })
  assert.deepEqual(result, [])
})

test('HTTP・不正JSON・不完全応答・通信エラーを隠さない', async () => {
  for (const fetchImpl of [
    async () => ({ ok: false, status: 429 }),
    async () => ({ ok: false, status: 406 }),
    async () => ({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON') } }),
    async () => jsonResponse({ elements: [], remark: 'runtime error' }),
    async () => jsonResponse({}),
    async () => { throw new TypeError('Network error') },
  ]) await assert.rejects(fetchKaraokeShops({ fetchImpl }))
})

test('キャンセル済みの場合は通信しない', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(fetchKaraokeShops({ signal: controller.signal, fetchImpl: () => {
    assert.fail('通信してはいけない')
  } }), { name: 'AbortError' })
})

test('タイムアウト時に進行中のリクエストを中断する', async () => {
  await assert.rejects(fetchKaraokeShops({ timeoutMs: 10, fetchImpl: async (_, { signal }) => {
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    })
  } }), { name: 'TimeoutError' })
})
