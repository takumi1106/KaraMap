import { assetUrl, pageUrl } from '../utils/paths.js'
import './ProfileSummary.scss'

function ProfileSummary({
  name,
  username,
  avatar,
  href,
  onClick,
  className = '',
}) {
  const classNames = ['profile-summary', className].filter(Boolean).join(' ')
  const content = (
    <>
      <span className="profile-summary__avatar">
        {avatar ? (
          <img className="profile-summary__avatar-image" src={assetUrl(avatar)} alt="" width="64" height="64" />
        ) : (
          <svg className="profile-summary__avatar-image" aria-hidden="true">
            <use href={assetUrl('/images/icon-profile.svg#profile')} />
          </svg>
        )}
      </span>
      <span className="profile-summary__identity">
        <span className="profile-summary__name">{name}</span>
        <span className="profile-summary__id">ID : {username}</span>
      </span>
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

export default ProfileSummary
