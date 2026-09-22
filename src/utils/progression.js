export function parseSeries(v, n = 4) {
  if (Array.isArray(v)) return v.map(s => String(s ?? '')).slice(0, n).concat(Array(n).fill('')).slice(0, n)
  if (v && typeof v === 'object' && Array.isArray(v.series)) return v.series.map(s => String(s ?? '')).slice(0, n).concat(Array(n).fill('')).slice(0, n)
  if (typeof v === 'string' && v.includes('-')) return v.split('-').map(s => s.trim()).slice(0, n).concat(Array(n).fill('')).slice(0, n)
  if (v === '' || v == null || v === '-') return Array(n).fill('')
  return [String(v), ...Array(n - 1).fill('')]
}

export function sumSeries(arr) {
  return arr.reduce((a, s) => {
    const n = Number(s)
    return s === '' || Number.isNaN(n) ? a : a + n
  }, 0)
}

export function seriesJoin(arr) {
  const filtered = arr.filter(s => s !== '')
  return filtered.length ? filtered.join('-') : '-'
}

export function getLastSeriesFor(day, id, history, n = 4) {
  const dates = Object.keys(history).sort().reverse()
  for (const d of dates) {
    const v = history[d]?.[day]?.[id]
    if (v === undefined || v === '' || v === null) continue
    // handle legacy object {series, weight} or string or array
    if (typeof v === 'object' && !Array.isArray(v) && v.series) {
      const arr = parseSeries(v.series, n)
      if (arr.some(s => s !== '')) return arr
    } else {
      const arr = parseSeries(v, n)
      if (arr.some(s => s !== '')) return arr
    }
  }
  return null
}

export function getLastWeightFor(day, id, history) {
  const dates = Object.keys(history).sort().reverse()
  for (const d of dates) {
    const v = history[d]?.[day]?.[id]
    if (v && typeof v === 'object' && !Array.isArray(v) && v.weight != null) return v.weight
  }
  return null
}

export function getTargetFor(lastSeries, planItem) {
  const n = planItem?.series ?? 3
  const repMin = planItem?.repMin ?? 8
  const repMax = planItem?.repMax ?? 12
  const weight = planItem?.weight ?? 0
  const method = planItem?.method ?? 'reps'
  const inc = planItem?.increment ?? 2.5
  const nSeries = Number(n) || 3
  if (!lastSeries || lastSeries.every(s => s === '')) {
    return { status: 'init', overload: false, display: `${nSeries}x${repMin}-${repMax} @${weight}kg`, nextWeight: weight, nextRep: repMin, nextRepMax: repMax }
  }
  const nums = lastSeries.map(s => Number(s))
  const allAtMax = nums.length >= nSeries && nums.every(r => !Number.isNaN(r) && r >= repMax) && lastSeries.every(s => s !== '')
  if (!allAtMax) {
    return { status: 'maintain', overload: false, display: `${nSeries}x${repMax} @${weight}kg`, nextWeight: weight, nextRep: repMax, nextRepMax: repMax, reason: `Objectif ${repMax} non atteint sur toutes séries` }
  }
  if (method === 'reps') {
    return { status: 'ceiling', overload: true, via: 'reps', display: `${nSeries}x${repMax} @${weight}kg ✓`, nextWeight: weight, nextRep: repMax, nextRepMax: repMax }
  } else {
    const w = Number(weight) || 0
    const incVal = Number(inc) || 2.5
    const nextWeight = Math.round((w + incVal) * 2) / 2
    return { status: 'overload', overload: true, via: 'poids', display: `${nSeries}x${repMin} @${nextWeight}kg ↑`, nextWeight, nextRep: repMin, nextRepMax: repMax, prevWeight: w }
  }
}
