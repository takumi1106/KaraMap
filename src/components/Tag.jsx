import './Tag.scss'

function Tag({
  children,
  variant = 'secondary',
  color,
  className = '',
  style,
  ...props
}) {
  const classNames = [
    'tag',
    `tag--${variant}`,
    color ? 'tag--custom-color' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={classNames}
      style={{ ...style, ...(color ? { '--tag-custom-color': color } : {}) }}
      {...props}
    >
      {children}
    </span>
  )
}

export default Tag
