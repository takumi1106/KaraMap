// 実行例: node src/services/saved-shops/importShops.js /path/to/export.json
import process from 'node:process'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseSavedShops } from './savedShops.js'

const input = process.argv[2]
if (!input) {
  console.error('書き出したJSONファイルのパスを指定してください。')
  process.exitCode = 1
} else {
  try {
    const data = JSON.parse(await readFile(input, 'utf8'))
    const shops = parseSavedShops(data)
    const visible = shops.filter((shop) => shop.quality.status === 'osm_tagged')
    if (!visible.length) throw new Error('表示可能な店舗が0件です。amenity=karaoke_boxと座標が含まれる結果を確認してください。')
    const directory = new URL('../../../public/data/', import.meta.url)
    const target = new URL('karaoke-shops.json', directory)
    await mkdir(directory, { recursive: true })
    // 元データのタグ・OSM IDを残し、読み込み時にも既存の品質判定を使う。
    const elements = shops.flatMap((shop) => shop.sourceRecords.map((record) => ({
      type: shop.osmType, id: shop.osmId, tags: record.tags,
      ...(shop.osmType === 'node' ? { lat: record.latitude, lon: record.longitude } : { center: { lat: record.latitude, lon: record.longitude } }),
    })))
    await writeFile(target, JSON.stringify({
      source: 'OpenStreetMap / Overpass export',
      attribution: '© OpenStreetMap contributors',
      license: 'https://www.openstreetmap.org/copyright',
      importedAt: new Date().toISOString(),
      dataTimestamp: data.osm3s?.timestamp_osm_base ?? data.timestamp ?? null,
      elements,
    }, null, 2) + '\n', 'utf8')
    console.log(`保存先: ${fileURLToPath(target)}\n店舗: ${shops.length}件、表示対象: ${visible.length}件、要確認: ${shops.length - visible.length}件`)
  } catch (error) {
    console.error(`取り込みできませんでした: ${error.message}`)
    process.exitCode = 1
  }
}
