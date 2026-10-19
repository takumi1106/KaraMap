# 保存済みの実店舗データ

画面は `public/data/karaoke-shops.json` を読み込み、現在地からの直線距離で範囲を絞ります。Overpassへの自動問い合わせは行いません。ファイル未登録時や不正データ時は、仮店舗に置き換えずエラーを表示します。

## データを登録する

1. https://overpass-turbo.eu/ を開き、次のクエリを実行します。

```overpass
[out:json][timeout:25];
area["name"="名古屋市"]["boundary"="administrative"]->.searchArea;
(
  nwr["amenity"="karaoke_box"](area.searchArea);
  nwr["name"~"カラオケ|ジャンカラ|ビッグエコー|まねきねこ"](area.searchArea);
);
out center tags;
```

2. Exportからraw data（生のJSON）を保存します。GeoJSONも対応しますが、Point以外の形状は中心座標を推測せず要確認にするため、上記out centerの生JSONを推奨します。
3. プロジェクトのルートで実行します。

```sh
node src/services/saved-shops/importShops.js '/書き出したファイルのパス/export.json'
```

4. ローカル画面を再読み込みします。公開サイトへの反映には再ビルド・デプロイが必要です。

取り込み時は保存済みファイルを置き換えます。実行前に表示可能な店舗があることを検査し、失敗した場合は既存ファイルを維持します。実店舗データのファイルはまだ同梱していません。APIキーや個人情報の入ったファイルは登録しないでください。

保存日・元データの日時・OSMのクレジットを保持します。営業中・空室・機種情報は推測しません。未登録の地域は0件になります。店舗データは自動更新されないため、更新時に同じ手順で取り込み直します。OSMへの帰属表示は地図上の既存クレジットを維持しています。
