export const distanceOptions = [
  { value: '0.5', label: '500m' },
  { value: '1', label: '1km' },
  { value: '3', label: '3km' },
  { value: '5', label: '5km' },
]

// UI確認用データ。実際の位置・店舗・空室情報ではありません。
export const previewShops = [
  {
    id: 'sample-1',
    name: 'ジャンカラ 名駅東口店',
    image: '/images/shop-karaoke.webp',
    imageAlt: 'カラオケ店舗の仮イメージ',
    walkingMinutes: 3,
    distanceMeters: 200,
    status: '営業中',
    tags: ['空室あり（残り5部屋）', 'DAM', 'JOYSOUND'],
    latitude: 35.1715,
    longitude: 136.8840,
  },
]
