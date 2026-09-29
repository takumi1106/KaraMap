import BottomNavigation from './components/BottomNavigation'
import Home from './pages/home/home.jsx'
import SearchResults from './pages/search-results/search-results.jsx'
import SearchFilter from './pages/search-filter/search-filter.jsx'
import ShopDetail from './pages/shop-detail/shop-detail.jsx'
import MyPage from './pages/mypage/mypage.jsx'

const pages = {
  '/mypage': { component: MyPage, activeItem: 'mypage' },
  '/': { component: Home, activeItem: 'home' },
  '/search': { component: SearchResults, activeItem: 'search' },
  '/search-filter': { component: SearchFilter, activeItem: 'search' },
  '/shop-detail': { component: ShopDetail, activeItem: 'search' },
}

function App() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'
  const route = pathname.startsWith('/shops/') ? '/shop-detail' : pathname
  const { component: Page, activeItem } = pages[route] ?? pages['/']
  const isMapView = route === '/search' && new URLSearchParams(window.location.search).get('view') === 'map'

  return (
    <>
      <Page />
      <BottomNavigation activeItem={isMapView ? 'map' : activeItem} />
    </>
  )
}

export default App
