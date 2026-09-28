// src/components/Button.jsx
import './Button.scss'

function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  ...props
}) {
  const classNames = ['button', `button--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classNames} {...props}>
      {children}
    </button>
  )
}

export default Button
