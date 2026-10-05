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
      </div>
    </main>
  )
}

export default MyPage
