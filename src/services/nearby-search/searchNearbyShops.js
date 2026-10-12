import { fetchNearbyKaraokeShops, buildNearbyKaraokeQuery } from '../overpass/fetchNearbyKaraokeShops.js'
import { searchRooms } from '../room-search/searchRooms.js'
import { addShopDistances, sortShopsByDistance } from '../shop-distance/shopDistance.js'

/**
 * 画面・位置情報取得から独立した検索サービス。
 * resultsはMapView等に渡せる店舗配列。reviewShopsに要確認店舗を保持する。
 * テスト設備・空室は明示的に渡し、許可フラグを付けた場合だけ使用する。
 */
export async function searchNearbyShops({
  latitude,
  longitude,
  radiusMeters,
  values = {},
  realtimeAvailable = false,
  catalog,
  roomAvailability = [],
  testShopStates,
  includeTestRooms = false,
  includeTestAvailability = false,
  requestOptions = {},
} = {}) {
  if (testShopStates !== undefined) throw new TypeError('店舗空室では検索できません。部屋のavailabilityまたはroomAvailabilityを指定してください。')
  if (typeof realtimeAvailable !== 'boolean') throw new TypeError('realtimeAvailableは真偽値で指定してください。')
  // 通信前に入力を確認。部屋単位の空室条件と店舗単位のスイッチを混同しない。
  if (values && Object.hasOwn(values, 'vacantOnly')) {
    throw new TypeError('空室条件はrealtimeAvailableで指定してください。')
  }
  searchRooms({ filters: values })
  buildNearbyKaraokeQuery({ latitude, longitude, radiusMeters })

  const shops = await fetchNearbyKaraokeShops({ ...requestOptions, latitude, longitude, radiusMeters })
  const reviewShops = shops.filter((shop) => shop.quality?.status !== 'osm_tagged')
  const candidates = shops.filter((shop) => shop.quality?.status === 'osm_tagged')
  const matches = searchRooms({
    shops: candidates, catalog, filters: { ...values, vacantOnly: realtimeAvailable },
    includeTestRooms, includeTestAvailability, availability: roomAvailability,
  })
  const matchedShops = matches.map(({ shop, storeId, osmIds, matchedRooms }) => ({
    ...shop,
    storeId,
    osmIds,
    matchedRooms,
    // 条件一致した部屋だけから集計。店舗全体の空室状態ではない。
    availability: {
      status: matchedRooms.some((match) => match.availability?.status === 'vacant') ? 'vacant'
        : matchedRooms.every((match) => match.availability?.status === 'occupied') ? 'occupied' : 'unknown',
      source: matchedRooms.some((match) => match.availability?.source === 'test') ? 'test' : null,
      isTestData: matchedRooms.some((match) => match.availability?.source === 'test'),
      scope: 'matched_rooms',
    },
  }))
  const results = sortShopsByDistance(addShopDistances({ latitude, longitude }, matchedShops))
    .map((shop) => ({
      ...shop,
      isTestData: shop.availability.isTestData || shop.matchedRooms.some((match) => match.isTestData),
    }))

  return { results, reviewShops, fetchedShops: shops }
}
