import { calcGlobalStats, DAYS_ORDER, calcDayStats } from '../utils/stats.js'

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildCaption(data, date = new Date()) {
  if (!data) return `🔥 Reps-Tracker — ${date.toLocaleDateString('fr-FR')} — Pas de données 💪`
  const { plans = {}, todayReps = {}, history = {} } = data
  const dayName = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'][date.getDay()]
  const dayStats = calcDayStats(dayName, plans, todayReps, history)
  if (dayStats.total === 0) return `🔥 ${dayName} ${date.toLocaleDateString('fr-FR')} — Repos / pas d’exos planifiés 💪 #RepsTracker`
  if (dayStats.filled === 0) return `🔥 ${dayName} ${date.toLocaleDateString('fr-FR')} — 0/${dayStats.total} exos remplis — à toi de jouer ! 💪 #RepsTracker`
  const pct = dayStats.dayPct !== null ? ` (${dayStats.dayPct > 0 ? '+' : ''}${dayStats.dayPct.toFixed(1)}%)` : ''
  return `🔥 ${dayName} ${date.toLocaleDateString('fr-FR')} — ${dayStats.curTotal} reps sur ${dayStats.total} exos (${dayStats.filled}/${dayStats.total} remplis${pct}) 💪 #RepsTracker`
}

