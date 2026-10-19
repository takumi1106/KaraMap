import { addShopDistances, sortShopsByDistance } from '../shop-distance/shopDistance.js'

export function prepareMapShops(location, shops) {
  const reviewShops = shops.filter((shop) => shop.quality?.status !== 'osm_tagged')
  const results = sortShopsByDistance(addShopDistances(location,
    shops.filter((shop) => shop.quality?.status === 'osm_tagged').map((shop) => ({
      ...shop,
      phone: shop.osmTags?.['contact:phone'] ?? shop.osmTags?.phone ?? null,
      isOpen: null, availableRooms: null, machines: [], rooms: [],
      status: '営業状況未確認', tags: [{ label: '空室状況未確認', variant: 'secondary' }],
      isRealShop: true,
    })),
  ))
  return { results, reviewShops }
}
