import Button from '../../components/Button.jsx'
import './mypage.scss'

const previewUser = { name: '田中太郎', username: 'tanakataro', avatar: null }
const menuItems = [
  { id: 'account', label: '会員情報確認・変更' },
  { id: 'reservations', label: '予約履歴' },
]

function returnHome() {
  window.location.assign('/')
}

function MyPage({ user = previewUser, onBack = returnHome, onProfile, onMenuSelect }) {
  return (
    <main className="mypage">
      <header className="mypage__header">
        <Button className="mypage__back" onClick={onBack} aria-label="ホームに戻る">
          <svg className="mypage__back-icon" aria-hidden="true"><use href="/images/icons.svg#chevron" /></svg>
        </Button>
        <h1 className="mypage__title">マイページ</h1>
      </header>
      <div className="mypage__content">
        <Button className="mypage__profile" onClick={() => onProfile?.(user)} aria-disabled={!onProfile}>
          <span className="mypage__avatar">
            {user.avatar ? (
              <img className="mypage__avatar-image" src={user.avatar} alt="" width="64" height="64" />
            ) : (
              <svg className="mypage__avatar-image" aria-hidden="true"><use href="/images/icon-profile.svg#profile" /></svg>
            )}
          </span>
          <span className="mypage__identity">
            <span className="mypage__name">{user.name}</span>
            <span className="mypage__id">ID : {user.username}</span>
          </span>
          <svg className="mypage__profile-arrow" aria-hidden="true"><use href="/images/icons.svg#chevron" /></svg>
        </Button>
        <ul className="mypage__menu" aria-label="アカウントメニュー">
          {menuItems.map((item) => (
            <li className="mypage__menu-item" key={item.id}>
              <Button className="mypage__menu-button" onClick={() => onMenuSelect?.(item.id)} aria-disabled={!onMenuSelect}>
                <span>{item.label}</span>
                <svg className="mypage__menu-arrow" aria-hidden="true"><use href="/images/icons.svg#chevron" /></svg>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default MyPage
