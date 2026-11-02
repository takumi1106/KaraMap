import './SearchOrigin.scss'

export default function SearchOrigin({ mode, onChange }) {
  return <section className="search-origin" aria-label="検索の起点">
    <label className="search-origin__label">
      検索・経路の起点
      <select className="search-origin__select" value={mode} onChange={(event) => onChange(event.target.value)}>
        <option value="current">実際の現在地</option>
        <option value="demo">名古屋駅（デモ）</option>
      </select>
    </label>
    <p className="search-origin__note" role="status">{mode === 'demo'
      ? 'デモモード：名古屋駅を起点に検索・経路を表示します。実際の現在地ではありません。'
      : '現在地を起点に検索・経路を表示します。位置情報を許可しない場合も、名古屋駅のデモを利用できます。'}</p>
  </section>
}