export function buildSvg(data, date = new Date()) {
  const plans = data?.plans || {}
  const todayReps = data?.todayReps || {}
  const history = data?.history || {}
  const global = calcGlobalStats(plans, todayReps, history)
  const dayName = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'][date.getDay()]
  const dayStats = calcDayStats(dayName, plans, todayReps, history)
  const pctStr = global.globalPctAvg !== null ? `${global.globalPctAvg > 0 ? '+' : ''}${global.globalPctAvg.toFixed(1)}%` : '-'
  const pctColor = global.globalPctAvg === null ? '#9CA3AF' : global.globalPctAvg > 0 ? '#059669' : global.globalPctAvg < 0 ? '#DC2626' : '#6B7280'
  const dayPctStr = dayStats.dayPct !== null ? `${dayStats.dayPct > 0 ? '+' : ''}${dayStats.dayPct.toFixed(1)}%` : '-'

  const perExoRows = dayStats.perExo.slice(0, 5).map((ex, i) => {
    const y = 610 + i * 52
    const bg = i % 2 === 0 ? '#F9FAFB' : '#FFFFFF'
    const pct = ex.pct !== null ? `${ex.pct > 0 ? '+' : ''}${ex.pct.toFixed(0)}%` : '-'
    const pctBg = ex.pct === null ? '#F3F4F6' : ex.pct > 0 ? '#D1FAE5' : ex.pct < 0 ? '#FEE2E2' : '#F3F4F6'
    const pctCol = ex.pct === null ? '#6B7280' : ex.pct > 0 ? '#065F46' : ex.pct < 0 ? '#991B1B' : '#6B7280'
    return `
      <rect x="40" y="${y}" width="1000" height="44" rx="12" fill="${bg}" stroke="#E5E7EB"/>
      <text x="60" y="${y+27}" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#1F2937">${esc(ex.exercise.slice(0,32))}</text>
      <text x="700" y="${y+27}" font-family="Arial, sans-serif" font-size="16" fill="#6B7280">${esc(ex.cur || '-')} / ${esc(ex.last)}</text>
      <rect x="880" y="${y+10}" width="80" height="24" rx="12" fill="${pctBg}"/>
      <text x="920" y="${y+27}" font-family="Arial, sans-serif" font-size="13" font-weight="800" fill="${pctCol}" text-anchor="middle">${pct}</text>
    `
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9747FF"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" rx="32" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
  <!-- Header -->
  <rect width="1080" height="220" rx="32" fill="url(#g)"/>
  <rect y="190" width="1080" height="30" fill="url(#g)"/>
  <text x="540" y="80" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="white" text-anchor="middle" letter-spacing="3">REPS-TRACKER</text>
  <text x="540" y="125" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="white" text-anchor="middle">${esc(dayName)}</text>
  <text x="540" y="165" font-family="Arial, sans-serif" font-size="18" fill="white" opacity="0.9" text-anchor="middle">${esc(date.toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'}))}</text>

   <!-- 2 cartes surcharge -->
  <g>
    <rect x="140" y="250" width="380" height="150" rx="20" fill="#F5F3FF" stroke="#DDD6FE"/>
    <text x="330" y="285" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#6B7280" text-anchor="middle">SURCHARGE MOY.</text>
    <text x="330" y="330" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="${pctColor}" text-anchor="middle">${pctStr}</text>
    <text x="330" y="360" font-family="Arial, sans-serif" font-size="13" fill="#9CA3AF" text-anchor="middle">moy. tous exos (${global.pctCount})</text>

    <rect x="560" y="250" width="380" height="150" rx="20" fill="#F5F3FF" stroke="#DDD6FE"/>
    <text x="750" y="285" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#6B7280" text-anchor="middle">SURCHARGE — ${esc(dayName)}</text>
    <text x="750" y="330" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="${dayPctStr==='-'?'#9CA3AF':(dayPctStr.includes('+')?'#059669':'#DC2626')}" text-anchor="middle">${dayPctStr}</text>
    <text x="750" y="360" font-family="Arial, sans-serif" font-size="13" fill="#9CA3AF" text-anchor="middle">${dayStats.filled}/${dayStats.total} exos aujourd&apos;hui</text>
  </g>

  <!-- Day header -->
  <rect x="40" y="430" width="1000" height="60" rx="16" fill="#111827"/>
  <text x="60" y="468" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="white">DÉTAIL — ${esc(dayName)}</text>
  <text x="980" y="468" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.8" text-anchor="end">${dayStats.filled}/${dayStats.total} exos • ${dayStats.curTotal} vs ${dayStats.lastTotal || '-'} (${dayPctStr})</text>

   <!-- Week strip -->
  <g>
    ${DAYS_ORDER.map((d, i) => {
      const ds = calcDayStats(d, plans, todayReps, history)
      const isToday = d === dayName
      const isRest = ds.total === 0
      const x = 40 + i * 145
      const bg = isRest ? (isToday ? '#60A5FA' : '#DBEAFE') : (isToday ? '#9747FF' : '#F3F4F6')
      const col = isRest ? (isToday ? 'white' : '#1E40AF') : (isToday ? 'white' : '#6B7280')
      const pct = isRest ? 'REPOS' : (ds.dayPct !== null ? `${ds.dayPct > 0 ? '+' : ''}${ds.dayPct.toFixed(0)}%` : '-')
      const curLabel = isRest ? '💤 REPOS' : `${ds.curTotal || 0} reps`
      return `<rect x="${x}" y="510" width="135" height="70" rx="14" fill="${bg}" stroke="${isRest ? '#93C5FD' : isToday ? '#7C3AED' : '#E5E7EB'}"/>
              <text x="${x+67}" y="535" font-family="Arial, sans-serif" font-size="11" font-weight="800" fill="${col}" text-anchor="middle">${d}</text>
              <text x="${x+67}" y="558" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="${col}" text-anchor="middle">${curLabel}</text>
              <text x="${x+67}" y="572" font-family="Arial, sans-serif" font-size="10" fill="${col}" opacity="0.8" text-anchor="middle">${pct}</text>`
    }).join('')}
  </g>

  <!-- Per exo rows -->
  ${perExoRows || (dayStats.total === 0 ? '<text x="540" y="650" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="#1E40AF" text-anchor="middle">💤 Jour de Repos — récup active</text><text x="540" y="680" font-family="Arial, sans-serif" font-size="14" fill="#60A5FA" text-anchor="middle">Aucun exercice prévu</text>' : '<text x="540" y="650" font-family="Arial, sans-serif" font-size="16" fill="#9CA3AF" text-anchor="middle">Aucun exercice planifié — va dans Plan</text>')}

   <!-- Footer -->
  <rect x="40" y="1220" width="1000" height="90" rx="16" fill="#F9FAFB" stroke="#E5E7EB" stroke-dasharray="8 6"/>
  <text x="540" y="1255" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#111827" text-anchor="middle">stay hard</text>
  <text x="540" y="1280" font-family="Arial, sans-serif" font-size="13" fill="#6B7280" text-anchor="middle">${esc(date.toLocaleDateString('fr-FR'))}</text>
</svg>`
}

export async function generatePngBuffer(svgString) {
  try {
    const sharp = (await import('sharp')).default
    return await sharp(Buffer.from(svgString)).png().toBuffer()
  } catch (e) {
    // sharp not installed → return svg buffer (fallback)
    return Buffer.from(svgString)
  }
}
