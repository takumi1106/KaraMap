import { useEffect, useState } from 'react'
import { parseSavedShops } from '../services/saved-shops/savedShops.js'
import { savedShopDetail } from '../services/search-flow/searchFlow.js'

export default function useSavedShop(id) {
  const [state, setState] = useState({ id: null, status: 'idle', shop: null })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/karaoke-shops.json`, { signal: controller.signal })
        if (!response.ok) throw new Error('保存済み店舗データを読み込めませんでした。')
        const shop = savedShopDetail(parseSavedShops(await response.json()), id)
        if (!controller.signal.aborted) setState({ id, status: 'success', shop })
      } catch {
        if (!controller.signal.aborted) setState({ id, status: 'error', shop: null })
      }
    }
    load()
    return () => controller.abort()
  }, [id, attempt])
  return { ...(state.id === id ? state : { status: 'loading', shop: null }), retry: () => setAttempt((value) => value + 1) }
}
