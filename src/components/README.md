# 共通コンポーネント

各コンポーネントは同名の SCSS を読み込みます。レイアウトに必要な余白・文字サイズは `src/styles/_functions.scss` の `rem()` を使い、色や角丸は `src/styles/_variables.scss` に集約します。

## Button

標準の HTML button props を受け取ります。

```jsx
<Button onClick={handleSearch}>検索する</Button>
<Button type="submit" variant="secondary">条件を適用</Button>
```

- `variant`: `primary`（既定）または `secondary`
- `type`: `button`（既定）、`submit`、`reset`
- `className`: 追加クラス
- `disabled` や `onClick` などの標準 button props

## Tag

```jsx
<Tag variant="success">営業中</Tag>
<Tag variant="dam">DAM</Tag>
<Tag color="#0f766e">独自カラー</Tag>
```

- `variant`: `success`、`primary`、`secondary`（既定）、`dam`、`joysound`、`vacant`
- `color`: 指定時は背景色として適用
- `children`: 表示するラベル
- `className`: 追加クラス
- `title` などの標準 span props

## StoreCard

```jsx
<StoreCard
  href="/stores/jankara-meieki"
  image="/images/store-interior.webp"
  name="ジャンカラ 名駅東口店"
  distance="徒歩3分（200m）"
  status="営業中"
  tags={['空室あり（残り5部屋）', 'DAM', 'JOYSOUND']}
/>
```

- `href`: カード全体のリンク先（既定値は `#`）
- `image`: 店舗写真の URL。省略時は画像を表示しない
- `imageAlt`: 画像の代替テキスト（既定値は店舗名）
- `name`: 店舗名
- `distance`: 距離表示
- `status`: ステータスラベル（既定値は `営業中`）
- `tags`: 追加ラベル。文字列、または `{ label, variant }` の配列
- `className`: 追加クラス

`営業中`、`空室`、`空き`、`DAM`、`JOYSOUND` は `variant` を自動判定します。それ以外は `secondary` になります。

## BottomNavigation

```jsx
<BottomNavigation activeItem="search" />
```

- `activeItem`: 現在の項目の ID（`home`、`search`、`map`、`mypage`）。既定値は `home`
- `items`: ナビゲーション項目の配列。各項目は `{ id, label, href, icon }` を受け取る
- `icon`: `home`、`search`、`map`、`mypage` のいずれか

## RoomCard

店舗詳細に表示する部屋情報カードです。

```jsx
<RoomCard
  room={{
    name: 'ルーム301',
    type: 'ノーマル',
    capacityLabel: '4〜6名',
    price: 600,
    priceFrom: true,
    priceUnit: '1時間',
    machines: ['DAM', 'JOYSOUND'],
  }}
/>
```

- `room.name`: 部屋名
- `room.type`: 部屋タイプ
- `room.capacityLabel`: 定員表示
- `room.price`: 料金。未指定の場合は「料金未設定」
- `room.priceFrom`: `true` の場合、料金に「〜」を付ける
- `room.priceUnit`: 料金単位（既定値は `1時間`）
- `room.machines`: 対応機種の配列。DAM・JOYSOUND は対応する `Tag` variant で表示
- `room.image` / `room.imageAlt`: 任意の室内画像と代替テキスト

「地図から探す」は白いピンアイコンを表示し、現在は地図付き検索結果 `/search?view=map` に移動します。専用地図ページは未実装です。
