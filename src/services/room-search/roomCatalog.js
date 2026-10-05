/**
 * 調査済みデータの登録先。未調査のため空配列（サンプルを自動投入しない）。
 * Store: { id: 独自店舗ID, osmIds: ['node/123'], rooms: Room[] }
 * Room: { id, name, roomType, smoking, machines, features, capacity,
 *   provenance: { kind: 'verified', sourceUrl, checkedAt } }
 * capacity: { min: 正整数, max: 正整数 }。不明項目は null。
 * features: { aiScoring: boolean|null, recording: boolean|null }
 * 空室は別配列 { storeId, roomId, status: 'vacant'|'occupied'|'unknown',
 *   source: 'test', observedAt } で渡す。
 */
export const roomCatalog = []
