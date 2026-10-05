# 部屋・設備情報と店舗検索

画面・通信から独立した純粋な検索処理です。既存の画面・共通部品・Overpass処理への変更はありません。

## ファイル

- `roomCatalog.js`: 調査済みデータの登録先と構造の説明。現状は空配列。
- `searchRooms.js`: OSM店舗との紐付け、条件判定、店舗単位の結果作成。
- `sampleRoomData.js`: 開発用の架空部屋と空室データ。店舗紐付け先のみ、取得確認済みの実在OSM ID。
- `roomSearch.test.js`: 条件・欠損・紐付け等のテスト。

## データ構造

店舗登録は `{ id, osmIds, rooms }` です。`id`はKaraMAP独自の永続店舗ID、`osmIds`はOverpassの`id`（例: `node/796698691`）の配列です。名称による紐付けはしません。OSM要素が変わった場合は調査の上で対応表を更新し、独自店舗IDと部屋IDは維持します。
同一実店舗が複数のOSM要素を持つ場合は同じ登録にまとめます。異なる店舗に同一OSM IDを登録するとエラーになります。

部屋の登録例（説明用。実際の情報として登録しないこと）:

```js
{
  id: 'room-001', // 店舗内で一意、変更しない
  name: '確認した部屋名',
  roomType: 'normal', // normal / party / kids / null
  smoking: 'nonSmoking', // nonSmoking / smoking / null
  machines: ['dam'], // dam / joysound。未確認なら null
  features: { aiScoring: true, recording: null },
  capacity: { min: 1, max: 4 }, // 利用可能人数の範囲。不明なら null
  provenance: {
    kind: 'verified', // 開発データは test
    sourceUrl: 'https://example.com/official-room-info',
    checkedAt: '2026-10-05',
  },
}
```

`verified`には出典URLと確認日が必要です。登録者が調査済みと判断するための記録で、プログラムが情報の真偽を確認するものではありません。店舗全体の対応機種などを、根拠なく個別の部屋に割り当てないでください。必要な情報だけ確認できた場合は、残りをnullとして登録できます。

空室は設備とは別に `{ storeId, roomId, status, source: 'test', observedAt }` を渡します。statusはvacant / occupied / unknown。現段階ではテスト値専用で、実空室や件数として表示しないでください。更新・有効期限の判定は未実装です。

## 呼び出し

```js
import { searchRooms } from './searchRooms.js'
import { sampleRoomCatalog, sampleAvailability } from './sampleRoomData.js'

// shops は既存 fetchKaraokeShops() の返却配列を呼び出し元から渡す。
const results = searchRooms({
  shops,
  catalog: sampleRoomCatalog,
  filters: {
    machine: ['dam'],
    smoking: ['nonSmoking'],
    capacity: ['1-2'],
    features: ['aiScoring'],
    vacantOnly: true,
  },
  availability: sampleAvailability,
  includeTestRooms: true,
  includeTestAvailability: true,
})
```

catalog省略時はroomCatalog.jsの登録のみ使用します。テスト部屋・空室の利用はそれぞれ明示的なフラグが必要です。実登録がまだ空のため、既定の検索結果は0件です。

## 条件判定

- キーと値は既存検索条件データに合わせています。文字列または配列を受け付けます。
- 条件間はAND。同じ部屋が全条件を満たす必要があります。他の部屋の機能は合算しません。
- roomType・smoking・capacityの同一項目に複数値がある場合はOR（現画面では単一選択）。machine・featuresは指定された全値を同じ部屋で満たすANDです。
- 未指定・null・空文字・空配列は絞り込みなし。不正な条件名・値はエラーとし、誤って全件検索しません。
- 条件指定時にそのデータが不明なら不一致。条件がなければ欠損項目があっても対象に含めます。
- 人数は部屋の利用可能範囲が選択人数帯を全て含む場合に一致。例: min=1,max=4は1〜2名・3〜4名に一致。min=3,max=12は1〜2名には一致しません。
- 9名以上は9名を収容できるかで判定します。10名など具体的人数の保証はしません。今後、具体的な利用人数を受け取る場合は判定を追加してください。
- vacantOnly=trueは一致部屋自身のvacantが必要。false・未指定なら空室では絞り込みません。複数の矛盾し得る空室レコードは不明扱いです。
- 未取得OSM店舗、部屋未登録店舗、一致部屋0件の店舗は結果に含めません。条件なしでも未調査店舗を全件表示するAPIではありません。

## 結果

```js
[
  {
    storeId: 'dev-store-001',
    shop: { /* Overpassから受け取った店舗情報 */ },
    osmIds: ['node/796698691'], // 今回の取得結果に存在する紐付け先
    matchedRooms: [
      { room: { /* 一致した部屋と出典 */ }, availability: null, isTestData: true },
    ],
  },
]
```

1店舗1結果。複数の紐付け先がある場合、shopはosmIds登録順で最初に取得できた店舗です。店舗件数はresults.length、一致部屋数はmatchedRooms.length。availabilityがnullなら空室不明です。入力の配列やオブジェクトは変更しません。戻り値のshop・roomは入力への参照なので、呼び出し元でも直接書き換えずに扱ってください。

## 検証

```sh
node --test src/services/room-search/roomSearch.test.js src/services/overpass/overpass.test.js
npm run lint
npm run build
```

テストはネットワークへ接続せず、既存Overpassの正規化関数との接続も検証します。

## フロント担当との今後の接続（今回未変更）

- `src/pages/search-filter/search-filter.jsx`: 選択条件と空室スイッチを呼び出し元へ渡す。空室スイッチはvacantOnlyに変換する。
- `src/pages/search-results/search-results.jsx`: 取得済みshopsと登録データで検索し、結果のshopとmatchedRoomsを一覧表示する。loading・通信失敗・0件・未調査を区別する。
- `src/pages/shop-detail/shop-detail.jsx`: storeIdで特定した店舗の部屋データを表示する。履歴やURLへの条件保持方法はフロント担当と合意する。
- 調査済みデータの保存先、更新・重複確認、テスト空室の明示を整える。OSM IDと独自店舗IDの対応はDB移行後も維持する。
- App.jsx、共通カード、MapView等の具体的な変更は、フロント側の最新props設計と統合方式が確定してから担当者と調整する。
