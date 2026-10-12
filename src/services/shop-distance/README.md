# 店舗までの直線距離

`shopDistance.js`に通信・UIから独立した3関数を用意しています。

```js
import { addShopDistances, sortShopsByDistance } from './shopDistance.js'

const withDistances = addShopDistances(currentLocation, shops)
const nearestFirst = sortShopsByDistance(withDistances)
```

- `calculateDistanceMeters(from, to)`: `{ latitude, longitude }`同士の大円距離をハーサイン式で計算。平均地球半径6,371,008.8mの球面近似を使用。
- `addShopDistances(currentLocation, shops)`: 各店舗の浅いコピーにdistanceMetersを追加。元配列・店舗は変更せず、品質情報・住所等の既存プロパティを保持。既存distanceMetersがあれば現在地で再計算。
- `sortShopsByDistance(shops)`: 新しい配列を返す。距離の昇順、不明値は最後。同じ距離や不明同士は入力順を維持。店舗オブジェクト自体は入力と同じ参照。

distanceMetersは丸めていないメートル単位の数値、計算不能ならnullです。表示時に丸めてください。道路距離・徒歩時間・建物入口までの距離ではありません。OSMのway/relationは代表点との距離です。

緯度±90、経度±180以内の有限なnumberだけを受け付けます。0は有効。文字列の数値変換はしません。現在地が不正な場合は全店舗のdistanceMetersがnullになります。座標欠損店舗も削除せず残します。
店舗配列自体の形式が不正な場合、または距離付与に渡す店舗要素がオブジェクトでない場合はTypeErrorです。ソートは欠損・負値・NaN・Infinity・数値文字列を全て不明距離として最後に配置します。

品質判定・元タグなどのネストした情報は浅いコピーで保持します。この関数は変更しませんが、呼び出し元がネスト内を書き換えると元データにも影響するため、直接変更しないでください。

将来はOverpass取得・品質判定後の配列と既存位置情報をこの処理へ渡し、結果を画面に渡してください。フロント・Overpass・room-searchの変更や接続は今回行っていません。

検証: `node --test src/services/shop-distance/shopDistance.test.js`
