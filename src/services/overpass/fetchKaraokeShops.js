import { requestKaraokeShops } from './requestKaraokeShops.js'

export const NAGOYA_KARAOKE_QUERY = `[out:json][timeout:25];
area["name"="名古屋市"]["boundary"="administrative"]->.searchArea;
(
  nwr["amenity"="karaoke_box"](area.searchArea);
  nwr["name"~"カラオケ|ジャンカラ|ビッグエコー|まねきねこ"](area.searchArea);
);
out center tags;`

/** 既存の名古屋市全域検索。引数・返却形式は従来どおり。 */
export function fetchKaraokeShops(options = {}) {
  return requestKaraokeShops(NAGOYA_KARAOKE_QUERY, options)
}
