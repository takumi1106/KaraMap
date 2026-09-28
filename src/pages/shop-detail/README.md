# 店舗情報画面

`/shop-detail` で表示するUIプレビューです。戻る操作は `/search` へ移動します。

- `shop-detail.jsx`: 店舗情報、部屋一覧、予約ボタン
- `shop-detail.scss`: 画面専用スタイル
- `shopDetailData.js`: 仮の店舗・部屋データ

共通Button・Tagを再利用し、今回の依頼に合わせて `src/components/RoomCard.jsx` と `RoomCard.scss` を追加しました。

## データと接続口

ShopDetailは `shop`、`onBack`、`onReserve(shop)`、`bottomNavigation` を受け取ります。
予約処理未指定時は見た目のみで、予約ボタンにaria-disabledを設定します。
下部ナビは現在の作業ツリーに存在しないため、共通実装をbottomNavigationへ渡す接続待ちです。

RoomCardには `room` オブジェクトを渡します。

- `id`、`name`、`type`、`capacityLabel`
- `price`: 数値、`priceFrom`: 「〜」の有無、`priceUnit`: 「1時間」など
- `machines`: 機種名の配列
- `image`、`imageAlt`: 任意。画像を指定すると部屋カード上部に表示

部屋一覧は配列から生成し、部屋数0件にも対応しています。
店舗のavailableRoomsは空室APIから取得する想定の独立した値で、掲載部屋数から推測しません。
写真には既存の仮画像を使用しています。店名・料金・評価・営業／空室状況も表示確認用で、実店舗の最新情報ではありません。
検索結果の店舗IDとの接続、店舗API、空室API、予約処理は未実装です。
