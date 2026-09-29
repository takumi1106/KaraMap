# 検索条件画面

`/search-filter` で表示します。戻るボタンはホーム `/` に戻ります。

- `search-filter.jsx`: 画面全体。既存の共通Buttonを再利用。
- `search-filter.scss`: BEM・rem関数・SCSS変数を使った画面専用スタイル。
- `searchFilterData.js`: 選択肢とFigmaの初期選択状態。

ボタンを押すと選択状態が切り替わります。部屋タイプ・禁煙／喫煙・機種・収容人数は単一選択、採点・録音は複数選択（再クリックで解除）です。初期表示はノーマル・禁煙・DAM・AI採点・1〜2名を選択、空室スイッチはONです。
空室スイッチは上部に表示します。「この条件で検索する」を押すと `/search?from=search-filter` に移動します。検索結果の戻るボタンは検索条件画面へ戻ります。現段階では画面遷移のみで、選択条件による結果の絞り込みは未接続です。`onSearch({ values, realtimeAvailable })` を渡すことで、選択条件を受け取る検索処理に差し替えられます。

通常は画面内で選択状態を管理します。親から制御する場合は、以下のpropsと対応する変更コールバックを渡せます。

- `values`: グループIDをキー、選択値の配列を値にしたオブジェクト。
- `onOptionSelect(groupId, value)`: 選択時の通知。valuesを渡す場合は親で選択値を更新します。
- `realtimeAvailable` / `onRealtimeChange(nextValue)`: 空室スイッチの値と変更通知。
- `onBack`: 戻る操作。
- `bottomNavigation`: 既存の共通ナビゲーションを渡す差し込み口。

値のpropsだけを渡して変更コールバックを省略した場合は表示専用です。
下部ナビゲーションはApp側で既存の共通コンポーネントを表示しています。
検索API・条件保存・絞り込み処理は含みません。
