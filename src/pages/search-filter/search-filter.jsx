import Button from '../../components/Button.jsx'
import { filterGroups, previewFilters } from './searchFilterData.js'
import './search-filter.scss'

function returnToSearch() {
  window.location.assign('/search')
}

// 表示用の制御コンポーネント。選択ルールや状態管理は後から親画面に追加できる。
function SearchFilter({
  values = previewFilters,
  realtimeAvailable = true,
  onOptionSelect,
  onRealtimeChange,
  onBack = returnToSearch,
  bottomNavigation = null,
}) {
  function renderAvailability(position) {
    return (
      <div className={`search-filter__availability search-filter__availability--${position}`}>
        {position === 'top' && <span className="search-filter__check" aria-hidden="true" />}
        <div className="search-filter__availability-copy">
          <span className="search-filter__availability-title">リアルタイム空室</span>
          <span className="search-filter__availability-description">今空いている部屋のみ表示</span>
        </div>
        <Button
          className={`search-filter__switch${realtimeAvailable ? ' search-filter__switch--on' : ''}`}
          role="switch"
          aria-checked={realtimeAvailable}
          aria-label="リアルタイム空室"
          aria-disabled={!onRealtimeChange}
          onClick={() => onRealtimeChange?.(!realtimeAvailable)}
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
          <Button className="search-filter__back" onClick={onBack} aria-label="検索結果に戻る">
            <svg className="search-filter__back-icon" aria-hidden="true"><use href="/images/icons.svg#chevron" /></svg>
          </Button>
          <h1 className="search-filter__title">検索条件</h1>
        </header>
        <div className="search-filter__content">
          {renderAvailability('top')}
          <div className="search-filter__groups">
            {filterGroups.map((group) => (
              <fieldset className="search-filter__group" key={group.id}>
                <legend className="search-filter__legend">{group.label}</legend>
                <div className={`search-filter__options search-filter__options--${group.id === 'capacity' ? 'capacity' : 'standard'}`}>
                  {group.options.map((option) => {
                    const selected = values[group.id]?.includes(option.value) ?? false

                    return (
                      <Button
                        key={option.value}
                        className={`search-filter__option${selected ? ' search-filter__option--selected' : ''}`}
                        aria-pressed={selected}
                        aria-disabled={!onOptionSelect}
                        onClick={() => onOptionSelect?.(group.id, option.value)}
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
          {renderAvailability('bottom')}
        </div>
      </main>
      {bottomNavigation && <div className="search-filter__navigation">{bottomNavigation}</div>}
    </div>
  )
}

export default SearchFilter
