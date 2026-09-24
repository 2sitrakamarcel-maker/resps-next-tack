import { calcGlobalStats, DAYS_ORDER, calcDayStats } from '../utils/stats.js'

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildCaption(data, date = new Date()) {
  if (!data) return `🔥 LE DESTIN S’EST ENCORE FAIT BAISÉ — ${date.toLocaleDateString('fr-FR')} — Pas de données 💪`
  const { plans = {}, todayReps = {}, history = {} } = data
  const dayName = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'][date.getDay()]
  const dayStats = calcDayStats(dayName, plans, todayReps, history)
  if (dayStats.total === 0) return `J'AI AGIS COMME UNE PUTE — ${dayName} ${date.toLocaleDateString('fr-FR')} — Repos 💪 #RepsTracker`
  if (dayStats.filled === 0) return `🔥 LE DESTIN S’EST ENCORE FAIT BAISÉ — ${dayName} ${date.toLocaleDateString('fr-FR')} — 0/${dayStats.total} exos remplis — à toi de jouer ! 💪 #RepsTracker`
  const pct = dayStats.dayPct !== null ? ` (${dayStats.dayPct > 0 ? '+' : ''}${dayStats.dayPct.toFixed(1)}%)` : ''
  return `🔥 LE DESTIN S’EST ENCORE FAIT BAISÉ — ${dayName} ${date.toLocaleDateString('fr-FR')} — ${dayStats.curTotal} reps sur ${dayStats.total} exos (${dayStats.filled}/${dayStats.total} remplis${pct}) 💪 #RepsTracker`
}

