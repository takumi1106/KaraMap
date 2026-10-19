// OpenMapTilesのPOI分類に対する表示フィルター。店舗検索には使用しない。
const parkingClasses = ['parking', 'parking_entrance', 'parking_space', 'bicycle_parking']

export function prepareMapStyle(style, isLight = false) {
  const layers = style.layers.map((layer) => {
    if (layer.type !== 'symbol' || layer['source-layer'] !== 'poi') return layer
    return {
      ...layer,
      filter: ['all', ...(layer.filter ? [layer.filter] : []),
        ['!', ['in', ['get', 'class'], ['literal', parkingClasses]]],
        ['!', ['in', ['get', 'subclass'], ['literal', parkingClasses]]],
      ],
    }
  })
  // 最小限の背景スタイルには駅名がないため、鉄道POIの名前だけを補う。
  if (style.sources.openmaptiles && !layers.some((layer) => layer.id === 'karamap-stations')) {
    layers.push({
      id: 'karamap-stations', type: 'symbol', source: 'openmaptiles', 'source-layer': 'poi', minzoom: 12,
      filter: ['==', ['get', 'class'], 'rail'],
      layout: {
        'text-field': ['coalesce', ['get', 'name:ja'], ['get', 'name'], ['get', 'name:latin']],
        'text-font': ['Noto Sans Regular'], 'text-size': 13, 'text-max-width': 10,
      },
      paint: {
        'text-color': isLight ? '#244767' : '#c4dff4',
        'text-halo-color': isLight ? '#ffffff' : '#071735', 'text-halo-width': 1.5,
      },
    })
  }

    if (!isLight) {
    const colors = {
      background: '#222C38',
      building: '#293b50',
      road: '#74879D',
      text: '#d7e2ee',
    }

    for (const layer of layers) {
      let changes = {}

      if (layer.type === 'background') {
        changes = { 'background-color': colors.background }
      } else if (
        layer.type === 'fill'
        && layer['source-layer'] === 'building'
      ) {
        changes = { 'fill-color': colors.building }
      } else if (
        layer.type === 'line'
        && layer['source-layer'] === 'transportation'
      ) {
        changes = { 'line-color': colors.road }
      } else if (layer.type === 'symbol' && layer.layout?.['text-field']) {
        changes = { 'text-color': colors.text }
      }

      // 元のスタイルを直接変更しないようにコピーする
      const index = layers.indexOf(layer)
      layers[index] = {
        ...layer,
        paint: { ...layer.paint, ...changes },
      }
    }
  }

  return { ...style, layers }
}
