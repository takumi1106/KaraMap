import { useEffect, useState } from 'react'
import { getPageLocation } from './utils/paths.js'
import BottomNavigation from './components/BottomNavigation'
import Home from './pages/home/home.jsx'
import SearchResults from './pages/search-results/search-results.jsx'
import SearchFilter from './pages/search-filter/search-filter.jsx'
import ShopDetail from './pages/shop-detail/shop-detail.jsx'
import MyPage from './pages/mypage/mypage.jsx'
import CurrentLocation from './pages/current-location/current-location.jsx'
import AccountInfo from './pages/account-info/account-info.jsx'

const pages = {
  '/account-info': { component: AccountInfo, activeItem: 'mypage' },
  '/current-location': { component: CurrentLocation, activeItem: 'map' },
  '/mypage': { component: MyPage, activeItem: 'mypage' },
  '/': { component: Home, activeItem: 'home' },
  '/search': { component: SearchResults, activeItem: 'search' },
  '/search-filter': { component: SearchFilter, activeItem: 'search' },
  '/shop-detail': { component: ShopDetail, activeItem: 'search' },
}

function App() {
  const [location, setLocation] = useState(getPageLocation)

  useEffect(() => {
    function updateLocation() {
      setLocation(getPageLocation())
    }
    window.addEventListener('hashchange', updateLocation)
    return () => window.removeEventListener('hashchange', updateLocation)
  }, [])

  const pathname = location.pathname.replace(/\/$/, '') || '/'
  const isMapView = pathname === '/search' && location.searchParams.get('view') === 'map'
  const route = isMapView ? '/current-location' : pathname.startsWith('/shops/') ? '/shop-detail' : pathname
  const { component: Page, activeItem } = pages[route] ?? pages['/']

  return (
    <>
      <Page key={`${pathname}${location.search}`} />
      <BottomNavigation activeItem={activeItem} />
    </>
  )
}

export default App
