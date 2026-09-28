# ホーム画面

`home.jsx` がホーム画面です。下部の共通ナビゲーションは含みません。
色・フォント・共通サイズは `src/styles/_variables.scss` で変更できます。

## 統合時の接続

- `areaLabel` prop: 現在地の表示名。初期値はFigmaに合わせたサンプルです。
- `shops` prop: `{ id, name, image, availability }` の配列。初期値の空室情報はダミーです。
- `homeData.js`: メニューの表示名と想定リンク先。
- `/search`、`/promotions`、`/shops/:id` は他画面との統合用リンクです。このタスクでは遷移先や位置情報取得、API通信を実装していません。

## 仮画像

元のFigma素材が未提供のため、写真は内蔵image_genツールで生成した代替素材です。実店舗の写真ではありません。正式素材が届いたら次を差し替えてください。

- `public/images/hero-karaoke.webp`
- `public/images/shop-karaoke.webp`

ロゴはテキストとSVGアイコンによる仮の再現です。SVGアイコンは `public/images/icons.svg` に格納しています。

生成プロンプト（内蔵ツール使用、WebPへ変換）:

> Create a photorealistic wide 16:9 website hero background of a Japanese live music venue, viewed over dark audience silhouettes toward a stage. Intense electric blue and magenta laser lights, violet neon columns on both sides, dark navy upper center with empty space for a logo overlay. Symmetrical immersive composition. No text, no logos, no watermark. Save image for website use.

> Photorealistic website placeholder photograph, wide 5:2 composition of a Japanese karaoke shop reception interior. Warm lighting, a reception desk at left, colorful framed music posters on dark blue walls at center, glass panels and corridor at right, no people, no readable text, no logos. Compact slightly nostalgic urban karaoke store, candid interior photography. This is an illustrative generic store, not a specific real business.
