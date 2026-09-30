import Button from '../../components/Button.jsx'
import ProfileSummary from '../../components/ProfileSummary.jsx'
import './mypage.scss'

const previewUser = { name: '田中太郎', username: 'tanakataro', avatar: null }
const menuItems = [
  { id: 'account', label: '会員情報確認・変更' },
  { id: 'reservations', label: '予約履歴' },
]

function returnHome() {
  window.location.assign('/')
}

function openAccountInfo() {
  window.location.assign('/account-info')
}

function openReservationHistory() {
  window.location.assign('/reservation-history')
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
        <ProfileSummary
          className="mypage__profile"
          name={user.name}
          username={user.username}
          avatar={user.avatar}
          onClick={onProfile ? () => onProfile(user) : undefined}
        />
        <ul className="mypage__menu" aria-label="アカウントメニュー">
          {menuItems.map((item) => (
            <li className="mypage__menu-item" key={item.id}>
              <Button
                className="mypage__menu-button"
                onClick={() => {
                  if (onMenuSelect) {
                    onMenuSelect(item.id)
                  } else if (item.id === 'account') {
                    openAccountInfo()
                  } else if (item.id === 'reservations') {
                    openReservationHistory()
                  }
                }}
              >
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
