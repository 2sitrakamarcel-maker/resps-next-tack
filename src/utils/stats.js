import { parseSeries, sumSeries } from './progression.js'

export const DAYS_ORDER = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']

export function getPct(cur, last) {
  if (last === 0 || last === '-' || last === undefined || last === null || last === '') return null
  const nCur = Number(cur)
  const nLast = Number(last)
  if (Number.isNaN(nCur) || Number.isNaN(nLast) || nLast === 0) return null
  return ((nCur - nLast) / nLast) * 100
}

export function getLastFor(day, id, history) {
  const dates = Object.keys(history).sort().reverse()
  for (const d of dates) {
    const v = history[d]?.[day]?.[id]
    if (v !== undefined && v !== '') {
      if (Array.isArray(v)) return v.join('-')
      if (v && typeof v === 'object' && Array.isArray(v.series)) return v.series.join('-')
      return String(v)
    }
  }
  return '-'
}

export function calcDayStats(day, plans, todayReps, history) {
  const items = (plans[day] || []).filter((p) => p.exercise.trim())
  let curTotal = 0
  let lastTotal = 0
  let filled = 0
  const perExo = items.map((item) => {
    const n = item.series ?? 3
    const rawCur = todayReps?.[day]?.[item.id]
    const curArr = rawCur == null ? Array(n).fill('') : Array.isArray(rawCur) ? rawCur : (typeof rawCur === 'object' && rawCur.series ? rawCur.series : parseSeries(rawCur, n))
    const curStr = curArr.filter(s => s !== '').join('-')
    const curSum = sumSeries(curArr)
    // last total from history - need to parse similarly
    const lastArrRaw = (() => {
      const dates = Object.keys(history).sort().reverse()
      for (const d of dates) {
        const v = history[d]?.[day]?.[item.id]
        if (v !== undefined && v !== '' && v !== null) {
          if (Array.isArray(v)) return v
          if (v && typeof v === 'object' && Array.isArray(v.series)) return v.series
          return parseSeries(v, n)
        }
      }
      return null
    })()
    const lastStr = lastArrRaw ? lastArrRaw.filter(s => s !== '').join('-') || '-' : '-'
    const lastSum = lastArrRaw ? sumSeries(lastArrRaw) : 0
    const pct = curStr !== '' && lastStr !== '-' ? getPct(curSum, lastSum || 0) : null
    if (curStr !== '') {
      curTotal += curSum
      filled += 1
    }
    if (lastStr !== '-') lastTotal += lastSum
    return { id: item.id, exercise: item.exercise, instruction: item.instruction, series: item.series ?? 3, repMin: item.repMin ?? 8, repMax: item.repMax ?? 12, weight: item.weight ?? 0, method: item.method ?? 'reps', cur: curStr, curArr, last: lastStr, lastArr: lastArrRaw, pct, curSum, lastSum }
  })
  const dayPct = lastTotal > 0 ? ((curTotal - lastTotal) / lastTotal) * 100 : null
  return { perExo, curTotal, lastTotal, dayPct, filled, total: items.length }
}

export function calcGlobalStats(plans, todayReps, history) {
  let totalPlanned = 0
  let totalReps = 0
  let filled = 0
  let pctSum = 0
  let pctCount = 0
  let lastHistoryReps = 0

  Object.values(plans).forEach((dayList) => {
    const list = Array.isArray(dayList) ? dayList : (dayList.items || [])
    list.forEach((item) => {
      if (item.exercise.trim()) totalPlanned += 1
    })
  })

  Object.entries(todayReps).forEach(([, dayMap]) => {
    Object.values(dayMap).forEach((v) => {
      if (v === '' || v == null) return
      const arr = Array.isArray(v) ? v : (v && typeof v === 'object' && Array.isArray(v.series) ? v.series : parseSeries(v, 4))
      totalReps += sumSeries(arr)
    })
  })

  // per-exo pct average
  Object.entries(plans).forEach(([day, dayList]) => {
    const list = Array.isArray(dayList) ? dayList : (dayList.items || [])
    list.forEach((item) => {
      if (!item.exercise.trim()) return
      const n = item.series ?? 3
      const rawCur = todayReps?.[day]?.[item.id]
      if (rawCur === undefined || rawCur === '' || rawCur === null) return
      const curArr = Array.isArray(rawCur) ? rawCur : (typeof rawCur === 'object' && rawCur.series ? rawCur.series : parseSeries(rawCur, n))
      const curSum = sumSeries(curArr)
      if (curSum === 0) return
      const lastArrRaw = (() => {
        const dates = Object.keys(history).sort().reverse()
        for (const d of dates) {
          const v = history[d]?.[day]?.[item.id]
          if (v !== undefined && v !== '' && v !== null) {
            if (Array.isArray(v)) return v
            if (v && typeof v === 'object' && Array.isArray(v.series)) return v.series
            return parseSeries(v, n)
          }
        }
        return null
      })()
      if (!lastArrRaw) return
      const lastSum = sumSeries(lastArrRaw)
      if (lastSum === 0) return
      const pct = getPct(curSum, lastSum)
      if (pct !== null) {
        pctSum += pct
        pctCount += 1
      }
    })
  })

  // sum history for legacy display
  Object.values(history).forEach((dayMap) => {
    Object.values(dayMap).forEach((dm) => {
      Object.values(dm).forEach((v) => {
        if (v == null || v === '') return
        const arr = Array.isArray(v) ? v : (v && typeof v === 'object' && Array.isArray(v.series) ? v.series : [String(v)])
        arr.forEach(s => { const n = Number(s); if (!Number.isNaN(n) && s !== '') lastHistoryReps += n })
      })
    })
  })

  const globalPctAvg = pctCount > 0 ? pctSum / pctCount : null
  const legacyPct = lastHistoryReps > 0 ? ((totalReps - lastHistoryReps) / lastHistoryReps) * 100 : null

  // filled count
  Object.entries(todayReps).forEach(([, dm]) => {
    Object.values(dm).forEach((v) => {
      if (v == null || v === '' ) return
      const arr = Array.isArray(v) ? v : (v && typeof v === 'object' && Array.isArray(v.series) ? v.series : [String(v)])
      if (arr.some(s => s !== '' && !Number.isNaN(Number(s)))) filled += 1
    })
  })

  return { totalPlanned, totalReps, filled, globalPctAvg, legacyPct, lastHistoryReps, pctCount }
}
