// 公式に確認できた項目のみ。nullは未確認であり、非対応を意味しない。
const sourceUrl = 'https://jankara.ne.jp/shop/188/'
const checkedAt = '2026-10-19'
const provenance = {
  kind: 'verified',
  sourceUrl,
  checkedAt,
  confirmedFields: ['roomNumber', 'name', 'officialRoomType', 'capacity', 'machines', 'machineModel'],
}

export const verifiedRoomCatalog = [{
  id: 'jankara-meieki-higashiguchi',
  name: 'ジャンカラ 名駅東口店',
  address: '愛知県名古屋市中村区名駅四丁目10番20号 コムテックタワー5〜8Ｆ',
  osmIds: ['node/13943005393'],
  provenance: {
    kind: 'verified', sourceUrl, checkedAt,
    confirmedFields: ['name', 'address'],
  },
  osmLinkEvidence: {
    sourceUrl,
    checkedAt,
    officialMapCenter: { latitude: 35.16950159, longitude: 136.8858977 },
    savedPosition: { latitude: 35.1694276, longitude: 136.885938 },
    reason: '保存データの名称ジャンカラと公式住所・店舗地図の位置を照合（約9m差）。名称だけの自動結合ではない。',
    discrepancy: '保存OSMのbrandはカラオケバンバン。公式店舗情報と矛盾するため採用せず、OSM原本は変更しない。',
  },
  // 店舗の全室ではなく、公式ページで個別設備を確認した2室だけ。
  rooms: [
    {
      id: 'jankara-188-room-701',
      roomNumber: '701',
      name: '701号室 レセプションルーム',
      officialRoomType: 'レセプションルーム',
      roomType: null,
      smoking: null,
      machines: ['dam'],
      machineModel: 'LIVE DAM WAO!',
      features: { aiScoring: null, recording: null },
      capacity: { min: 1, max: 5 },
      provenance: { ...provenance, section: '701号室の部屋紹介' },
      availability: { status: 'unknown', source: null },
    },
    {
      id: 'jankara-188-room-702',
      roomNumber: '702',
      name: '702号室 ホームシアタールーム',
      officialRoomType: 'ホームシアタールーム',
      roomType: null,
      smoking: null,
      machines: ['joysound'],
      machineModel: 'JOYSOUND X1',
      features: { aiScoring: null, recording: null },
      capacity: { min: 1, max: 8 },
      provenance: { ...provenance, section: '702号室の部屋紹介' },
      availability: { status: 'unknown', source: null },
    },
  ],
}]
