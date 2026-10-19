import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getMapShopInfo, availabilityLabel } from './mapShopInfo.js'

test('電話番号は有効な番号だけtelリンクにする', () => {
  assert.equal(getMapShopInfo({ phone: '+81 (52) 123-4567' }).telephone, 'tel:+81521234567')
  for (const phone of [undefined, '', 'javascript:alert(1)', '未登録']) assert.equal(getMapShopInfo({ phone }).telephone, null)
})
test('データのない店舗の空室・部屋を推測しない', () => {
  const info = getMapShopInfo({ tags: ['空室あり'] })
  assert.equal(info.availability, '空室状況未確認')
  assert.deepEqual(info.rooms, [])
  assert.equal(availabilityLabel('unknown'), '空室状況未確認')
})
test('部屋と空室状態、テストデータを保持し、元データを変更しない', () => {
  const shop = { id: 'real', matchedRooms: [{ room: { id: '101', name: 'ルーム101' }, availability: { status: 'vacant', source: 'test' } }] }
  const original = structuredClone(shop)
  const info = getMapShopInfo(shop)
  assert.equal(info.matchedOnly, true)
  assert.equal(info.isTestData, true)
  assert.equal(availabilityLabel(info.rooms[0].availability.status), '空室あり')
  assert.deepEqual(shop, original)
  assert.equal(getMapShopInfo({ id: 'sample-1', availableRooms: 5 }).isTestData, true)
  assert.equal(getMapShopInfo({ availableRooms: 0 }).availability, '満室')
  assert.equal(availabilityLabel('occupied'), '使用中')
})
