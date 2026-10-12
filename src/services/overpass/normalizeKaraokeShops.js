import { assessKaraokeQuality } from './assessKaraokeQuality.js'

const osmTypes = new Set(['node', 'way', 'relation'])

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function coordinate(value, limit) {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit
    ? value
    : null
}

function getAddress(tags) {
  const fullAddress = text(tags['addr:full'])
  if (fullAddress) return fullAddress

  const parts = [
    tags['addr:province'] ?? tags['addr:state'],
    tags['addr:city'],
    tags['addr:ward'],
    tags['addr:suburb'],
    tags['addr:quarter'],
    tags['addr:neighbourhood'],
    tags['addr:place'],
    tags['addr:street'],
    tags['addr:block_number'],
    tags['addr:housenumber'],
  ].map(text).filter(Boolean)
  return parts.length ? [...new Set(parts)].join(' ') : null
}

/**
 * OSM の type + id を紐付けキーにする。欠損情報は推測せず null を返す。
 * @returns {{id: string, osmType: string, osmId: number, name: string|null,
 * latitude: number|null, longitude: number|null, address: string|null}[]}
 */
export function normalizeKaraokeShops(elements) {
  if (!Array.isArray(elements)) return []
  const shops = new Map()

  for (const element of elements) {
    if (!element || !osmTypes.has(element.type) ||
      !Number.isSafeInteger(element.id) || element.id <= 0) continue

    const tags = Object.fromEntries(Object.entries(
      element.tags && typeof element.tags === 'object' && !Array.isArray(element.tags) ? element.tags : {},
    ).filter(([, value]) => typeof value === 'string'))
    const position = element.type === 'node' ? element : element.center
    const id = `${element.type}/${element.id}`

    const shop = {
      id,
      osmType: element.type,
      osmId: element.id,
      name: text(tags.name) ?? text(tags['name:ja']),
      latitude: coordinate(position?.lat, 90),
      longitude: coordinate(position?.lon, 180),
      address: getAddress(tags),
      osmTags: tags,
    }
    const record = {
      tags: { ...tags },
      name: shop.name,
      latitude: shop.latitude,
      longitude: shop.longitude,
      address: shop.address,
    }
    if (shops.has(id)) {
      shops.get(id).sourceRecords.push(record)
    } else {
      shops.set(id, { ...shop, sourceRecords: [record] })
    }
  }

  return [...shops.values()].map((shop) => ({ ...shop, quality: assessKaraokeQuality(shop) }))
}
