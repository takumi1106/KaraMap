import { normalizeKaraokeShops } from './normalizeKaraokeShops.js'

export const NAGOYA_KARAOKE_QUERY = `[out:json][timeout:25];
area["name"="名古屋市"]["boundary"="administrative"]->.searchArea;
(
  nwr["amenity"="karaoke_box"](area.searchArea);
  nwr["name"~"カラオケ|ジャンカラ|ビッグエコー|まねきねこ"](area.searchArea);
);
out center tags;`

const DEFAULT_ENDPOINT = 'https://overpass-api.de/api/interpreter'

/** 名古屋市内の店舗候補を取得する。失敗は空配列にせず呼び出し元へ通知する。 */
export async function fetchKaraokeShops({
  endpoint = DEFAULT_ENDPOINT,
  signal,
  timeoutMs = 35000,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647) {
    throw new RangeError('timeoutMs は有効な正のミリ秒数で指定してください。')
  }
  const controller = new AbortController()
  const cancel = () => controller.abort(signal.reason)
  if (signal?.aborted) cancel()
  else signal?.addEventListener('abort', cancel, { once: true })
  const timer = setTimeout(() => {
    controller.abort(new DOMException('店舗取得がタイムアウトしました。', 'TimeoutError'))
  }, timeoutMs)

  try {
    controller.signal.throwIfAborted()
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'User-Agent': 'KaraMAP/0.0.0 (https://github.com/takumi1106/KaraMap)',
      },
      body: new URLSearchParams({ data: NAGOYA_KARAOKE_QUERY }),
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`店舗取得に失敗しました（HTTP ${response.status}）。`)
    }
    const data = await response.json()
    // HTTP 200 でも remark に実行エラーが入るため、不完全な結果を採用しない。
    if (!data || data.remark || !Array.isArray(data.elements)) {
      throw new Error('Overpass APIから正常な店舗データを取得できませんでした。')
    }
    return normalizeKaraokeShops(data.elements)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}
