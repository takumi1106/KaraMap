import { useEffect, useRef, useState } from 'react'

const errorMessages = {
  1: '位置情報が許可されていません。ブラウザのサイト設定で許可してから、もう一度お試しください。',
  2: '現在地を取得できませんでした。端末の位置情報設定や通信状況を確認してください。',
  3: '現在地の取得がタイムアウトしました。場所を変えて、もう一度お試しください。',
}

export default function useCurrentLocation() {
  const [state, setState] = useState({ status: 'idle', location: null, error: '' })
  const requestId = useRef(0)

  useEffect(() => () => { requestId.current += 1 }, [])

  function requestLocation() {
    const id = ++requestId.current
    if (!window.isSecureContext || !navigator.geolocation) {
      setState({ status: 'error', location: null, error: !window.isSecureContext
        ? '位置情報の取得にはHTTPS接続が必要です。'
        : 'このブラウザは位置情報の取得に対応していません。' })
      return
    }

    setState({ status: 'loading', location: null, error: '' })
    const fail = (error) => {
      if (id !== requestId.current) return
      setState({ status: 'error', location: null, error: errorMessages[error.code] ?? '位置情報を取得できませんでした。もう一度お試しください。' })
    }

    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords, timestamp }) => {
          if (id !== requestId.current) return
          setState({ status: 'success', error: '', location: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            timestamp,
          } })
        },
        fail,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      )
    } catch (error) {
      fail(error)
    }
  }

  return { ...state, requestLocation }
}
