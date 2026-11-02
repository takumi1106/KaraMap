// 表示件数だけを制限する。検索結果・地図へ渡す元配列は変更しない。
export function visibleDistanceGroups(groups, farCount = 5, nearCount = 10) {
  return groups.filter((group) => group.shops.length > 0).map((group) => {
    const visibleShops = group.id === 'far' ? group.shops.slice(0, farCount) : group.id === 'near' ? group.shops.slice(0, nearCount) : group.shops
    const remainingCount = group.shops.length - visibleShops.length
    const nextCount = Math.min(group.id === 'near' ? 10 : 5, remainingCount)
    return { ...group, visibleShops, remainingCount, nextCount, hasMore: remainingCount > 0 }
  })
}

// 最新のstateを使い、別区分の件数を戻さず、総件数を上限に更新する。
export function expandDistanceGroup(previous, key, groupId, total) {
  const current = previous.key === key ? previous : { key, count: 5, nearCount: 10 }
  if (groupId === 'near') return { ...current, nearCount: Math.min(total, current.nearCount + 10) }
  if (groupId === 'far') return { ...current, count: Math.min(total, current.count + 5) }
  return current
}
