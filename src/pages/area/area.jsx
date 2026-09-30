import { useState } from 'react'
import Button from '../../components/Button.jsx'
import StoreCard from '../../components/StoreCard.jsx'
import './area.scss'

const areas = [
  { id: 'hokkaido', label: '北海道エリア', prefectures: ['北海道'] },
  { id: 'tohoku', label: '東北エリア', prefectures: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
  { id: 'kanto', label: '関東エリア', prefectures: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
  { id: 'chubu', label: '中部エリア', prefectures: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'] },
  { id: 'kansai', label: '近畿エリア', prefectures: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
  { id: 'chugoku', label: '中国エリア', prefectures: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
  { id: 'shikoku', label: '四国エリア', prefectures: ['徳島県', '香川県', '愛媛県', '高知県'] },
  { id: 'kyushu', label: '九州エリア', prefectures: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'] },
  { id: 'okinawa', label: '沖縄エリア', prefectures: ['沖縄県'] },
]

const hokkaidoStores = [
  { id: 'hokkaido-sapporo-station', name: 'カラオケ札幌駅前店（サンプル）', image: '/images/shop-karaoke.webp', distance: '札幌駅周辺' },
  { id: 'hokkaido-susukino', name: 'カラオケすすきの店（サンプル）', image: '/images/shop-karaoke.webp', distance: 'すすきの駅周辺' },
  { id: 'hokkaido-asahikawa', name: 'カラオケ旭川駅前店（サンプル）', image: '/images/shop-karaoke.webp', distance: '旭川駅周辺' },
]

function returnToSearch() {
  window.location.assign('/search')
}

function AccordionIcon({ isOpen }) {
  return (
    <span
      className="area-page__next-icon"
      aria-hidden="true"
      style={{ display: 'grid', placeItems: 'center', fontSize: '1.4rem', lineHeight: 1 }}
    >
      {isOpen ? '−' : '+'}
    </span>
  )
}

function getStoresForPrefecture(prefecture) {
  if (prefecture === '北海道') return hokkaidoStores

  const cityName = prefecture.replace(/[都道府県]$/, '')

  return [
    { id: `${cityName}-station`, name: `カラオケ${cityName}駅前店（サンプル）`, image: '/images/shop-karaoke.webp', distance: `${cityName}駅周辺` },
    { id: `${cityName}-central`, name: `カラオケ${cityName}中央店（サンプル）`, image: '/images/shop-karaoke.webp', distance: `${cityName}中心部` },
    { id: `${cityName}-south`, name: `カラオケ${cityName}南店（サンプル）`, image: '/images/shop-karaoke.webp', distance: `${cityName}南部` },
  ]
}

function Area({ onBack = returnToSearch, onAreaSelect }) {
  const [expandedArea, setExpandedArea] = useState(null)
  const isResultsPage = window.location.pathname.endsWith('/results')
  const selectedPrefecture = new URLSearchParams(window.location.search).get('prefecture')

  function handleBack() {
    if (expandedArea) {
      setExpandedArea(null)
      return
    }

    onBack()
  }

  function toggleArea(area) {
    setExpandedArea((currentArea) => currentArea === area.id ? null : area.id)
    onAreaSelect?.(area.id)
  }

  if (isResultsPage && selectedPrefecture) {
    const stores = getStoresForPrefecture(selectedPrefecture)

    return (
      <div className="area-page">
        <main className="area-page__main">
          <header className="area-page__header">
            <Button className="area-page__back" onClick={handleBack} aria-label="エリア一覧に戻る">
              <svg className="area-page__back-icon" aria-hidden="true">
                <use href="/images/icons.svg#chevron" />
              </svg>
            </Button>
            <h1 className="area-page__title">{selectedPrefecture}の店舗</h1>
          </header>

          <section className="area-page__results" aria-label={`${selectedPrefecture}の店舗一覧`}>
            <p style={{ margin: '0 1.25rem 1rem', fontSize: '1.25rem' }}>全{stores.length}件</p>
            <p style={{ margin: '0 1.25rem 1rem' }}>店舗名や写真は表示確認用のサンプルです。</p>
            <ul
              style={{
                display: 'grid',
                gap: '1rem',
                margin: '0 1.25rem',
                padding: 0,
                listStyle: 'none',
              }}
            >
              {stores.map((store) => (
                <li key={store.id}>
                  <StoreCard
                    href="/shops/sample-shop"
                    image={store.image}
                    imageAlt="店舗写真のサンプル"
                    name={store.name}
                    distance={store.distance}
                    status="営業状況未確認"
                    tags={[{ label: '空室状況未確認', variant: 'secondary' }]}
                  />
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="area-page">
      <main className="area-page__main">
        <header className="area-page__header">
          <Button className="area-page__back" onClick={handleBack} aria-label="前の一覧に戻る">
            <svg className="area-page__back-icon" aria-hidden="true">
              <use href="/images/icons.svg#chevron" />
            </svg>
          </Button>
          <h1 className="area-page__title">エリア検索</h1>
        </header>

        <nav className="area-page__area-list" aria-label="エリアを選択">
          {areas.map((area) => {
            const isAreaOpen = expandedArea === area.id

            return (
              <div key={area.id}>
                <Button
                  className="area-page__area"
                  aria-expanded={isAreaOpen}
                  aria-controls={`area-content-${area.id}`}
                  onClick={() => toggleArea(area)}
                >
                  <span className="area-page__area-label">{area.label}</span>
                  <AccordionIcon isOpen={isAreaOpen} />
                </Button>

                {isAreaOpen && (
                  <div id={`area-content-${area.id}`} aria-label={`${area.label}の都道府県`}>
                    {area.prefectures.map((prefecture) => (
                      <a
                        className="area-page__area button"
                        key={`${area.id}-${prefecture}`}
                        href={`/area/results?prefecture=${encodeURIComponent(prefecture)}`}
                        style={{ paddingLeft: '2rem', textDecoration: 'none' }}
                      >
                        <span className="area-page__area-label">{prefecture}</span>
                        <svg className="area-page__next-icon" aria-hidden="true">
                          <use href="/images/icons.svg#chevron" />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </main>
    </div>
  )
}

export default Area
