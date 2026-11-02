import { useState } from 'react'
import useActiveReservation from '../../hooks/useActiveReservation.js'
import { cancelDemoReservation, withReservationLock } from '../../services/reservation-history/reservationHistory.js'
import { assetUrl, pageUrl } from '../../utils/paths.js'
import Button from '../../components/Button.jsx'
import './mypage.scss'

const previewUser = { name: '田中太郎', username: 'tanakataro', avatar: null }
const menuItems = [
  { id: 'account', label: '会員情報確認・変更', href: '/account-info' },
  { id: 'reservations', label: '予約履歴', href: '/reservation-history' },
]

function returnHome() {
  window.location.assign(pageUrl('/'))
}

function MyPage({ user = previewUser, onBack = returnHome, onMenuSelect }) {
  const active = useActiveReservation()
  const [notice, setNotice] = useState('')
  const [cancelling, setCancelling] = useState(false)
  async function cancelReservation() {
    const reservation = active.reservation
    if (!reservation || !window.confirm(`${reservation.storeName}の予約を取り消しますか？\nデモ上の操作です。店舗へのキャンセル連絡は行いません。`)) return
    setCancelling(true)
    try {
      const cancelled = await withReservationLock(() => cancelDemoReservation(reservation.id))
      setNotice(cancelled ? 'デモ予約を取り消しました。新しい予約ができます。' : 'この予約はすでに終了または取り消されています。')
    } catch {
      setNotice('取り消しを保存できませんでした。もう一度お試しください。')
    } finally {
      setCancelling(false)
      active.refresh()
    }
  }
  function selectMenu(item) {
    if (onMenuSelect) {
      onMenuSelect(item.id)
    } else if (item.href) {
      window.location.assign(pageUrl(item.href))
    }
  }

  return (
    <main className="mypage">
      <header className="mypage__header">
        <Button className="mypage__back" onClick={onBack} aria-label="ホームに戻る">
          <svg className="mypage__back-icon" aria-hidden="true"><use href={assetUrl('/images/icons.svg#chevron')} /></svg>
        </Button>
        <h1 className="mypage__title">マイページ</h1>
      </header>
      <div className="mypage__content">
        <div className="mypage__profile">
          <span className="mypage__avatar">
            {user.avatar ? (
              <img className="mypage__avatar-image" src={assetUrl(user.avatar)} alt="" width="64" height="64" />
            ) : (
              <svg className="mypage__avatar-image" aria-hidden="true"><use href={assetUrl('/images/icon-profile.svg#profile')} /></svg>
            )}
          </span>
          <span className="mypage__identity">
            <span className="mypage__name">{user.name}</span>
            <span className="mypage__id">ID : {user.username}</span>
          </span>
        </div>
        <ul className="mypage__menu" aria-label="アカウントメニュー">
          {menuItems.map((item) => (
            <li className="mypage__menu-item" key={item.id}>
              <Button className="mypage__menu-button" onClick={() => selectMenu(item)} aria-disabled={!onMenuSelect && !item.href}>
                <span>{item.label}</span>
                <svg className="mypage__menu-arrow" aria-hidden="true"><use href={assetUrl('/images/icons.svg#chevron')} /></svg>
              </Button>
            </li>
          ))}
        </ul>
        <section className="mypage__reservation" aria-labelledby="current-reservation-heading">
          <h2 id="current-reservation-heading">現在の予約</h2>
          <p className="mypage__reservation-note">同じブラウザ内で1件までのデモ予約です。アカウント単位の制限ではありません。予約送信・空室確保・取消時の店舗への連絡は行いません。</p>
          {active.error ? <p role="alert">{active.error}</p> : active.reservation ? <>
            <h3>{active.reservation.storeName}</h3>
            <dl className="mypage__reservation-info">
              <div><dt>部屋</dt><dd>{active.reservation.roomNumber ? `${active.reservation.roomNumber}号室` : active.reservation.roomName}</dd></div>
              <div><dt>開始時刻</dt><dd>{active.reservation.time}</dd></div>
              <div><dt>利用時間</dt><dd>{active.reservation.durationHours}時間</dd></div>
              <div><dt>人数</dt><dd>{active.reservation.partySize}名</dd></div>
            </dl>
            <Button className="mypage__cancel-button" disabled={cancelling} onClick={cancelReservation}>{cancelling ? '取り消し中…' : '予約を取り消す'}</Button>
          </> : <p>現在予約中の店舗はありません。</p>}
          {notice && <p role="status">{notice}</p>}
        </section>
      </div>
    </main>
  )
}

export default MyPage
