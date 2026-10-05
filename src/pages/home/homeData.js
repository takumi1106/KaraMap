// 遷移先は画面統合時の接続ポイント。検索・詳細ページは本実装の対象外。
export const homeActions = [
  { id: 'location', label: 'エリア検索', icon: 'pin', href: '/search?mode=area' },
  { id: 'keyword', label: 'キーワード検索', icon: 'search', href: '/search-filter' },
  { id: 'mypage', label: 'マイページ', icon: 'user', href: '/mypage' },
  { id: 'promotion', label: '予約履歴', icon: 'ticket', href: '/reservation-history' },
]

// Figmaの表示確認用データ。写真・空室情報は実店舗の情報ではありません。
export const sampleShops = [
  { id: 'big-echo-meieki-3', name: 'ビッグエコー名駅3丁目店', image: '/images/shop-karaoke.webp', availability: '空室あり' },
  { id: 'sample-shop', name: 'カラオケ店舗', image: '/images/shop-karaoke.webp', availability: '空室あり' },
]
