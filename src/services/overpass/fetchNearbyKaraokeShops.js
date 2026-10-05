import { requestKaraokeShops } from './requestKaraokeShops.js'

export const DEFAULT_RADIUS_METERS = 1000
export const MAX_RADIUS_METERS = 10000

export function buildNearbyKaraokeQuery({ latitude, longitude, radiusMeters = DEFAULT_RADIUS_METERS } = {}) {
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) {
    throw new RangeError('緯度は-90〜90の数値で指定してください。')
  }
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    throw new RangeError('経度は-180〜180の数値で指定してください。')
  }
  if (!Number.isInteger(radiusMeters) || radiusMeters <= 0 || radiusMeters > MAX_RADIUS_METERS) {
    throw new RangeError(`検索半径は1〜${MAX_RADIUS_METERS}mの整数で指定してください。`)
  }
  // 固定小数表記で数値のみを埋め込み、指数表記・文字列挿入を避ける。
  const around = `(around:${radiusMeters},${latitude.toFixed(8)},${longitude.toFixed(8)})`
  return `[out:json][timeout:25];
(
  nwr["amenity"="karaoke_box"]${around};
  nwr["name"~"カラオケ|ジャンカラ|ビッグエコー|まねきねこ"]${around};
);
out center tags;`
}

/** 座標取得は呼び出し元で行う。現在地の取得・保存・画面更新はしない。 */
export async function fetchNearbyKaraokeShops({ latitude, longitude, radiusMeters, ...requestOptions } = {}) {
  const query = buildNearbyKaraokeQuery({ latitude, longitude, radiusMeters })
  return requestKaraokeShops(query, requestOptions)
}
