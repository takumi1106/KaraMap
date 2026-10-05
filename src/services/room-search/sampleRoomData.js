// OSMの実在店舗IDに紐付ける検索テスト用データ。
// 部屋名・設備・人数・空室はすべて架空。実在する部屋の情報ではない。
export const sampleRoomCatalog = [{
  id: 'dev-store-001',
  osmIds: ['node/796698691'],
  rooms: [
    { id: 'test-room-1', name: 'テスト用ノーマル', roomType: 'normal', smoking: 'nonSmoking', machines: ['dam'], features: { aiScoring: true, recording: false }, capacity: { min: 1, max: 4 }, provenance: { kind: 'test' } },
    { id: 'test-room-2', name: 'テスト用パーティー', roomType: 'party', smoking: 'smoking', machines: ['joysound'], features: { aiScoring: false, recording: true }, capacity: { min: 3, max: 12 }, provenance: { kind: 'test' } },
    { id: 'test-room-3', name: 'テスト用キッズ', roomType: 'kids', smoking: 'nonSmoking', machines: ['joysound'], features: { aiScoring: true, recording: true }, capacity: { min: 1, max: 8 }, provenance: { kind: 'test' } },
  ],
}]

export const sampleAvailability = [
  { storeId: 'dev-store-001', roomId: 'test-room-1', status: 'vacant', source: 'test', observedAt: null },
  { storeId: 'dev-store-001', roomId: 'test-room-2', status: 'occupied', source: 'test', observedAt: null },
]
