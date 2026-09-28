import './BottomNavigation.scss'

const defaultItems = [
  { id: 'home', label: 'ホーム', href: '/', icon: 'home' },
  { id: 'search', label: '検索', href: '/search', icon: 'search' },
  { id: 'favorites', label: 'お気に入り', href: '/favorites', icon: 'favorites' },
  { id: 'mypage', label: 'マイページ', href: '/mypage', icon: 'mypage' },
]

function renderIcon(icon) {
  if (icon === 'home') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />
        <path d="M1.5 10.5 12 2l10.5 8.5" />
      </svg>
    )
  }

  if (icon === 'search') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="7.3" />
        <path d="m16.2 16.2 5 5" />
      </svg>
    )
  }

  if (icon === 'favorites') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

function BottomNavigation({ activeItem = 'home', items = defaultItems }) {
  return (
    <nav className="bottom-navigation" aria-label="メインナビゲーション">
      <ul className="bottom-navigation__list">
        {items.map((item) => {
          const isActive = item.id === activeItem
          const linkClassNames = [
            'bottom-navigation__link',
            isActive ? 'bottom-navigation__link--active' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li className="bottom-navigation__item" key={item.id}>
              <a
                className={linkClassNames}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="bottom-navigation__icon">
                  {renderIcon(item.icon)}
                </span>
                <span className="bottom-navigation__label">{item.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default BottomNavigation
