# 現在地から探す

`/current-location` で表示します。ホームの「現在地から探す」と共通ナビの「地図から探す」から移動できます。
以前の `/search?view=map` もこの画面を表示します。エリア検索は従来どおり検索結果画面です。

- `current-location.jsx`: 距離選択・地図・店舗一覧
- `current-location.scss`: 画面専用スタイル
- `currentLocationData.js`: 距離選択肢と仮店舗データ

店舗カードは既存 StoreCard、下部ナビは App の BottomNavigation を再利用しています。
カードから店舗情報へ、条件ボタンから検索条件画面へ移動します。

props:

- `shops`: 店舗配列。0 件の表示にも対応。
- `initialRadius`: 初期距離（km 単位の文字列、既定値は `'1'`）。
- `onRadiusChange(radiusKm)`: 距離変更時に数値を通知。
- `mapContent`: 任意の地図の React 要素へ差し替える接続口。

現段階では距離選択の表示のみ変更します。写真・店舗情報は仮データです。Leaflet / react-leaflet と OpenStreetMap で現在地を表示しますが、距離による店舗絞り込み・検索条件との連携は未実装です。

## 位置情報取得

画面表示時にブラウザの Geolocation API を使用します。HTTPS（ローカル開発は localhost）が必要です。取得中・許可拒否・取得不能・タイムアウト・非対応の表示と、エラー時の再取得に対応しています。
緯度・経度・精度・取得時刻は useCurrentLocation フックのメモリ内に保持し、サーバー送信や永続保存は行いません。
`renderMap({ location, status, radiusKm })` を渡すと取得座標を地図コンポーネントへ渡せます。location は未取得時 null です。

## 地図表示

共通の `src/components/MapView.jsx`・`MapView.scss` を使用します。Leaflet / react-leaflet で OpenStreetMap のタイルを表示し、APIキーの設定は不要です。
現在地未取得時は名古屋駅周辺を初期表示し、取得後は現在地へ移動してマーカーを表示します。座標のある店舗には店舗マーカーと店名を表示します。地図の全画面表示・元のサイズへの切り替えにも対応しています。
