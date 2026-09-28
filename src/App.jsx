import StoreCard from './components/StoreCard'
import BottomNavigation from './components/BottomNavigation'
import './App.css'

function App() {
  return (
    <main className="app-preview">
      <section className="app-preview__content" aria-labelledby="store-list-title">
        <h1 className="app-preview__title" id="store-list-title">
          検索結果
        </h1>
        <p className="app-preview__count">近くの店舗 12件</p>

        <StoreCard
          href="/stores/jankara-meieki"
          name="ジャンカラ 名駅東口店"
          distance="徒歩3分（200m）"
          status="営業中"
          tags={['空室あり（残り5部屋）', 'DAM', 'JOYSOUND']}
        />
      </section>
      <BottomNavigation activeItem="search" />
    </main>
  )
}

export default App
