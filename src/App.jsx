import BottomNavigation from './components/BottomNavigation'
import Home from './pages/home/home.jsx'

function App() {
  return (
    <>
      <Home />
      <BottomNavigation activeItem="home" />
    </>
  )
}

export default App
