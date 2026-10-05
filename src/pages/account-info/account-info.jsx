import { assetUrl, pageUrl } from '../../utils/paths.js'
import { useState } from 'react'
import Button from '../../components/Button.jsx'
import ProfileSummary from '../../components/ProfileSummary.jsx'
import SettingsListItem from '../../components/SettingsListItem.jsx'
import './account-info.scss'

const previewUser = {
  name: '田中太郎',
  username: 'tanakataro',
  email: 'tanaka@icloud.com',
  phone: '052-310-1415',
  avatar: null,
}

const accountItems = [
  { id: 'name', label: '名前', type: 'text', autoComplete: 'name' },
  { id: 'username', label: 'ID', type: 'text', autoComplete: 'username' },
  { id: 'email', label: 'メールアドレス', type: 'email', autoComplete: 'email' },
  { id: 'phone', label: '電話番号', type: 'tel', autoComplete: 'tel' },
]

function returnToMyPage() {
  window.location.assign(pageUrl('/mypage'))
}

function AccountInfo({ user = previewUser, onBack = returnToMyPage, onItemSelect }) {
  const [profile, setProfile] = useState(() => ({ ...previewUser, ...user }))
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const editingItem = accountItems.find((item) => item.id === editingItemId)

  function startEditing(item) {
    onItemSelect?.(item.id)
    setEditingItemId(item.id)
    setEditingValue(profile[item.id] ?? '')
  }

  function returnToList() {
    if (editingItemId) {
      setEditingItemId(null)
      setEditingValue('')
      return
    }

    onBack()
  }

  function saveValue(event) {
    event.preventDefault()
    setProfile((currentProfile) => ({ ...currentProfile, [editingItemId]: editingValue.trim() }))
    setEditingItemId(null)
    setEditingValue('')
  }

  return (
    <main className="account-info">
      <header className="account-info__header">
        <Button className="account-info__back" onClick={returnToList} aria-label={editingItem ? '会員情報一覧に戻る' : 'マイページに戻る'}>
          <svg className="account-info__back-icon" aria-hidden="true">
            <use href={assetUrl('/images/icons.svg#chevron')} />
          </svg>
        </Button>
        <h1 className="account-info__title">{editingItem ? `${editingItem.label}を変更` : '会員情報確認・変更'}</h1>
      </header>

      <div className="account-info__content">
        {editingItem ? (
          <form className="account-info__edit-form" onSubmit={saveValue}>
            <label className="account-info__edit-label" htmlFor="account-info-value">
              {editingItem.label}
            </label>
            <input
              autoComplete={editingItem.autoComplete}
              className="account-info__edit-input"
              id="account-info-value"
              name={editingItem.id}
              required
              type={editingItem.type}
              value={editingValue}
              onChange={(event) => setEditingValue(event.target.value)}
            />
            <div className="account-info__edit-actions">
              <Button variant="secondary" onClick={returnToList}>キャンセル</Button>
              <Button type="submit">変更を保存</Button>
            </div>
          </form>
        ) : (
          <>
            <ProfileSummary
              className="account-info__profile"
              name={profile.name}
              username={profile.username}
              avatar={profile.avatar}
            />

            <ul className="account-info__list" aria-label="会員情報">
              {accountItems.map((item, index) => (
                <li className="account-info__list-item" key={item.id}>
                  <SettingsListItem
                    label={item.label}
                    value={profile[item.id]}
                    isLast={index === accountItems.length - 1}
                    onClick={() => startEditing(item)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  )
}

export default AccountInfo
