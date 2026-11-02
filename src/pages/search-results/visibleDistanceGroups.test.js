import test from 'node:test'
import assert from 'node:assert/strict'
import { expandDistanceGroup, visibleDistanceGroups } from './visibleDistanceGroups.js'
import { groupByDistance } from '../../services/search-flow/searchFlow.js'
import { addShopDistances } from '../../services/shop-distance/shopDistance.js'

test('空の区分を非表示にし、全体0件なら表示区分を返さない', () => {
  assert.deepEqual(visibleDistanceGroups(groupByDistance([])), [])
  assert.deepEqual(visibleDistanceGroups(groupByDistance([{ id: 'far', distanceMeters: 6000 }])).map((group) => group.id), ['far'])
})

test('遠方は近い5件から5件ずつ表示し、総件数と地図用の元データを維持', () => {
  const shops = Array.from({ length: 12 }, (_, index) => ({ id: index, distanceMeters: 17000 - index * 1000 }))
  const before = structuredClone(shops)
  const groups = groupByDistance(shops)
  for (const [count, expected, more] of [[5, 5, true], [10, 10, true], [15, 12, false]]) {
    const [group] = visibleDistanceGroups(groups, count)
    assert.equal(group.shops.length, 12)
    assert.equal(group.visibleShops.length, expected)
    assert.equal(group.hasMore, more)
    assert.deepEqual(group.visibleShops, [...shops].reverse().slice(0, count))
  }
  assert.equal(visibleDistanceGroups(groups)[0].visibleShops.length, 5)
  assert.deepEqual(shops, before)
})

test('近距離も距離順、距離不明は最後。無効な距離を近距離と誤判定しない', () => {
  const shops = [{ id: 'null', distanceMeters: null }, { id: 'far', distanceMeters: 5001 }, { id: 'edge', distanceMeters: 5000 }, { id: 'zero', distanceMeters: 0 }, { id: 'invalid', distanceMeters: -1 }]
  const groups = visibleDistanceGroups(groupByDistance(shops))
  assert.deepEqual(groups.map((group) => group.id), ['near', 'far', 'unknown'])
  assert.deepEqual(groups.flatMap((group) => group.visibleShops.map((shop) => shop.id)), ['zero', 'edge', 'far', 'null', 'invalid'])
})

test('既存の距離計算で起点を変更すると区分と距離順も変わる', () => {
  const nagoya = { latitude: 35.1709, longitude: 136.8815 }
  const tokyo = { latitude: 35.6812, longitude: 139.7671 }
  const shops = [{ id: 'nagoya', ...nagoya }, { id: 'tokyo', ...tokyo }]
  const order = (origin) => visibleDistanceGroups(groupByDistance(addShopDistances(origin, shops))).flatMap((group) => group.visibleShops.map((shop) => shop.id))
  assert.deepEqual(order(nagoya), ['nagoya', 'tokyo'])
  assert.deepEqual(order(tokyo), ['tokyo', 'nagoya'])
})


test('近距離は10件ずつ追加し、遠方の5件表示には影響しない', () => {
  const near = Array.from({ length: 23 }, (_, index) => ({ id: `near-${index}`, distanceMeters: 2300 - index * 100 }))
  const far = Array.from({ length: 8 }, (_, index) => ({ id: `far-${index}`, distanceMeters: 6000 + index * 100 }))
  const groups = groupByDistance([...near, ...far])
  for (const [count, expected, more] of [[10, 10, true], [20, 20, true], [30, 23, false]]) {
    const [nearGroup, farGroup] = visibleDistanceGroups(groups, 5, count)
    assert.equal(nearGroup.shops.length, 23)
    assert.equal(nearGroup.visibleShops.length, expected)
    assert.equal(nearGroup.hasMore, more)
    assert.deepEqual(nearGroup.visibleShops, [...near].reverse().slice(0, count))
    assert.equal(farGroup.visibleShops.length, 5)
  }
  assert.equal(visibleDistanceGroups(groups)[0].visibleShops.length, 10)
  assert.equal(visibleDistanceGroups(groups, 10)[0].visibleShops.length, 10)
})


test('交互の追加表示・最終ページ・繰り返しクリックでも完了した区分のボタンは再表示しない', () => {
  for (const [nearTotal, farTotal] of [[20, 10], [23, 12], [10, 5]]) {
    const groups = [
      { id: 'near', shops: Array.from({ length: nearTotal }, (_, id) => ({ id })) },
      { id: 'far', shops: Array.from({ length: farTotal }, (_, id) => ({ id })) },
    ]
    let state = { key: 'search', count: 5, nearCount: 10 }
    for (let i = 0; i < 5; i++) {
      state = expandDistanceGroup(state, 'search', 'near', nearTotal)
      state = expandDistanceGroup(state, 'search', 'far', farTotal)
    }
    for (const group of visibleDistanceGroups(groups, state.count, state.nearCount)) {
      assert.equal(group.remainingCount, 0)
      assert.equal(group.nextCount, 0)
      assert.equal(group.hasMore, false)
      assert.equal(group.visibleShops.length, group.shops.length)
    }
    assert.equal(state.nearCount, nearTotal)
    assert.equal(state.count, farTotal)
  }
})

test('最終追加件数は残件数に合わせ、検索が変われば旧件数を引き継がない', () => {
  const [group] = visibleDistanceGroups([{ id: 'far', shops: Array.from({ length: 12 }, (_, id) => ({ id })) }], 10)
  assert.equal(group.remainingCount, 2)
  assert.equal(group.nextCount, 2)
  assert.deepEqual(expandDistanceGroup({ key: 'old', count: 40, nearCount: 30 }, 'new', 'near', 25), { key: 'new', count: 5, nearCount: 20 })
})
