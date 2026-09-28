// Figma確認用。写真・評価・空室・料金などは実店舗の情報ではありません。
export const sampleShop = {
  id: 'sample-shop',
  name: 'ジャンカラ　名駅西口店',
  image: '/images/shop-karaoke.webp',
  imageAlt: 'カラオケ店舗の仮イメージ',
  walkingMinutes: 3,
  distanceMeters: 300,
  rating: 4.2,
  reviewCount: 27,
  isOpen: true,
  availableRooms: 5,
  rooms: [
    { id: '301', name: 'ルーム301', type: 'ノーマル', capacityLabel: '4〜6名', price: 600, priceFrom: true, priceUnit: '1時間', machines: ['DAM', 'JOYSOUND'] },
    { id: '302', name: 'ルーム302', type: 'パーティールーム', capacityLabel: '9名', price: 600, priceFrom: true, priceUnit: '1時間', machines: ['DAM', 'JOYSOUND'] },
    { id: '303', name: 'ルーム303', type: 'ノーマル', capacityLabel: '4〜6名', price: 600, priceFrom: true, priceUnit: '1時間', machines: ['DAM', 'JOYSOUND'] },
  ],
}