export function buildSvg(data, date = new Date()) {
  const plans = data?.plans || {}
  const todayReps = data?.todayReps || {}
  const history = data?.history || {}
  const global = calcGlobalStats(plans, todayReps, history)
  const dayName = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'][date.getDay()]
  const dayStats = calcDayStats(dayName, plans, todayReps, history)
  const isRest = dayStats.total === 0
  const headerTitle = isRest ? "J'AI AGIS COMME UNE PUTE" : "LE DESTIN S’EST ENCORE FAIT BAISÉ"
  const pctStr = global.globalPctAvg !== null ? `${global.globalPctAvg > 0 ? '+' : ''}${global.globalPctAvg.toFixed(1)}%` : '-'
  const pctColor = global.globalPctAvg === null ? '#9CA3AF' : global.globalPctAvg > 0 ? '#059669' : global.globalPctAvg < 0 ? '#DC2626' : '#6B7280'
  const dayPctStr = dayStats.dayPct !== null ? `${dayStats.dayPct > 0 ? '+' : ''}${dayStats.dayPct.toFixed(1)}%` : '-'
  const dayPctColor = dayPctStr === '-' ? '#9CA3AF' : dayPctStr.includes('+') ? '#059669' : '#DC2626'

  // left card: surcharge du jour
  const leftCard = `
    <g>
      <rect x="40" y="360" width="485" height="420" rx="32" fill="white"/>
      <text x="282" y="410" font-family="Barlow Condensed, Barlow, sans-serif" font-size="13" font-weight="800" fill="#6B7280" text-anchor="middle" letter-spacing="2">SURCHARGE DU JOUR</text>
      <text x="282" y="500" font-family="Barlow Condensed, Barlow, sans-serif" font-size="72" font-weight="900" fill="${isRest ? '#9CA3AF' : pctColor}" text-anchor="middle">${isRest ? '—' : dayPctStr}</text>
      <text x="282" y="540" font-family="Barlow, sans-serif" font-size="13" font-weight="600" fill="#9CA3AF" text-anchor="middle">${isRest ? 'Repos' : `${dayStats.filled}/${dayStats.total} exos • ${dayStats.curTotal} vs ${dayStats.lastTotal || '-'} reps`}</text>
      <rect x="80" y="580" width="405" height="70" rx="16" fill="#F9FAFB"/>
      <text x="282" y="605" font-family="Barlow, sans-serif" font-size="12" font-weight="700" fill="#6B7280" text-anchor="middle">VOLUME JOUR</text>
      <text x="282" y="635" font-family="Barlow Condensed, sans-serif" font-size="24" font-weight="800" fill="#0F172A" text-anchor="middle">${dayStats.curTotal} reps</text>
      <text x="282" y="700" font-family="Barlow, sans-serif" font-size="11" font-weight="600" fill="#9CA3AF" text-anchor="middle">moy. tous exos ${pctStr} (${global.pctCount})</text>
    </g>
  `

  const detailContent = (() => {
    if (isRest) {
      return `
        <text x="812" y="550" font-family="Barlow Condensed, sans-serif" font-size="18" font-weight="800" fill="#1E40AF" text-anchor="middle">💤 Repos</text>
        <text x="812" y="580" font-family="Barlow, sans-serif" font-size="13" fill="#60A5FA" text-anchor="middle">Récup active</text>
      `
    }
    const rows = dayStats.perExo.slice(0, 4).map((ex, i) => {
      const y = 430 + i * 78
      const pct = ex.pct !== null ? `${ex.pct > 0 ? '+' : ''}${ex.pct.toFixed(0)}%` : '-'
      const pctBg = ex.pct === null ? '#F3F4F6' : ex.pct > 0 ? '#D1FAE5' : ex.pct < 0 ? '#FEE2E2' : '#F3F4F6'
      const pctCol = ex.pct === null ? '#6B7280' : ex.pct > 0 ? '#065F46' : ex.pct < 0 ? '#991B1B' : '#6B7280'
      const cur = esc(ex.cur || '-')
      const last = esc(ex.last || '-')
      return `
        <g>
          <rect x="575" y="${y}" width="405" height="66" rx="16" fill="${i % 2 === 0 ? '#F9FAFB' : '#FFFFFF'}" stroke="#E5E7EB" stroke-width="0.5"/>
          <text x="595" y="${y+24}" font-family="Barlow, sans-serif" font-size="14" font-weight="700" fill="#0F172A">${esc(ex.exercise.slice(0, 28))}</text>
          <text x="595" y="${y+44}" font-family="Barlow, sans-serif" font-size="11" fill="#9CA3AF">${cur} / ${last}</text>
          <rect x="880" y="${y+20}" width="64" height="26" rx="12" fill="${pctBg}"/>
          <text x="912" y="${y+37}" font-family="Barlow, sans-serif" font-size="11" font-weight="800" fill="${pctCol}" text-anchor="middle">${pct}</text>
        </g>
      `
    }).join('')
    return rows || `<text x="812" y="550" font-family="Barlow, sans-serif" font-size="14" fill="#9CA3AF" text-anchor="middle">Aucun exo</text>`
  })()

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9747FF"/>
      <stop offset="100%" stop-color="#FF47A3"/>
    </linearGradient>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3A0A5E"/>
      <stop offset="100%" stop-color="#7A1FA2"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" rx="32" fill="url(#bg)"/>
  <!-- Top bar with big title -->
  <rect x="0" y="0" width="1080" height="260" rx="32" fill="url(#g)" opacity="0.95"/>
  <rect y="220" width="1080" height="40" fill="url(#g)"/>
  <text x="540" y="130" font-family="Barlow Condensed, Barlow, sans-serif" font-size="38" font-weight="900" fill="white" text-anchor="middle" letter-spacing="1">${esc(headerTitle)}</text>
  <text x="540" y="175" font-family="Barlow, sans-serif" font-size="14" font-weight="600" fill="white" opacity="0.85" text-anchor="middle">${esc(date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))} • ${esc(dayName)}</text>
  <text x="540" y="205" font-family="Barlow, sans-serif" font-size="11" font-weight="700" fill="white" opacity="0.7" text-anchor="middle">REPS-TRACKER</text>

  <!-- Two white cards -->
  ${leftCard}
  <g>
    <rect x="555" y="360" width="485" height="420" rx="32" fill="white"/>
    <text x="812" y="410" font-family="Barlow Condensed, sans-serif" font-size="13" font-weight="800" fill="#6B7280" text-anchor="middle" letter-spacing="2">DÉTAIL — ${esc(dayName)}</text>
    ${detailContent}
    <text x="812" y="750" font-family="Barlow, sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">${dayStats.filled}/${dayStats.total} exos • stay hard</text>
  </g>

  <!-- Bottom rounded bar -->
  <rect x="0" y="1280" width="1080" height="70" rx="32" fill="url(#g)" opacity="0.9"/>
  <rect y="1280" width="1080" height="30" fill="url(#g)"/>
  <text x="540" y="1320" font-family="Barlow Condensed, sans-serif" font-size="14" font-weight="800" fill="white" text-anchor="middle" letter-spacing="4">STAY HARD</text>
</svg>`
}

export async function generatePngBuffer(svgString) {
  try {
    const sharp = (await import('sharp')).default
    return await sharp(Buffer.from(svgString)).png().toBuffer()
  } catch (e) {
    return Buffer.from(svgString)
  }
}
