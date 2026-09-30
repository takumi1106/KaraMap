import { assetUrl, pageUrl } from '../utils/paths.js'
import Tag from './Tag'
import './StoreCard.scss'

const getTagVariant = (label) => {
  const normalizedLabel = label.toLowerCase()

  if (normalizedLabel.includes('dam')) return 'dam'
  if (normalizedLabel.includes('joysound')) return 'joysound'
  if (normalizedLabel.includes('空室') || normalizedLabel.includes('空き')) {
    return 'vacant'
  }
  if (normalizedLabel.includes('営業中')) return 'success'

  return 'secondary'
}

function StoreCard({
  href = '#',
  image,
  imageAlt,
  name,
  distance,
  status = '営業中',
  tags = [],
  className = '',
  ...props
}) {
  const classNames = ['store-card', className].filter(Boolean).join(' ')
  const storeTags = [status, ...tags]

  return (
    <a className={classNames} href={pageUrl(href)} {...props}>
      {image && (
        <img
          className="store-card__image"
          src={assetUrl(image)}
          alt={imageAlt ?? name ?? ''}
          loading="lazy"
        />
      )}

      <span className="store-card__content">
        <span className="store-card__name">{name}</span>

        {distance && <span className="store-card__distance">{distance}</span>}

        <span className="store-card__tags" aria-label="店舗のステータスと機種">
          {storeTags.map((tag) => {
            const label = typeof tag === 'string' ? tag : tag.label
            const variant =
              typeof tag === 'string'
                ? getTagVariant(tag)
                : tag.variant ?? getTagVariant(label)

            return (
              <Tag
                key={label}
                className="store-card__tag"
                variant={variant}
              >
                {label}
              </Tag>
            )
          })}
        </span>
      </span>
    </a>
  )
}

export default StoreCard
