/** OSM記載内容の評価。実店舗の実在・営業中を保証する判定ではない。 */
export function assessKaraokeQuality(shop) {
  const tags = shop.osmTags ?? {}
  const reasons = []
  const reviewReasons = []
  const tagged = tags.amenity === 'karaoke_box'
  if (tagged) reasons.push('amenity_karaoke_box')
  else reviewReasons.push('karaoke_amenity_unconfirmed')

  if (/カラオケ|ジャンカラ|ビッグエコー|まねきねこ/.test(shop.name ?? '')) {
    reasons.push('name_keyword_match')
  }
  if (tags.amenity && !tagged) reviewReasons.push('other_amenity')
  if (Object.entries(tags).some(([key, value]) =>
    (/^(disused|abandoned|demolished|removed|construction|proposed):/.test(key) && value) ||
    (['disused', 'abandoned', 'demolished', 'removed', 'construction', 'proposed'].includes(key) && value === 'yes'),
  )) reviewReasons.push('lifecycle_tag_present')
  if (!shop.name) reviewReasons.push('missing_name')
  if (shop.latitude === null || shop.longitude === null) reviewReasons.push('missing_coordinates')

  // 正規化値や元タグが異なる重複は、先頭を採用するが必ず確認対象にする。
  const signatures = shop.sourceRecords.map((record) => JSON.stringify({
    ...record,
    tags: Object.fromEntries(Object.entries(record.tags).sort(([a], [b]) => a.localeCompare(b))),
  }))
  if (new Set(signatures).size > 1) reviewReasons.push('duplicate_records_differ')

  return {
    status: tagged && reviewReasons.length === 0 ? 'osm_tagged' : 'needs_review',
    reasons,
    reviewReasons,
    duplicateCount: shop.sourceRecords.length - 1,
  }
}
