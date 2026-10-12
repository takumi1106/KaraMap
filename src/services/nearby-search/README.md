# 現在地・部屋条件・部屋空室の統合検索

searchNearbyShopsは既存Overpass・room-search・shop-distanceを利用する非同期サービスです。フロント接続やHTTPサーバー、DBは追加していません。

```js
import { searchNearbyShops } from './searchNearbyShops.js'
import { sampleRoomCatalog } from '../room-search/sampleRoomData.js'

const { results, reviewShops, fetchedShops } = await searchNearbyShops({
  latitude: 35.1709,
  longitude: 136.8815,
  radiusMeters: 1000,
  values: {
    roomType: ['normal'], smoking: ['nonSmoking'], machine: ['dam'],
    features: ['aiScoring'], capacity: ['1-2'],
  },
  realtimeAvailable: true,
  catalog: sampleRoomCatalog,
  includeTestRooms: true,
  includeTestAvailability: true,
})
```

## 空室の構造

各部屋に`availability: { status: 'vacant', source: 'test', observedAt: null }`を手入力します。vacant=空室、occupied=使用中、unknown=不明です。実空室APIではありません。サンプルの部屋・設備情報も実在部屋の情報ではありません。

従来の部屋別配列を使用する場合は`roomAvailability: [{ storeId, roomId, status, source: 'test', observedAt }]`を指定できます。同一店舗ID・部屋IDの外部レコードがあれば部屋内の値より優先します。重複・不正な外部レコードがある場合は不明扱いにし、部屋内の空室値へ戻しません。

includeTestAvailability=trueの場合だけテスト空室を使用します。テスト部屋の利用には別途includeTestRooms=trueも必要です。どちらも既定false。未指定の設備・空室は生成しません。

## 検索の流れ

1. 入力検証後、座標・半径でOverpassから取得し、既存の正規化・品質判定を適用。
2. 通常検索対象はosm_taggedのみ。needs_review等はreviewShopsに保持。
3. room-searchで同じ1部屋が全設備条件を満たすか判定。
4. realtimeAvailable=trueなら、その同じ部屋のテスト状態がvacantの場合だけ一致。occupied・unknown・欠損は不一致。
5. 一致部屋が1件以上の店舗だけを残し、距離を計算して昇順に並べる。

OFF時は空室に関係なく条件に一致する部屋を返します。ON時に条件に合う使用中の部屋と条件に合わない空室を組み合わせて一致にはしません。
人数帯・複数条件の意味はroom-searchの既存仕様を維持します。条件なしでも登録済みの対象部屋がない店舗は結果に含みません。

## 返却値

- results: 店舗配列。既存id/osmId/osmType/name/latitude/longitude/address/quality/元タグ等を保持。
- 各店舗にはstoreId、osmIds、distanceMeters、matchedRooms、isTestDataを追加。
- matchedRoomsの各要素は`{ room, availability, isTestData }`。ONでは通過した空室部屋だけ。OFFでは使用中・不明も含み得ます。
- 店舗のavailabilityは**一致した部屋だけの集計**です。scope='matched_rooms'を付け、vacantが1件でもあればvacant、全てoccupiedならoccupied、それ以外unknown。これは店舗全体の空室情報ではありません。
- reviewShops: 通常結果から除外した品質要確認店舗。
- fetchedShops: 絞り込み前の全取得店舗。

旧testShopStates引数は誤用防止のためエラーにします。部屋内availabilityかroomAvailabilityへ移行してください。shop-availabilityサービス自体は削除・変更していません。
値の保存・更新・有効期限管理や実空室APIとの連携は未実装です。入力は変更しませんが、ネスト内には既存データの参照があるため呼び出し側でも直接書き換えないでください。

## 今後のフロント接続（今回未変更）

検索画面の条件と現在地を呼び出し元から渡し、resultsとmatchedRoomsを表示します。空室はテストと明示し、店舗集計のscopeにも注意してください。取得中・失敗・0件・キャンセルを管理し、既存の仮画像・徒歩時間等がない実店舗データの表示はフロント担当と調整してください。MapViewには有効座標の店舗を渡します。ブラウザのUser-Agent制限を考慮しサーバー取得・キャッシュ方式は別途決定します。

検証: `node --test src/services/*/*.test.js`。通信はモックで、既存サービスの実関数を組み合わせて検証します。
