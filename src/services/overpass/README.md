# Overpassによる名古屋市内のカラオケ店舗候補取得

画面・地図には未接続です。外部パッケージやAPIキーは不要です。

- `fetchKaraokeShops.js`: 指定された名古屋市のクエリをPOSTして正規化済み配列を返します。
- `normalizeKaraokeShops.js`: node / way / relation を共通形式へ変換します。
- `overpass.test.js`: Node標準テストランナーによる通信・変換のテストです。

```js
import { fetchKaraokeShops } from './fetchKaraokeShops.js'

const controller = new AbortController()
const shops = await fetchKaraokeShops({ signal: controller.signal })
// 不要になったリクエストは controller.abort() で中断可能。
```

返却配列の1要素（ID・店舗名は説明用の例）:

```js
{
  id: 'node/123',
  osmType: 'node',
  osmId: 123,
  name: '店舗名',
  latitude: 35.17,
  longitude: 136.88,
  address: null,
}
```

- `id`は種類と数値IDの組み合わせ。同じ数値のnodeとwayを区別します。
- nodeはlat/lon、wayとrelationは`out center`のcenter.lat/lonを使用します。centerは境界ボックスの中心で、入口の正確な位置とは限りません。
- 名前はname、なければname:ja。名前・住所・座標の欠損はnullです。座標は有限数かつ緯度±90・経度±180以内のみ採用します。地図表示時は両座標の有無を確認してください。
- 住所はaddr:fullを優先し、なければ存在する住所タグを結合します。逆ジオコーディングや住所の推測はしません。不完全な住所の場合もあります。
- 不正な種類・IDの要素は除外し、同一種類＋IDの重複は先頭の1件を残します。同じ実店舗が別のOSM要素に登録されているケースは自動統合しません。
- OSMに登録済みの検索条件に合う候補であり、全実店舗を網羅した一覧・営業中の保証ではありません。名称検索による対象外施設も調査時に確認してください。

## 通信とエラー

既定の接続先は`https://overpass-api.de/api/interpreter`です。`endpoint`で差し替え可能です。
クエリ側のタイムアウトは25秒、クライアント側は既定35秒（`timeoutMs`で変更可能）。
HTTPエラー（429等）、不正JSON、不正な応答形式、remark付きの不完全応答、通信失敗はrejectします。正常な0件のみ空配列を返します。
キャンセルはAbortError、クライアント側タイムアウトはTimeoutErrorです（独自のabort reasonを渡した場合はその理由）。自動再試行・キャッシュ・永続保存は行いません。

## 検証

```sh
node --test src/services/overpass/overpass.test.js
npm run build
```

テストはモック通信で動作し、公開APIに負荷をかけません。

## 今後の作業

1. 取得候補を調査し、実店舗との同一性・重複を確認する。
2. KaraMAP独自の店舗IDとOSMの種類＋IDを紐付ける保存先を作る。OSM要素は編集・置換され得るため、独自店舗IDを部屋情報の主キーにする。
3. 調査済みの実際の部屋・設備情報を独自店舗IDに紐付けて登録する。空室テストデータは実測値と区別して管理する。今回の返却値には部屋・設備・空室情報を含めない。
4. キャッシュ・更新頻度・取得失敗時の扱いを決め、一覧と地図に接続する。位置情報や範囲による検索は別途実装する。
5. 表示・配布時のOpenStreetMap帰属表示とODbLの条件を確認する。

仕様参考: [Overpass QL](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL)

## 実API接続確認（2026-10-05）

`https://overpass-api.de/api/interpreter`に対して、既定のUser-AgentではフォームPOST・GET・本文直接POSTがすべてApacheのHTTP 406を返しました。
同じフォームPOSTに`User-Agent: KaraMAP/0.0.0 (https://github.com/takumi1106/KaraMap)`を指定するとHTTP 200で成功しました。クエリや接続先は変更していません。
この比較から、今回の406は既定のクライアント識別に対するサーバー側の受付制限によるものと判断しています。サーバー内部の判定規則自体は確認できません。

取得関数に識別用User-Agentを追加し、Node.jsのfetchで実API接続に成功しました。
正規化後は43件、座標あり43件、住所あり0件でした。住所は推測せずnullです。件数・登録情報はOSMの更新により変動します。
別インスタンスでの比較は45秒でタイムアウトしたため、接続先の切り替えや自動フォールバックは追加していません。

今回はNode.jsでの取得確認です。ブラウザではUser-Agentの上書きが制限・無視される場合があるため、フロント接続時にはサーバー側取得・キャッシュと、ブラウザからの接続可否を別途確認してください。
406・429発生時の連続再試行は避け、公開サーバーの案内に従い30秒以上待ってください。

参考: [公開Overpassインスタンスの利用案内](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances)
