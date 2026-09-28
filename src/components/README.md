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

- `activeItem`: 現在の項目の ID（`home`、`search`、`favorites`、`mypage`）。既定値は `home`
- `items`: ナビゲーション項目の配列。各項目は `{ id, label, href, icon }` を受け取る
- `icon`: `home`、`search`、`favorites`、`mypage` のいずれか
