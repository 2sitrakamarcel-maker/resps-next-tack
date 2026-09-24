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
  const dayPctStr = dayStats.dayPct !== null ? `${dayStats.dayPct > 0 ? '+' : ''}${dayStats.dayPct.toFixed(1)}%` : '-'
  const dayPctColor = dayPctStr === '-' ? '#0F172A' : dayPctStr.includes('+') ? '#059669' : '#DC2626'

  // left: surcharge du jour - only % - bigger body typography 900
  const leftCard = `
    <g>
      <rect x="40" y="200" width="485" height="560" rx="24" fill="white"/>
      <text x="282" y="275" font-family="Barlow Condensed, Barlow, sans-serif" font-size="16" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="3">SURCHARGE DU JOUR</text>
      <text x="282" y="420" font-family="Barlow Condensed, Barlow, sans-serif" font-size="110" font-weight="900" fill="${isRest ? '#0F172A' : dayPctColor}" text-anchor="middle" letter-spacing="-3">${isRest ? '—' : dayPctStr}</text>
      <text x="282" y="475" font-family="Barlow, sans-serif" font-size="18" font-weight="800" fill="#0F172A" text-anchor="middle">${isRest ? 'Repos' : `${dayStats.filled}/${dayStats.total} exos • ${dayStats.curTotal} reps`}</text>
      <rect x="80" y="520" width="405" height="2" fill="#0F172A" opacity="0.12"/>
      <text x="282" y="560" font-family="Barlow Condensed, sans-serif" font-size="13" font-weight="800" fill="#0F172A" text-anchor="middle" letter-spacing="2.5">${esc(dayName)} • ${esc(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }))}</text>
      <text x="282" y="590" font-family="Barlow, sans-serif" font-size="12" font-weight="600" fill="#6B7280" text-anchor="middle">${isRest ? 'Récup active' : `vs ${dayStats.lastTotal || 0} last • ${global.pctCount} exos`}</text>
    </g>
  `

  const detailContent = (() => {
    if (isRest) {
      return `
        <text x="812" y="440" font-family="Barlow Condensed, sans-serif" font-size="22" font-weight="900" fill="#0F172A" text-anchor="middle">REPOS</text>
        <text x="812" y="480" font-family="Barlow, sans-serif" font-size="16" font-weight="700" fill="#0F172A" text-anchor="middle">Récup active • ${esc(dayName)}</text>
        <text x="812" y="510" font-family="Barlow, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">Aucun exo prévu</text>
      `
    }
    const rows = dayStats.perExo.slice(0, 4).map((ex, i) => {
      const y = 270 + i * 90
      const pct = ex.pct !== null ? `${ex.pct > 0 ? '+' : ''}${ex.pct.toFixed(0)}%` : '-'
      const pctBg = ex.pct === null ? '#F3F4F6' : ex.pct > 0 ? '#D1FAE5' : ex.pct < 0 ? '#FEE2E2' : '#F3F4F6'
      const pctCol = ex.pct === null ? '#0F172A' : ex.pct > 0 ? '#065F46' : ex.pct < 0 ? '#991B1B' : '#6B7280'
      const cur = esc(ex.cur || '-')
      const last = esc(ex.last || '-')
      const repsLabel = `${ex.curSum || 0} reps`
      const seriesLabel = `S${ex.series || ''} ${ex.repMin}-${ex.repMax} @${ex.weight ?? 0}kg`
      return `
        <g>
          <rect x="575" y="${y}" width="405" height="78" rx="16" fill="${i % 2 === 0 ? '#F9FAFB' : '#FFFFFF'}"/>
          <text x="595" y="${y+28}" font-family="Barlow Condensed, Barlow, sans-serif" font-size="17" font-weight="900" fill="#0F172A">${esc(ex.exercise.slice(0, 28))}</text>
          <text x="595" y="${y+48}" font-family="Barlow, sans-serif" font-size="11" font-weight="600" fill="#6B7280">${esc(seriesLabel)}</text>
          <text x="595" y="${y+66}" font-family="Barlow, sans-serif" font-size="13" font-weight="700" fill="#0F172A">${cur} • ${repsLabel} / ${last}</text>
          <rect x="880" y="${y+22}" width="72" height="32" rx="12" fill="${pctBg}"/>
          <text x="916" y="${y+42}" font-family="Barlow, sans-serif" font-size="13" font-weight="900" fill="${pctCol}" text-anchor="middle">${pct}</text>
        </g>
      `
    }).join('')
    return rows || `<text x="812" y="440" font-family="Barlow, sans-serif" font-size="16" fill="#0F172A" text-anchor="middle">Aucun exo</text>`
  })()

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="810" viewBox="0 0 1080 810" xmlns="http://www.w3.org/2000/svg">
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
  <rect width="1080" height="810" fill="url(#bg)"/>
  <!-- Header 4:3 - no outer radius, only inner cards rounded -->
  <rect x="0" y="0" width="1080" height="170" fill="url(#g)"/>
  <text x="540" y="85" font-family="Barlow Condensed, Barlow, sans-serif" font-size="36" font-weight="900" fill="white" text-anchor="middle" letter-spacing="1">${esc(headerTitle)}</text>
  <!-- Two white cards - inside rounded only -->
  ${leftCard}
  <g>
    <rect x="555" y="200" width="485" height="560" rx="24" fill="white"/>
    <text x="812" y="265" font-family="Barlow Condensed, sans-serif" font-size="16" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="2.5">DÉTAIL — ${esc(dayName)}</text>
    <text x="812" y="285" font-family="Barlow, sans-serif" font-size="11" font-weight="600" fill="#6B7280" text-anchor="middle">${dayStats.filled}/${dayStats.total} exos</text>
    ${detailContent}
    <text x="812" y="740" font-family="Barlow, sans-serif" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle" letter-spacing="1">stay hard</text>
  </g>
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
