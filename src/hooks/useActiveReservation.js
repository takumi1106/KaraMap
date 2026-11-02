import { useCallback, useEffect, useState } from 'react'
import { readCurrentReservation, historyStorageKey } from '../services/reservation-history/reservationHistory.js'

function loadCurrent() {
  try { return { reservation: readCurrentReservation(), error: '' } }
  catch { return { reservation: null, error: '予約情報を読み込めませんでした。ブラウザの保存設定をご確認ください。' } }
}

export default function useActiveReservation() {
  const [state, setState] = useState(loadCurrent)
  const refresh = useCallback(() => setState(loadCurrent()), [])
  useEffect(() => {
    const changed = (event) => {
      if (event.key === historyStorageKey || event.key === null) refresh()
    }
    const timer = setInterval(refresh, 1000)
    window.addEventListener('storage', changed)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('storage', changed)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [refresh])
  return { ...state, refresh }
}
