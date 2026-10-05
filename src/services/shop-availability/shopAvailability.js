/**
 * テスト空室: [{ shopId: 'node/123', status: 'vacant'|'occupied'|'unknown' }]
 * 未指定・不正・重複はunknown。乱数や店舗情報から空室を推測しない。
 */
export function attachTestAvailability(shops = [], testStates = []) {
  const states = new Map()
  for (const state of Array.isArray(testStates) ? testStates : []) {
    if (!state || typeof state.shopId !== 'string') continue
    if (states.has(state.shopId)) {
      states.set(state.shopId, null)
    } else {
      states.set(state.shopId, state)
    }
  }
  return (Array.isArray(shops) ? shops : [])
    .filter((shop) => shop && typeof shop.id === 'string')
    .map((shop) => {
      const state = states.get(shop.id)
      const valid = state && ['vacant', 'occupied', 'unknown'].includes(state.status)
      return {
        ...shop,
        availability: {
          status: valid ? state.status : 'unknown',
          source: valid ? 'test' : null,
          isTestData: Boolean(valid),
        },
      }
    })
}

/** テスト値を実空室と混同しないため、抽出には明示的な許可が必要。 */
export function filterVacantShops(shops = [], { includeTestData = false } = {}) {
  return (Array.isArray(shops) ? shops : []).filter((shop) =>
    includeTestData === true && shop?.availability?.status === 'vacant' &&
    shop.availability.source === 'test' && shop.availability.isTestData === true,
  )
}
