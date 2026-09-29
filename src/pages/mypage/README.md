# マイページ

`/mypage` で表示します。下部ナビゲーションからアクセスでき、マイページの項目が選択色になります。戻るボタンはホームへ戻ります。

- `mypage.jsx`: プロフィールと会員メニュー。既存Buttonを再利用。
- `mypage.scss`: BEM・rem関数・SCSS変数によるスタイル。
- デフォルトのプロフィールは表示確認用の仮データです。
- ナビゲーションはApp側の共通BottomNavigationを使用します。

接続用props:
- `user`: `{ name, username, avatar }`。avatar省略時はSVGの人物アイコン。
- `onProfile(user)`: プロフィール選択時の処理。
- `onMenuSelect(id)`: `account`（会員情報）または `reservations`（予約履歴）。
- `onBack`: 戻る操作。

会員情報画面・予約履歴画面・認証APIは今回の対象外です。コールバック未指定の項目は表示のみ（aria-disabled）です。
過去に削除予定となった利用履歴・お気に入り店舗は追加していません。今回のFigmaにある予約履歴を表示しています。
