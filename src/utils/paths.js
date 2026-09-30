// Vite の公開先を付ける。外部 URL と変換済みのパスはそのまま使う。
export function assetUrl(path) {
  if (!path?.startsWith('/') || path.startsWith('//')) return path
  const base = import.meta.env.BASE_URL
  return path.startsWith(base) ? path : `${base}${path.slice(1)}`
}

// 静的ホスティングでも再読み込みできる画面 URL。
export function pageUrl(path) {
  if (!path?.startsWith('/') || path.startsWith('//')) return path
  const base = import.meta.env.BASE_URL
  if (path.startsWith(`${base}#`)) return path
  return `${base}#${path}`
}

export function getPageLocation() {
  const { hash, pathname, search } = window.location
  if (hash.startsWith('#/')) return new URL(hash.slice(1), window.location.origin)
  const base = import.meta.env.BASE_URL
  const path = pathname.startsWith(base) ? `/${pathname.slice(base.length)}` : pathname
  return new URL(`${path}${search}`, window.location.origin)
}
