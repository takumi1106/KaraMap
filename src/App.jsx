import BottomNavigation from './components/BottomNavigation'
import Home from './pages/home/home.jsx'
import SearchResults from './pages/search-results/search-results.jsx'
import SearchFilter from './pages/search-filter/search-filter.jsx'
import ShopDetail from './pages/shop-detail/shop-detail.jsx'
import MyPage from './pages/mypage/mypage.jsx'
import CurrentLocation from './pages/current-location/current-location.jsx'
import AccountInfo from './pages/account-info/account-info.jsx'
import ReservationHistory from './pages/reservation-history/reservation-history.jsx'

const pages = {
  '/reservation-history': { component: ReservationHistory, activeItem: 'mypage' },
  '/account-info': { component: AccountInfo, activeItem: 'mypage' },
  '/current-location': { component: CurrentLocation, activeItem: 'map' },
  '/mypage': { component: MyPage, activeItem: 'mypage' },
  '/': { component: Home, activeItem: 'home' },
  '/search': { component: SearchResults, activeItem: 'search' },
  '/search-filter': { component: SearchFilter, activeItem: 'search' },
  '/shop-detail': { component: ShopDetail, activeItem: 'search' },
}

function App() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'
  const isMapView = pathname === '/search' && new URLSearchParams(window.location.search).get('view') === 'map'
  const route = isMapView ? '/current-location' : pathname.startsWith('/shops/') ? '/shop-detail' : pathname
  const { component: Page, activeItem } = pages[route] ?? pages['/']

  return (
    <>
      <Page />
      <BottomNavigation activeItem={activeItem} />
    </>
  )
}

export default App
