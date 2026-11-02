import { useState } from 'react'
import { getPageLocation, pageUrl } from '../utils/paths.js'

export default function useSearchOrigin() {
  const [mode, setMode] = useState(() => {
    const requested = getPageLocation().searchParams.get('origin')
    if (requested === 'demo' || requested === 'current') return requested
    try { return sessionStorage.getItem('karamap-search-origin') === 'demo' ? 'demo' : 'current' } catch { return 'current' }
  })
  function changeMode(value) {
    const next = value === 'demo' ? 'demo' : 'current'
    try { sessionStorage.setItem('karamap-search-origin', next) } catch { /* URLでも保持する */ }
    const page = getPageLocation()
    page.searchParams.set('origin', next)
    window.history.replaceState(null, '', pageUrl(`${page.pathname}${page.search}`))
    setMode(next)
  }
  return [mode, changeMode]
}
