import test from 'node:test'
import assert from 'node:assert/strict'
import { buildNearbyKaraokeQuery, fetchNearbyKaraokeShops } from './fetchNearbyKaraokeShops.js'

const position = { latitude: 35.1709, longitude: 136.8815 }

test('既定1km・カスタム半径と全OSM種類のクエリ', () => {
  assert.match(buildNearbyKaraokeQuery(position), /around:1000,35\.17090000,136\.88150000/)
  assert.match(buildNearbyKaraokeQuery({ ...position, radiusMeters: 2500 }), /around:2500,/)
  assert.equal((buildNearbyKaraokeQuery(position).match(/nwr\[/g) ?? []).length, 2)
  assert.match(buildNearbyKaraokeQuery(position), /out center tags;/)
  assert.doesNotThrow(() => buildNearbyKaraokeQuery({ latitude: 0, longitude: 0 }))
})

test('不正な座標・半径は通信前に拒否', async () => {
  for (const input of [{}, { ...position, latitude: 91 }, { ...position, longitude: -181 }, { ...position, latitude: '35' }, { ...position, latitude: NaN }, { ...position, radiusMeters: 0 }, { ...position, radiusMeters: -1 }, { ...position, radiusMeters: Infinity }, { ...position, radiusMeters: 10001 }]) {
    await assert.rejects(fetchNearbyKaraokeShops({ ...input, fetchImpl: () => assert.fail('通信不可') }), RangeError)
  }
})

test('識別ヘッダー・POST・正規化の互換性', async () => {
  const result = await fetchNearbyKaraokeShops({ ...position, fetchImpl: async (_, options) => {
    assert.equal(options.method, 'POST')
    assert.match(options.headers['User-Agent'], /KaraMAP/)
    assert.equal(options.body.get('data'), buildNearbyKaraokeQuery(position))
    return { ok: true, json: async () => ({ elements: [
      { type: 'node', id: 1, lat: 35, lon: 136 },
      { type: 'way', id: 2, center: { lat: 35, lon: 136 } },
      { type: 'relation', id: 3 },
    ] }) }
  } })
  assert.deepEqual(result.map((shop) => shop.id), ['node/1', 'way/2', 'relation/3'])
  assert.equal(result[2].latitude, null)
})

test('0件・HTTPエラー・不完全応答・キャンセル', async () => {
  assert.deepEqual(await fetchNearbyKaraokeShops({ ...position, fetchImpl: async () => ({ ok: true, json: async () => ({ elements: [] }) }) }), [])
  for (const response of [{ ok: false, status: 406 }, { ok: true, json: async () => ({ remark: 'error', elements: [] }) }]) {
    await assert.rejects(fetchNearbyKaraokeShops({ ...position, fetchImpl: async () => response }))
  }
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(fetchNearbyKaraokeShops({ ...position, signal: controller.signal }), { name: 'AbortError' })
})
