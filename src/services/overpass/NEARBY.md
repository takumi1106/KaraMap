# 座標からの周辺店舗検索

追加: fetchNearbyKaraokeShops.js、requestKaraokeShops.js、nearby.test.js。
既存fetchKaraokeShops.jsから通信だけをrequestKaraokeShops.jsへ移動しました。名古屋市全域検索の引数・クエリ・返却形式は変更していません。

```js
import { fetchNearbyKaraokeShops } from './fetchNearbyKaraokeShops.js'
import { attachTestAvailability, filterVacantShops } from '../shop-availability/shopAvailability.js'

const shops = await fetchNearbyKaraokeShops({
  latitude: 35.1709,
  longitude: 136.8815,
  radiusMeters: 1000,
  signal: controller.signal, // 呼び出し元のAbortController。省略可
})
const annotated = attachTestAvailability(shops, [
  { shopId: 'node/796698691', status: 'vacant' }, // 明示的なテスト指定。実空室ではない
])
const vacant = filterVacantShops(annotated, { includeTestData: true })
```

座標は緯度±90、経度±180の有限数。半径はメートル単位の整数1〜10000、既定1000です。数値文字列は拒否します。上限は過大な検索を避けるアプリ側の設定です。
Overpassのaroundによる地点指定検索で、市境には制限しません。検索条件は既存同様amenity=karaoke_box、または名称がカラオケ／ジャンカラ／ビッグエコー／まねきねこに一致するnode・way・relationです。

既存normalizeKaraokeShopsを使用し、id・osmType・osmId・name・latitude・longitude・addressを返します。欠損はnull。way/relationのaround判定対象は形状で、返すcenter（境界ボックス中心）が必ず指定円内とは限りません。正確な入口距離・徒歩時間や代表座標での距離順ソートは未実装です。
名称一致だけの候補や未登録店舗もあるため、実在店舗の網羅・営業状態の保証はしません。

通信オプションendpoint・timeoutMs・fetchImpl・signalは既存と同じです。User-Agent、HTTPエラー、remark、キャンセル、タイムアウト処理も共通です。自動再試行や保存はありません。座標はクエリとしてOverpassに送信されます。端末位置の取得・保存は行いません。

## テスト空室

`shopAvailability.js`で店舗単位のテスト値を付与します。店舗IDは必ずOSM種類込みで指定します。対象外IDは無視します。未指定・不正・重複レコードはunknownです。元の店舗を変更せず新しい配列を返します。
追加属性は`availability: { status, source, isTestData }`。正常な指定値はsource=test、isTestData=true。指定がない場合はsource=null、isTestData=false、status=unknown。
`filterVacantShops`は明示的にincludeTestData=trueとした場合のみテストvacantを抽出します。実空室API用の契約・有効期限は未実装です。部屋情報からの集計やroom-searchへの接続はしません。

## フロント担当が今後接続する内容（今回未変更）

- 現在地を取得しているページからlatitude・longitudeと選択半径を渡す。km表示ならメートルへ変換する。
- 検索開始・失敗・0件表示、位置や半径変更時のキャンセル、キャッシュと取得頻度を管理する。
- 空室テストデータを別途渡し、テスト状態であることを画面上で明示する。
- MapViewにはvacant等の店舗配列をshopsとして渡す。既存のid・name・latitude・longitudeは保持される。両座標が有限数の店舗のみマーカー化する。
- 想定接続箇所: src/pages/current-location/current-location.jsx、src/pages/search-results/search-results.jsx。MapViewや店舗カードの変更が必要なら担当者と調整する。今回変更はしていない。
- User-Agentの上書きはブラウザで制限され得るため、サーバー側取得を含め接続方式を決める。OSM帰属表示も維持する。

テスト:
`node --test src/services/overpass/*.test.js src/services/room-search/*.test.js src/services/shop-availability/*.test.js`

仕様: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#Relative_to_other_elements_(around)
