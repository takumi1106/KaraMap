import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchRoute } from './fetchRoute.js'
const origin = { latitude: 35.1709, longitude: 136.8815 }
const destination = { latitude: 35.1715, longitude: 136.884 }
const response = { code: 'Ok', routes: [{ geometry: { type: 'LineString', coordinates: [[136.8815, 35.1709], [136.884, 35.1715]] }, distance: 307, duration: 230 }] }

test('徒歩・車を指定し、道路経路とメートル・秒を返す', async () => {
  for (const mode of ['walking', 'driving']) {
    const before = structuredClone({ origin, destination })
    const result = await fetchRoute({ origin, destination, mode, fetchImpl: async (_, options) => {
      const body = JSON.parse(options.body)
      assert.equal(body.costing, mode === 'walking' ? 'pedestrian' : 'auto')
      assert.equal(body.format, 'osrm')
      assert.equal(body.shape_format, 'geojson')
      assert.deepEqual(body.locations[0], { lat: origin.latitude, lon: origin.longitude })
      return { ok: true, json: async () => response }
    } })
    assert.equal(result.distanceMeters, 307)
    assert.equal(result.durationSeconds, 230)
    assert.deepEqual(result.geometry, response.routes[0].geometry)
    assert.deepEqual({ origin, destination }, before)
  }
})

test('欠損座標・不正な移動手段は通信前に拒否する', async () => {
  for (const args of [{ origin: null }, { origin: { latitude: 91, longitude: 0 } }, { mode: 'flight' }]) {
    await assert.rejects(fetchRoute({ origin, destination, ...args, fetchImpl: () => assert.fail('通信しない') }))
  }
})

test('通信失敗・経路なし・不正な経路を直線で補わない', async () => {
  for (const data of [{ code: 'NoRoute' }, { code: 'Ok', routes: [] }, { code: 'Ok', routes: [{ geometry: { type: 'LineString', coordinates: [[0, 99], [0, 1]] }, distance: 1, duration: 1 }] }]) {
    await assert.rejects(fetchRoute({ origin, destination, fetchImpl: async () => ({ ok: true, json: async () => data }) }))
  }
  await assert.rejects(fetchRoute({ origin, destination, fetchImpl: async () => ({ ok: false }) }))
})

test('キャンセルを通信へ渡す', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(fetchRoute({ origin, destination, signal: controller.signal, fetchImpl: async (_, options) => {
    assert.equal(options.signal.aborted, true)
    throw new DOMException('Aborted', 'AbortError')
  } }), { name: 'AbortError' })
})
