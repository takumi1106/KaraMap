export const filterGroups = [
  {
    id: 'roomType',
    label: '部屋タイプ',
    options: [
      { value: 'normal', label: 'ノーマル' },
      { value: 'party', label: '大人数用', description: '（パーティールーム）' },
      { value: 'kids', label: 'キッズルーム' },
    ],
  },
  {
    id: 'smoking',
    label: '禁煙・喫煙',
    options: [
      { value: 'nonSmoking', label: '禁煙' },
      { value: 'smoking', label: '喫煙' },
    ],
  },
  {
    id: 'machine',
    label: '機種',
    options: [
      { value: 'dam', label: 'DAM' },
      { value: 'joysound', label: 'JOYSOUND' },
    ],
  },
  {
    id: 'features',
    multiple: true,
    label: '採点・録音',
    options: [
      { value: 'aiScoring', label: 'AI採点' },
      { value: 'recording', label: '録音可能' },
    ],
  },
  {
    id: 'capacity',
    label: '収容人数',
    options: [
      { value: '1-2', label: '1〜2名' },
      { value: '3-4', label: '3〜4名' },
      { value: '5-8', label: '5〜8名' },
      { value: '9-plus', label: '9名以上' },
    ],
  },
]

// Figmaの初期表示。配列で持つことで単一選択・複数選択のどちらにも対応できる。
export const previewFilters = {
  roomType: ['normal'],
  smoking: ['nonSmoking'],
  machine: ['dam'],
  features: ['aiScoring'],
  capacity: ['1-2'],
}
