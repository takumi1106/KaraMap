import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateDistanceMeters, addShopDistances, sortShopsByDistance } from './shopDistance.js'
import { normalizeKaraokeShops } from '../overpass/normalizeKaraokeShops.js'

const origin = { latitude: 0, longitude: 0 }

test('同じ地点は0m、座標0も有効', () => {
  assert.equal(calculateDistanceMeters(origin, origin), 0)
})

test('赤道上0.001度は約111.2m', () => {
  assert.ok(Math.abs(calculateDistanceMeters(origin, { latitude: 0, longitude: 0.001 }) - 111.195) < 0.01)
})

test('緯度差・対称性', () => {
  const to = { latitude: 0.001, longitude: 0 }
  assert.ok(Math.abs(calculateDistanceMeters(origin, to) - 111.195) < 0.01)
  assert.equal(calculateDistanceMeters(origin, to), calculateDistanceMeters(to, origin))
})

test('日付変更線をまたぐ短距離・対蹠点の数値安定性', () => {
  assert.ok(Math.abs(calculateDistanceMeters({ latitude: 0, longitude: 179.999 }, { latitude: 0, longitude: -179.999 }) - 222.39) < 0.02)
  assert.ok(Math.abs(calculateDistanceMeters(origin, { latitude: 0, longitude: 180 }) - 20015114.44) < 1)
  assert.ok(calculateDistanceMeters({ latitude: 90, longitude: 0 }, { latitude: 90, longitude: 180 }) < 0.001)
})

test('欠損・文字列・非有限・範囲外はnull、両地点を検証', () => {
  for (const invalid of [null, undefined, {}, { latitude: 0 }, { latitude: '0', longitude: 0 }, { latitude: null, longitude: 0 }, { latitude: NaN, longitude: 0 }, { latitude: 0, longitude: Infinity }, { latitude: 91, longitude: 0 }, { latitude: -91, longitude: 0 }, { latitude: 0, longitude: 181 }, { latitude: 0, longitude: -181 }]) {
    assert.equal(calculateDistanceMeters(origin, invalid), null)
    assert.equal(calculateDistanceMeters(invalid, origin), null)
  }
})

test('複数店舗の距離と既存属性を保持し、入力を変更しない', () => {
  const shops = normalizeKaraokeShops([
    { type: 'node', id: 1, lat: 0, lon: 0.002, tags: { name: 'A', amenity: 'karaoke_box', 'addr:full': '住所' } },
    { type: 'node', id: 2, lat: 0, lon: 0.001 },
    { type: 'way', id: 3 },
  ])
  const before = structuredClone(shops)
  shops.forEach(Object.freeze)
  Object.freeze(shops)
  const result = addShopDistances(origin, shops)
  assert.notEqual(result, shops)
  assert.notEqual(result[0], shops[0])
  assert.ok(result[0].distanceMeters > result[1].distanceMeters)
  assert.equal(result[2].distanceMeters, null)
  for (let i = 0; i < shops.length; i += 1) {
    const { distanceMeters, ...rest } = result[i]
    assert.ok(distanceMeters === null || Number.isFinite(distanceMeters))
    assert.deepEqual(rest, before[i])
  }
  assert.deepEqual(shops, before)
  assert.deepEqual(sortShopsByDistance(result).map((s) => s.id), ['node/2', 'node/1', 'way/3'])
})

test('不正な現在地では全距離null、過去の距離を残さない', () => {
  const shops = [{ ...origin, distanceMeters: 99 }]
  assert.equal(addShopDistances(null, shops)[0].distanceMeters, null)
  assert.equal(shops[0].distanceMeters, 99)
})

test('安定した昇順、0は先頭、不明や不正距離は末尾', () => {
  const values = [null, 10, 0, 10, undefined, NaN, Infinity, -1, '3']
  const shops = values.map((distanceMeters, id) => Object.freeze({ id, distanceMeters }))
  Object.freeze(shops)
  const sorted = sortShopsByDistance(shops)
  assert.deepEqual(sorted.map((s) => s.id), [2, 1, 3, 0, 4, 5, 6, 7, 8])
  assert.deepEqual(shops.map((s) => s.id), [0, 1, 2, 3, 4, 5, 6, 7, 8])
  assert.notEqual(sorted, shops)
})

test('空配列と不正な入力形式', () => {
  assert.deepEqual(addShopDistances(origin, []), [])
  assert.deepEqual(sortShopsByDistance([]), [])
  assert.throws(() => addShopDistances(origin, null), TypeError)
  assert.throws(() => addShopDistances(origin, [null]), TypeError)
  assert.throws(() => sortShopsByDistance({}), TypeError)
})
