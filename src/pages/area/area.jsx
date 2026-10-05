import { useState } from 'react'
import Button from '../../components/Button.jsx'
import StoreCard from '../../components/StoreCard.jsx'
import { assetUrl } from '../../utils/paths.js'
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

function getSampleStores(prefecture) {
  const name = prefecture.replace(/[都道府県]$/, '')
  return ['駅前店', '中央店', '南店'].map((suffix, index) => ({
    id: `${prefecture}-${index}`,
    name: `カラオケ ${name}${suffix}`,
    distance: index === 0 ? '徒歩3分 (200m)' : `徒歩${index * 2 + 3}分 (${200 + index * 150}m)`,
  }))
}

function Area({ onBack }) {
  const [expandedArea, setExpandedArea] = useState(null)
  const [selectedPrefecture, setSelectedPrefecture] = useState(null)

  function handleBack() {
    if (selectedPrefecture) {
      setSelectedPrefecture(null)
      return
    }
    onBack?.()
  }

  return (
    <main className="area-page">
      <header className="area-page__header">
        <Button className="area-page__back" onClick={handleBack} aria-label="戻る">
          <svg className="area-page__back-icon" aria-hidden="true"><use href={assetUrl('/images/icons.svg#chevron')} /></svg>
        </Button>
        <h1 className="area-page__title">{selectedPrefecture ? `${selectedPrefecture}の店舗` : 'エリア検索'}</h1>
      </header>

      {selectedPrefecture ? (
        <section className="area-page__results" aria-label={`${selectedPrefecture}の店舗一覧`}>
          <p className="area-page__count">全3件 <span>（サンプル店舗）</span></p>
          <ul className="area-page__store-list">
            {getSampleStores(selectedPrefecture).map((store) => (
              <li key={store.id}>
                <StoreCard
                  href="/search"
                  image="/images/shop-karaoke.webp"
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
      ) : (
        <nav className="area-page__area-list" aria-label="エリアを選択">
          {areas.map((area) => {
            const isOpen = expandedArea === area.id
            return (
              <div className="area-page__group" key={area.id}>
                <Button
                  className="area-page__area"
                  aria-expanded={isOpen}
                  aria-controls={`area-content-${area.id}`}
                  onClick={() => setExpandedArea(isOpen ? null : area.id)}
                >
                  <span>{area.label}</span>
                  <span className="area-page__toggle" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </Button>
                {isOpen && (
                  <div className="area-page__prefectures" id={`area-content-${area.id}`}>
                    {area.prefectures.map((prefecture) => (
                      <button
                        className="area-page__prefecture"
                        key={prefecture}
                        type="button"
                        onClick={() => setSelectedPrefecture(prefecture)}
                      >
                        <span>{prefecture}</span>
                        <svg className="area-page__next-icon" aria-hidden="true"><use href={assetUrl('/images/icons.svg#chevron')} /></svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      )}
    </main>
  )
}

export default Area
