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
- `mapContent`: 地図のReact要素。将来Google Mapsを扱うコンポーネントを渡せます。
- `onBack`: 戻る操作。単独表示時はホームに戻ります。ルーター導入時に履歴の戻る処理を渡せます。
- `bottomNavigation`: 共通ナビゲーションのReact要素。既存実装がまだないため現在は未表示です。独自のナビゲーションは作成していません。

ButtonとTagは既存共通コンポーネントを再利用しています。
店舗カードの仮表示は `search-results.jsx` 内の `renderDefaultShop()` にまとめています。共通カードの正式名称を前提とせず、`renderShop` で差し替えできます。
地図の仮表示も同じファイル内に置き、スタイルはすべて `search-results.scss` にまとめています。

店舗は3件の仮データです。写真には既存の生成画像を再利用し、地図には手描きのSVGを使用しています。
位置、店舗名、距離、営業状況、空室情報は表示確認用で、実際の検索結果ではありません。
元のFigmaの店舗写真・地図素材が届いたら差し替えてください。
位置情報取得、Google Maps API、検索API、検索条件との連携は未実装です。
