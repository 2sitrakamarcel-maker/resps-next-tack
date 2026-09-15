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
    if (v !== undefined && v !== '') return String(v)
  }
  return '-'
}

export function calcDayStats(day, plans, todayReps, history) {
  const items = (plans[day] || []).filter((p) => p.exercise.trim())
  let curTotal = 0
  let lastTotal = 0
  let filled = 0
  const perExo = items.map((item) => {
    const cur = todayReps?.[day]?.[item.id]
    const curStr = cur !== undefined && cur !== '' ? String(cur) : ''
    const last = getLastFor(day, item.id, history)
    const pct = curStr !== '' && last !== '-' ? getPct(curStr, last) : null
    if (curStr !== '' && !Number.isNaN(Number(curStr))) {
      curTotal += Number(curStr)
      filled += 1
    }
    if (last !== '-' && !Number.isNaN(Number(last))) lastTotal += Number(last)
    return { id: item.id, exercise: item.exercise, instruction: item.instruction, cur: curStr, last, pct }
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
    dayList.forEach((item) => {
      if (item.exercise.trim()) totalPlanned += 1
    })
  })

  Object.entries(todayReps).forEach(([, dayMap]) => {
    Object.values(dayMap).forEach((v) => {
      if (v !== '' && v !== undefined) {
        const n = Number(v)
        if (!Number.isNaN(n)) {
          totalReps += n
        }
      }
    })
  })

  // per-exo pct average
  Object.entries(plans).forEach(([day, dayList]) => {
    dayList.forEach((item) => {
      if (!item.exercise.trim()) return
      const cur = todayReps?.[day]?.[item.id]
      if (cur === undefined || cur === '') return
      const last = getLastFor(day, item.id, history)
      const pct = getPct(String(cur), last)
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
        const n = Number(v)
        if (!Number.isNaN(n)) lastHistoryReps += n
      })
    })
  })

  const globalPctAvg = pctCount > 0 ? pctSum / pctCount : null
  const legacyPct = lastHistoryReps > 0 ? ((totalReps - lastHistoryReps) / lastHistoryReps) * 100 : null

  // filled count
  Object.entries(todayReps).forEach(([, dm]) => {
    Object.values(dm).forEach((v) => {
      if (v !== '' && v !== undefined && !Number.isNaN(Number(v))) filled += 1
    })
  })

  return { totalPlanned, totalReps, filled, globalPctAvg, legacyPct, lastHistoryReps, pctCount }
}
