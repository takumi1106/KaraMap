import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeKaraokeShops } from './normalizeKaraokeShops.js'
import { fetchNearbyKaraokeShops } from './fetchNearbyKaraokeShops.js'

const element = { type: 'node', id: 1, lat: 35, lon: 136, tags: { name: '店舗', amenity: 'karaoke_box' } }

test('OSMの明示タグを根拠にし、元タグを保持する', () => {
  const [shop] = normalizeKaraokeShops([element])
  assert.equal(shop.quality.status, 'osm_tagged')
  assert.deepEqual(shop.osmTags, element.tags)
  assert.deepEqual(shop.quality.reasons, ['amenity_karaoke_box'])
})

test('名称・ブランド一致だけでは確定せず残す', () => {
  for (const name of ['カラオケ喫茶', 'ジャンカラ', 'ビッグエコー', 'まねきねこ']) {
    const [shop] = normalizeKaraokeShops([{ ...element, tags: { name } }])
    assert.equal(shop.quality.status, 'needs_review')
    assert.ok(shop.quality.reasons.includes('name_keyword_match'))
  }
})

test('異種施設・廃止タグ・欠損も削除しない', () => {
  for (const tags of [{ name: 'カラオケ喫茶', amenity: 'cafe' }, { ...element.tags, 'disused:amenity': 'karaoke_box' }, null, []]) {
    const shops = normalizeKaraokeShops([{ ...element, tags }])
    assert.equal(shops.length, 1)
    assert.equal(shops[0].quality.status, 'needs_review')
  }
  const [shop] = normalizeKaraokeShops([{ type: 'way', id: 1, tags: element.tags }])
  assert.ok(shop.quality.reviewReasons.includes('missing_coordinates'))
})

test('同じOSM種類とIDは必ず重複除去、タグ順序差は競合にしない', () => {
  const result = normalizeKaraokeShops([element, { ...element, tags: { amenity: 'karaoke_box', name: '店舗' } }])
  assert.equal(result.length, 1)
  assert.equal(result[0].quality.duplicateCount, 1)
  assert.equal(result[0].quality.status, 'osm_tagged')
})

test('同名・同座標でも異なるIDまたは種類なら統合しない', () => {
  assert.equal(normalizeKaraokeShops([element, { ...element, id: 2 }, { ...element, type: 'way', center: { lat: 35, lon: 136 } }]).length, 3)
})

test('内容が違う重複は先頭を維持し、後続の根拠を失わない', () => {
  const other = { ...element, tags: { name: '別名', amenity: 'cafe' }, lat: 36 }
  const [shop] = normalizeKaraokeShops([element, other])
  assert.equal(shop.name, '店舗')
  assert.equal(shop.quality.status, 'needs_review')
  assert.ok(shop.quality.reviewReasons.includes('duplicate_records_differ'))
  assert.equal(shop.sourceRecords[1].tags.amenity, 'cafe')
  assert.equal(shop.sourceRecords[1].latitude, 36)
})

test('入力のタグを変更せず、出力とも共有しない', () => {
  const before = JSON.stringify(element)
  const [shop] = normalizeKaraokeShops([element])
  shop.osmTags.name = '変更'
  assert.equal(JSON.stringify(element), before)
  assert.equal(shop.sourceRecords[0].tags.name, '店舗')
})

test('周辺取得からも品質付き店舗を互換形式で返す', async () => {
  const shops = await fetchNearbyKaraokeShops({ latitude: 35, longitude: 136,
    fetchImpl: async () => ({ ok: true, json: async () => ({ elements: [element, element] }) }),
  })
  assert.equal(shops.length, 1)
  assert.equal(shops[0].id, 'node/1')
  assert.equal(shops[0].latitude, 35)
  assert.equal(shops[0].quality.duplicateCount, 1)
})
