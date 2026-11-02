import { assetUrl, pageUrl, getPageLocation } from '../../utils/paths.js'
import { useState } from 'react'
import Button from '../../components/Button.jsx'
import { filterGroups } from './searchFilterData.js'
import { readRoomSearch, roomSearchParams } from '../../services/room-search/roomSearchPage.js'
import SearchOrigin from '../../components/SearchOrigin.jsx'
import useSearchOrigin from '../../hooks/useSearchOrigin.js'
import './search-filter.scss'

function returnToSearch(conditions) {
  const params = roomSearchParams(conditions)
  params.set('origin', conditions.origin)
  // ブラウザの「戻る」でも、検索直前の条件と起点を復元する。
  window.history.replaceState(null, '', pageUrl(`/search-filter?${params}`))
  window.location.assign(pageUrl(`/search?${params}`))
}

function returnHome() {
  window.location.assign(pageUrl('/'))
}

// 単独ではローカル状態を使用し、propsを渡すと親からも制御できる。
function SearchFilter({
  values,
  realtimeAvailable,
  onOptionSelect,
  onRealtimeChange,
  onSearch = returnToSearch,
  onBack = returnHome,
  bottomNavigation = null,
}) {
  const [origin, setOrigin] = useSearchOrigin()
  const [initialConditions] = useState(() => readRoomSearch(getPageLocation().searchParams))
  const [keyword, setKeyword] = useState(initialConditions.keyword)
  const [localValues, setLocalValues] = useState(initialConditions.values)
  const [localRealtime, setLocalRealtime] = useState(initialConditions.realtimeAvailable)
  const selectedValues = values ?? localValues
  const isRealtimeAvailable = realtimeAvailable ?? localRealtime

  function selectOption(group, value) {
    if (values == null) {
      setLocalValues((previous) => {
        const selected = previous[group.id] ?? []
        const next = group.multiple
          ? selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value]
          : selected.includes(value) ? [] : [value]

        return { ...previous, [group.id]: next }
      })
    }
    onOptionSelect?.(group.id, value)
  }

  function toggleRealtime() {
    if (realtimeAvailable == null) {
      setLocalRealtime((previous) => !previous)
    }
    onRealtimeChange?.(!isRealtimeAvailable)
  }

  function renderAvailability(position) {
    return (
      <div className={`search-filter__availability search-filter__availability--${position}`}>
        {position === 'top' && <span className="search-filter__check" aria-hidden="true" />}
        <div className="search-filter__availability-copy">
          <span className="search-filter__availability-title">リアルタイム空室</span>
          <span className="search-filter__availability-description">空室情報は未接続のため、ONでは該当なしになります</span>
        </div>
        <Button
          className={`search-filter__switch${isRealtimeAvailable ? ' search-filter__switch--on' : ''}`}
          role="switch"
          aria-checked={isRealtimeAvailable}
          aria-label="リアルタイム空室"
          aria-disabled={realtimeAvailable != null && !onRealtimeChange}
          onClick={toggleRealtime}
        >
          <span className="search-filter__switch-track" aria-hidden="true">
            <span className="search-filter__switch-thumb" />
          </span>
        </Button>
      </div>
    )
  }

  return (
    <div className="search-filter">
      <main className="search-filter__main">
        <header className="search-filter__header">
          <Button className="search-filter__back" onClick={onBack} aria-label="ホームに戻る">
            <svg className="search-filter__back-icon" aria-hidden="true"><use href={assetUrl('/images/icons.svg#chevron')} /></svg>
          </Button>
          <h1 className="search-filter__title">検索条件</h1>
        </header>
        <div className="search-filter__content">
          <SearchOrigin mode={origin} onChange={setOrigin} />
          <div className="search-filter__name-search">
            <label className="search-filter__name-label" htmlFor="shop-name-search">店舗名で検索</label>
            <input
              id="shop-name-search"
              className="search-filter__name-input"
              type="search"
              name="keyword"
              placeholder="例：ジャンカラ、ビッグエコー"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              aria-describedby="shop-name-help"
            />
            <p className="search-filter__name-help" id="shop-name-help">店舗名の一部で検索できます。未入力の場合は店舗名で絞り込みません。</p>
          </div>
          {renderAvailability('top')}
          <p>未選択の項目は指定なしです。選択中のボタンを再度押すと解除できます。</p>
          <p>現在はジャンカラ名駅東口店の2室を登録しています。確認例：DAM＋1〜2名（空室OFF・その他未指定）。</p>
          {initialConditions.error && <p role="alert">{initialConditions.error}</p>}
          <div className="search-filter__groups">
            {filterGroups.map((group) => (
              <fieldset className="search-filter__group" key={group.id}>
                <legend className="search-filter__legend">{group.label}</legend>
                <div className={`search-filter__options search-filter__options--${group.id === 'capacity' ? 'capacity' : 'standard'}`}>
                  {group.options.map((option) => {
                    const selected = selectedValues[group.id]?.includes(option.value) ?? false

                    return (
                      <Button
                        key={option.value}
                        className={`search-filter__option${selected ? ' search-filter__option--selected' : ''}`}
                        aria-pressed={selected}
                        aria-disabled={values != null && !onOptionSelect}
                        onClick={() => selectOption(group, option.value)}
                      >
                        <span>{option.label}</span>
                        {option.description && <span className="search-filter__option-description">{option.description}</span>}
                      </Button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <Button
            className="search-filter__reserve"
            onClick={() => onSearch({ values: selectedValues, realtimeAvailable: isRealtimeAvailable, origin, keyword })}
          >
            この条件で検索する
          </Button>
        </div>
      </main>
      {bottomNavigation && <div className="search-filter__navigation">{bottomNavigation}</div>}
    </div>
  )
}

export default SearchFilter
