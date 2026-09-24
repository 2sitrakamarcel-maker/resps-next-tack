import { calcDayStats } from '../utils/stats.js'
import fs from 'node:fs'
import path from 'node:path'

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
  const dayName = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'][date.getDay()]
  const dayStats = calcDayStats(dayName, plans, todayReps, history)
  const isRest = dayStats.total === 0
  const headerTitle = isRest ? "J'AI AGIS COMME UNE PUTE" : "LE DESTIN S’EST ENCORE FAIT BAISÉ"
  const dayPctStr = dayStats.dayPct !== null ? `${dayStats.dayPct > 0 ? '+' : ''}${dayStats.dayPct.toFixed(1)}%` : '-'
  const dayPctColor = dayPctStr === '-' ? '#0F172A' : dayPctStr.includes('+') ? '#059669' : '#DC2626'

  const leftCard = `<g><rect x="40" y="200" width="485" height="560" rx="24" fill="white"/><text x="282" y="275" font-family="Barlow Condensed, Barlow, sans-serif" font-size="16" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="3">SURCHARGE DU JOUR</text><text x="282" y="420" font-family="Barlow Condensed, Barlow, sans-serif" font-size="96" font-weight="900" fill="${isRest ? '#0F172A' : dayPctColor}" text-anchor="middle">${isRest ? '—' : dayPctStr}</text><text x="282" y="475" font-family="Barlow, sans-serif" font-size="16" font-weight="700" fill="#0F172A" text-anchor="middle">${isRest ? 'Repos' : `${dayStats.filled}/${dayStats.total} exos • ${dayStats.curTotal} reps`}</text><text x="282" y="560" font-family="Barlow, sans-serif" font-size="12" font-weight="700" fill="#0F172A" text-anchor="middle">${esc(dayName)} • ${esc(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }))}</text></g>`

  const detailContent = (() => {
    if (isRest) {
      return `<text x="812" y="440" font-family="Barlow Condensed, sans-serif" font-size="20" font-weight="800" fill="#0F172A" text-anchor="middle">REPOS</text><text x="812" y="480" font-family="Barlow, sans-serif" font-size="14" fill="#0F172A" text-anchor="middle">Recup active</text>`
    }
    const rows = dayStats.perExo.slice(0, 4).map((ex, i) => {
      const y = 270 + i * 90
      const pct = ex.pct !== null ? `${ex.pct > 0 ? '+' : ''}${ex.pct.toFixed(0)}%` : '-'
      const pctBg = ex.pct === null ? '#F3F4F6' : ex.pct > 0 ? '#D1FAE5' : ex.pct < 0 ? '#FEE2E2' : '#F3F4F6'
      const pctCol = ex.pct === null ? '#0F172A' : ex.pct > 0 ? '#065F46' : ex.pct < 0 ? '#991B1B' : '#6B7280'
      return `<g><rect x="575" y="${y}" width="405" height="78" rx="16" fill="${i % 2 === 0 ? '#F9FAFB' : '#FFFFFF'}"/><text x="595" y="${y + 28}" font-family="Barlow Condensed, Barlow, sans-serif" font-size="15" font-weight="800" fill="#0F172A">${esc(ex.exercise.slice(0, 28))}</text><text x="595" y="${y + 50}" font-family="Barlow, sans-serif" font-size="11" fill="#6B7280">S${ex.series || ''} ${ex.repMin}-${ex.repMax} @${ex.weight ?? 0}kg</text><text x="595" y="${y + 66}" font-family="Barlow, sans-serif" font-size="12" font-weight="700" fill="#0F172A">${esc(ex.cur || '-')} • ${ex.curSum || 0} reps / ${esc(ex.last || '-')}</text><rect x="880" y="${y + 22}" width="72" height="32" rx="12" fill="${pctBg}"/><text x="916" y="${y + 42}" font-family="Barlow, sans-serif" font-size="12" font-weight="800" fill="${pctCol}" text-anchor="middle">${pct}</text></g>`
    }).join('')
    return rows || `<text x="812" y="440" font-family="Barlow, sans-serif" font-size="14" fill="#0F172A" text-anchor="middle">Aucun exo</text>`
  })()

  return `<?xml version="1.0" encoding="UTF-8"?><svg width="1080" height="810" viewBox="0 0 1080 810" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#9747FF"/><stop offset="100%" stop-color="#FF47A3"/></linearGradient><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3A0A5E"/><stop offset="100%" stop-color="#7A1FA2"/></linearGradient></defs><rect width="1080" height="810" fill="url(#bg)"/><rect x="0" y="0" width="1080" height="170" fill="url(#g)"/><text x="540" y="85" font-family="Barlow Condensed, Barlow, sans-serif" font-size="34" font-weight="900" fill="white" text-anchor="middle">${esc(headerTitle)}</text>${leftCard}<g><rect x="555" y="200" width="485" height="560" rx="24" fill="white"/><text x="812" y="265" font-family="Barlow Condensed, sans-serif" font-size="14" font-weight="800" fill="#0F172A" text-anchor="middle">DÉTAIL — ${esc(dayName)}</text>${detailContent}</g></svg>`
}

function getFontFiles() {
  const base = path.join(process.cwd(), 'public', 'fonts')
  return [
    path.join(base, 'BarlowCondensed-Black.ttf'),
    path.join(base, 'Barlow-Bold.ttf'),
  ].filter((f) => fs.existsSync(f))
}

export async function generatePngBuffer(svgString) {
  const { Resvg } = await import('@resvg/resvg-js')
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: 1080 },
    font: { loadSystemFonts: false, fontFiles: getFontFiles(), defaultFontFamily: 'Barlow Condensed' },
  })
  return Buffer.from(resvg.render().asPng())
}
