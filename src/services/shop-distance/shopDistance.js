// 平均地球半径を使う球面近似。道路距離や徒歩時間ではない。
const EARTH_RADIUS_METERS = 6371008.8
const radians = (degrees) => degrees * Math.PI / 180

function validPosition(position) {
  return position != null &&
    Number.isFinite(position.latitude) && Math.abs(position.latitude) <= 90 &&
    Number.isFinite(position.longitude) && Math.abs(position.longitude) <= 180
}

/** 2地点の大円距離（m）。座標不正時はnull。丸めは呼び出し元で行う。 */
export function calculateDistanceMeters(from, to) {
  if (!validPosition(from) || !validPosition(to)) return null
  const latitudeDelta = radians(to.latitude - from.latitude)
  const longitudeDelta = radians(to.longitude - from.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) *
    Math.sin(longitudeDelta / 2) ** 2
  // 対蹠点付近の浮動小数誤差でsqrtの範囲外にならないよう補正。
  const clamped = Math.min(1, Math.max(0, a))
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped))
}

/** 店舗は浅いコピーを作り、最新の現在地に基づくdistanceMetersを付与する。 */
export function addShopDistances(currentLocation, shops = []) {
  if (!Array.isArray(shops)) throw new TypeError('店舗データは配列で指定してください。')
  return shops.map((shop) => {
    if (!shop || typeof shop !== 'object' || Array.isArray(shop)) {
      throw new TypeError('各店舗はオブジェクトで指定してください。')
    }
    return { ...shop, distanceMeters: calculateDistanceMeters(currentLocation, shop) }
  })
}

/** 有効な距離を昇順に並べる。不明値は末尾、同距離・不明同士は元の順序。 */
export function sortShopsByDistance(shops = []) {
  if (!Array.isArray(shops)) throw new TypeError('店舗データは配列で指定してください。')
  const distance = (shop) => Number.isFinite(shop?.distanceMeters) && shop.distanceMeters >= 0
    ? shop.distanceMeters : Infinity
  return shops.map((shop, index) => ({ shop, index })).sort((a, b) => {
    const first = distance(a.shop)
    const second = distance(b.shop)
    return first === second ? a.index - b.index : first - second
  }).map(({ shop }) => shop)
}
