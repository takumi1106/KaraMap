import { assetUrl, pageUrl } from '../utils/paths.js'
import './SettingsListItem.scss'

function SettingsListItem({
  label,
  value,
  href,
  onClick,
  isLast = false,
  className = '',
}) {
  const classNames = [
    'settings-list-item',
    isLast ? 'settings-list-item--last' : '',
    className,
  ].filter(Boolean).join(' ')
  const content = (
    <>
      <span className="settings-list-item__copy">
        <span className="settings-list-item__label">{label}</span>
        <span className="settings-list-item__value">{value}</span>
      </span>
      <svg className="settings-list-item__arrow" aria-hidden="true">
        <use href={assetUrl('/images/icons.svg#chevron')} />
      </svg>
    </>
  )

  if (href) {
    return <a className={classNames} href={pageUrl(href)}>{content}</a>
  }

  if (onClick) {
    return <button className={classNames} type="button" onClick={onClick}>{content}</button>
  }

  return <div className={classNames}>{content}</div>
}

export default SettingsListItem
