import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { searchSavedShops } from '../saved-shops/savedShops.js'
import { readRoomSearch, roomSearchParams, searchRoomPageShops } from './roomSearchPage.js'
import { demoOrigin, detailPath, reservationPath, searchContext, groupByDistance } from '../search-flow/searchFlow.js'

const data = JSON.parse(readFileSync(new URL('../../../public/data/karaoke-shops.json', import.meta.url), 'utf8'))
const shops = searchSavedShops(data, demoOrigin, null).results
const search = (keyword, values = {}, source = shops) => searchRoomPageShops(source, { keyword, values, realtimeAvailable: false })

test('保存済み実店舗を部分一致で検索し、名前だけなら未登録部屋の店舗も残す', () => {
  for (const keyword of ['ジャンカラ', 'ビッグエコー', 'まねきねこ']) {
    const results = search(keyword)
    assert.ok(results.length > 0)
    assert.ok(results.every((shop) => shop.name.includes(keyword)))
    assert.ok(results.some((shop) => !shop.matchedRooms))
  }
  assert.deepEqual(search('存在しない検索キーワード'), [])
  assert.equal(search('名駅東口')[0].id, 'node/13943005393')
})

test('全半角英数字・大文字小文字・前後空白を吸収し、未入力は従来と同じ', () => {
  assert.deepEqual(search('　ｂｉｇｅｃｈｏ  '), search('BIGECHO'))
  assert.ok(search('BIGECHO').length > 0)
  // 数字を含む表記の正規化専用テストfixture。店舗データには追加しない。
  const fixture = [{ ...shops[0], id: 'test/name-normalization', name: 'ＫＡＲＡ１２３' }]
  assert.equal(search(' kara123 ', {}, fixture).length, 1)
  assert.deepEqual(search(''), searchRoomPageShops(shops, { values: {}, realtimeAvailable: false }))
  assert.deepEqual(search('　 '), search(''))
})

test('名前と設備条件のANDで701・702を検索し、未登録店舗・未確認設備を除外', () => {
  for (const [machine, capacity, number] of [['dam', '1-2', '701'], ['joysound', '5-8', '702']]) {
    const result = search('ジャンカラ', { machine: [machine], capacity: [capacity] })
    assert.equal(result.length, 1)
    assert.equal(result[0].matchedRooms[0].room.roomNumber, number)
  }
  assert.deepEqual(search('ビッグエコー', { machine: ['dam'] }), [])
  assert.deepEqual(search('ジャンカラ', { smoking: ['nonSmoking'] }), [])
})

test('名前検索でも距離区分と距離順を維持し、遠方店舗を除外しない', () => {
  const result = search('まねきねこ')
  const [near, far] = groupByDistance(result)
  assert.ok(near.shops.length > 0)
  assert.ok(far.shops.length > 0)
  assert.deepEqual([...near.shops, ...far.shops], result)
  const remote = searchSavedShops(data, { latitude: 35.6812, longitude: 139.7671 }, null).results
  const remoteResult = search('ジャンカラ', { machine: ['dam'] }, remote)
  assert.equal(groupByDistance(remoteResult)[0].shops.length, 0)
  assert.equal(groupByDistance(remoteResult)[1].shops.length, 1)
})

test('入力文字列をURLに保持し、詳細・予約から検索条件へ復元する', () => {
  const input = { keyword: '　ジャンカラ & ＡＢ１２　', values: { machine: ['dam'] }, realtimeAvailable: false }
  const params = roomSearchParams(input)
  params.set('origin', 'demo')
  const detail = new URL(detailPath('node/13943005393', params), 'https://example.test')
  const reservation = new URL(reservationPath('node/13943005393', 'jankara-188-room-701', detail.searchParams), detail)
  assert.deepEqual(readRoomSearch(searchContext(reservation.searchParams)), { ...input, error: null })
  assert.equal(reservation.searchParams.get('origin'), 'demo')
})

test('名前検索は入力店舗データを変更しない', () => {
  const before = structuredClone(shops)
  search('ジャンカラ')
  search('まねきねこ', { machine: ['dam'] })
  assert.deepEqual(shops, before)
})
