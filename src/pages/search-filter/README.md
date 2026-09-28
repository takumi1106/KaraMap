# 検索条件画面

`/search-filter` で表示します。戻るボタンは `/search` に戻ります。

- `search-filter.jsx`: 画面全体。既存の共通Buttonを再利用。
- `search-filter.scss`: BEM・rem関数・SCSS変数を使った画面専用スタイル。
- `searchFilterData.js`: 選択肢とFigmaの初期選択状態。

今回は見た目の実装です。初期表示はノーマル・禁煙・DAM・AI採点・1〜2名を選択、空室スイッチはONです。
Figmaどおり空室パネルを上下2か所に表示し、同一の値を参照しています。

後から機能を追加する際は、親から以下のpropsを渡せます。

- `values`: グループIDをキー、選択値の配列を値にしたオブジェクト。
- `onOptionSelect(groupId, value)`: 選択時の通知。単一／複数選択のルールは親に実装。
- `realtimeAvailable` / `onRealtimeChange(nextValue)`: 空室スイッチの値と変更通知。
- `onBack`: 戻る操作。
- `bottomNavigation`: 既存の共通ナビゲーションを渡す差し込み口。

変更コールバック未指定時は表示専用で、ボタンにaria-disabledを設定します。
現在の作業ツリーに下部ナビゲーションが存在しないため、重複作成せず接続待ちです。
検索API・条件保存・絞り込み処理は含みません。
