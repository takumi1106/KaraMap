import { test } from 'node:test'
import assert from 'node:assert/strict'
import { featureFilter } from '@maplibre/maplibre-gl-style-spec'
import { prepareMapStyle } from './mapViewStyle.js'

test('駐車場だけをPOIから除外し、駅・店舗・道路の条件を維持する', () => {
  const road = { id: 'roads', type: 'symbol', 'source-layer': 'transportation_name' }
  const original = { sources: {}, layers: [road, {
    id: 'poi', type: 'symbol', 'source-layer': 'poi', filter: ['<', ['get', 'rank'], 10],
  }] }
  const before = structuredClone(original)
  const result = prepareMapStyle(original)
  const filter = featureFilter(result.layers[1].filter, "layers[1].filter").filter
  const matches = (properties) => filter({ zoom: 16 }, { type: 1, properties })
  assert.equal(matches({ class: 'parking', rank: 1 }), false)
  assert.equal(matches({ class: 'transport', subclass: 'parking_entrance', rank: 1 }), false)
  assert.equal(matches({ class: 'rail', rank: 1 }), true)
  assert.equal(matches({ class: 'restaurant', rank: 1 }), true)
  assert.equal(matches({ class: 'restaurant', rank: 20 }), false)
  assert.equal(result.layers[0].id, road.id)
  assert.equal(result.layers[0]['source-layer'], road['source-layer'])
  assert.deepEqual(result.layers[0].filter, road.filter)
  assert.deepEqual(original, before)
})

test('駅名を補い、白系・黒系に対応する', () => {
  const style = { sources: { openmaptiles: {} }, layers: [] }
  for (const light of [false, true]) {
    const result = prepareMapStyle(style, light)
    const station = result.layers.find((layer) => layer.id === 'karamap-stations')
    const filter = featureFilter(station.filter, "layers[0].filter").filter
    assert.equal(filter({ zoom: 16 }, { type: 1, properties: { class: 'rail' } }), true)
    assert.equal(filter({ zoom: 16 }, { type: 1, properties: { class: 'parking' } }), false)
    assert.equal(prepareMapStyle(result, light).layers.length, 1)
  }
})
