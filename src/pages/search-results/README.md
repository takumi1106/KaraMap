# 検索結果画面

```text
search-results/
├── search-results.jsx
├── search-results.scss
├── searchResultsData.js
└── README.md
```

`/search` で表示します。ホーム画面の既存の検索リンクからもアクセスできます。

- `shops`: 店舗配列。件数は `shops.length` から算出し、0件表示にも対応。
- `renderShop(shop)`: 店舗1件の描画を差し替える関数。共通カードの名前やpropsに合わせたアダプターをここに渡せます。
- `mapContent`: 地図のReact要素。指定しない場合は共通の `MapView` を表示します。
- `onBack`: 戻る操作。`from=search-filter` がある場合は検索条件画面へ、それ以外はホームへ戻ります。URLに遷移元を保持するため再読み込み後も戻り先を維持します。ルーター導入時に履歴の戻る処理を渡せます。
- `bottomNavigation`: 共通ナビゲーションのReact要素。既存実装がまだないため現在は未表示です。独自のナビゲーションは作成していません。

ButtonとTagは既存共通コンポーネントを再利用しています。
店舗カードの仮表示は `search-results.jsx` 内の `renderDefaultShop()` にまとめています。共通カードの正式名称を前提とせず、`renderShop` で差し替えできます。
画面専用のスタイルは `search-results.scss` にまとめています。

店舗は3件の仮データです。写真には既存の生成画像を再利用しています。
位置、店舗名、距離、営業状況、空室情報は表示確認用で、実際の検索結果ではありません。
店舗写真は実際の素材が届いたら差し替えてください。
店舗検索API、検索条件との連携は未実装です。

地図表示は共通の `src/components/MapView.jsx`・`MapView.scss` を使用します。Leaflet / react-leaflet と OpenStreetMap を使用し、APIキーの設定は不要です。
画面表示時に Geolocation API で位置情報を取得し、許可すると現在地を中心にマーカーを表示します。取得エラー時には再取得できます。座標のある店舗のマーカー・店名表示と、地図の全画面表示・縮小にも対応しています。店舗一覧の絞り込みは未連携です。
