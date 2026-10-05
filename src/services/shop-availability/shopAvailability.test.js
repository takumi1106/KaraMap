import test from 'node:test'
import assert from 'node:assert/strict'
import { attachTestAvailability, filterVacantShops } from './shopAvailability.js'

const shops = [{ id: 'node/1', latitude: 35, longitude: 136 }, { id: 'way/1' }, { id: 'relation/1' }]

test('IDで付与し空き店舗だけ抽出、入力は不変', () => {
  const before = JSON.stringify(shops)
  const result = attachTestAvailability(shops, [{ shopId: 'node/1', status: 'vacant' }, { shopId: 'way/1', status: 'occupied' }])
  assert.equal(result[2].availability.status, 'unknown')
  assert.deepEqual(filterVacantShops(result), [])
  const vacant = filterVacantShops(result, { includeTestData: true })
  assert.equal(vacant.length, 1)
  assert.equal(vacant[0].id, 'node/1')
  assert.equal(vacant[0].latitude, 35)
  assert.equal(vacant[0].availability.isTestData, true)
  assert.equal(JSON.stringify(shops), before)
})

test('欠損・不正・重複レコードを空きと判断しない', () => {
  const result = attachTestAvailability(shops, [null, { shopId: 'node/1', status: 'vacant' }, { shopId: 'node/1', status: 'occupied' }, { shopId: 'way/1', status: 'bad' }])
  assert.deepEqual(filterVacantShops(result, { includeTestData: true }), [])
  assert.deepEqual(attachTestAvailability(null, null), [])
  assert.deepEqual(filterVacantShops([null, {}], { includeTestData: true }), [])
})
