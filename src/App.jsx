import Home from './pages/home/home.jsx'
import SearchResults from './pages/search-results/search-results.jsx'
import SearchFilter from './pages/search-filter/search-filter.jsx'
import ShopDetail from './pages/shop-detail/shop-detail.jsx'

function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/shop-detail') {
    return <ShopDetail />
  }

  if (window.location.pathname.replace(/\/$/, '') === '/search-filter') {
    return <SearchFilter />
  }

  if (window.location.pathname.replace(/\/$/, '') === '/search') {
    return <SearchResults />
  }

  return <Home />
}

export default App
