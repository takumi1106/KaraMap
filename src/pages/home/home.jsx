import { homeActions, sampleShops } from './homeData.js'
import './home.scss'

function Home({ areaLabel = '名古屋市中村区付近', shops = sampleShops }) {
  return (
    <main className="home">
      <header className="home__hero">
        <img className="home__hero-image" src="/images/hero-karaoke.webp" alt="" width="1200" height="675" fetchPriority="high" />
        <h1 className="home__logo" aria-label="カラMAP">
          <svg className="home__logo-icon" aria-hidden="true"><use href="/images/icons.svg#microphone" /></svg>
          <span className="home__logo-kana">カラ</span>
          <span className="home__logo-latin">Map</span>
          <svg className="home__logo-icon home__logo-icon--music" aria-hidden="true"><use href="/images/icons.svg#music" /></svg>
        </h1>
      </header>

      <div className="home__content">
        <a className="home__location" href="/search?mode=location">
          <svg className="home__location-icon" aria-hidden="true"><use href="/images/icons.svg#pin" /></svg>
          <span className="home__location-copy">
            <span className="home__location-title">現在地から探す</span>
            <span className="home__location-area">{areaLabel}</span>
          </span>
          <svg className="home__location-arrow" aria-hidden="true"><use href="/images/icons.svg#chevron" /></svg>
        </a>

        <nav className="home__actions" aria-label="カラオケ店を探す">
          {homeActions.map((action) => (
            <a className={`home__action home__action--${action.id}`} key={action.id} href={action.href}>
              <svg className="home__action-icon" aria-hidden="true"><use href={`/images/icons.svg#${action.icon}`} /></svg>
              <span>{action.label}</span>
            </a>
          ))}
        </nav>

        <section className="home__popular" aria-labelledby="popular-heading">
          <div className="home__section-heading">
            <h2 className="home__section-title" id="popular-heading">近くの人気店舗</h2>
            <a className="home__more" href="/search?sort=popular">
              もっと見る
              <svg className="home__more-icon" aria-hidden="true"><use href="/images/icons.svg#chevron" /></svg>
            </a>
          </div>
          <ul className="home__shops" aria-label="近くの人気店舗一覧">
            {shops.map((shop) => (
              <li className="home__shop" key={shop.id}>
                <a className="home__shop-link" href={`/shops/${shop.id}`}>
                  <img className="home__shop-image" src={shop.image} alt="" width="600" height="240" loading="lazy" />
                  <div className="home__shop-caption">
                    <svg className="home__shop-icon" aria-hidden="true"><use href="/images/icons.svg#pin" /></svg>
                    <span className="home__shop-name">{shop.name}</span>
                    {shop.availability && <span className="home__shop-status">{shop.availability}</span>}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}

export default Home
