# Overpass店舗データの品質情報

normalizeKaraokeShopsの既存項目・並び順・先頭レコード優先を維持し、以下を追加します。名古屋市検索・周辺検索の両方に適用されます。フロント・room-searchには未接続です。

- `osmTags`: 採用した先頭レコードのOSM元タグ。文字列値のみコピー。
- `sourceRecords`: 同じOSM種類＋IDで取得した全レコードのタグ、正規化後の名前・座標・住所。重複の根拠を後から確認できます。
- `quality.status`: `osm_tagged`または`needs_review`。
- `quality.reasons`: 肯定材料。amenity_karaoke_box、name_keyword_match。
- `quality.reviewReasons`: 確認理由の配列。
- `quality.duplicateCount`: 同一種類＋IDで除いた重複件数。

## 重複

node/123とnode/123のみ同一扱い。node/123とway/123は別物です。別IDの店舗は同名・同じ座標でも統合しません。
同一IDの後続レコードが先頭と異なるタグ・正規化値を持つ場合、duplicate_records_differを付け、needs_reviewにします。情報を勝手に混ぜず、後続をsourceRecordsに保持します。タグのキー順序だけの差は競合ではありません。

## 判定

amenity=karaoke_boxを明示的な根拠とします。ただし名前欠損、座標欠損、廃止・建設予定等のライフサイクルタグ、重複内容の相違があればneeds_reviewです。
明示タグのないものは名称やブランド名に一致してもneeds_reviewです。別のamenityがあればother_amenityも付けます。名前一致だけで実店舗と認定しません。

要確認理由:
- karaoke_amenity_unconfirmed: karaoke_boxタグを確認できない
- other_amenity: 別のamenityが付いている
- lifecycle_tag_present: 廃止・放棄・撤去・建設・計画関連のタグがある
- missing_name / missing_coordinates: 名前または座標が欠ける
- duplicate_records_differ: 同一IDの内容が異なる

osm_taggedは「OSMのタグによる裏付けあり」であり、実在確認済み・営業中・現在利用可能という意味ではありません。全てのOSMタグや営業状態を網羅して自動判定するものではなく、sourceRecordsと公式情報を併せた確認が必要です。
needs_reviewの店舗も結果配列に残ります。ID不正・非対応種類の除外は従来どおりです。今回新たに店舗を非カラオケと断定して削除する処理はありません。

例: 後から確認対象を得る場合は`shops.filter(shop => shop.quality.status === 'needs_review')`。
将来の地図・一覧接続時には、qualityを使って要確認表示や表示対象を決めてください。現時点でMapView・ページ・共通カードの変更は不要です。

## 検証

`node --test src/services/overpass/*.test.js src/services/room-search/*.test.js src/services/shop-availability/*.test.js`

実ネットワークへの再取得は行わず、周辺取得関数にモック応答を渡して返却形式・重複処理・品質情報の統合を検証します。
