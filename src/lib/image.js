import { calcGlobalStats, DAYS_ORDER, calcDayStats } from '../utils/stats.js'
import fs from 'node:fs'
import path from 'node:path'

let satoriFontsCache = null
async function getSatoriFonts() {
  if (satoriFontsCache) return satoriFontsCache
  const base = path.join(process.cwd(), 'public', 'fonts')
  const bcPath = path.join(base, 'BarlowCondensed-Black.ttf')
  const bPath = path.join(base, 'Barlow-Bold.ttf')
  const list = []
  if (fs.existsSync(bcPath)) {
    const data = await fs.promises.readFile(bcPath)
    for (const w of [900,800,700,600]) list.push({ name: 'Barlow Condensed', data, weight: w, style: 'normal' })
  }
  if (fs.existsSync(bPath)) {
    const data = await fs.promises.readFile(bPath)
    for (const w of [900,800,700,600,400]) list.push({ name: 'Barlow', data, weight: w, style: 'normal' })
  }
  satoriFontsCache = list
  return list
}

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

export async function buildSvg(data, date = new Date()) {
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

  // Try satori first (Vercel-safe, embeds fonts via JS, no librsvg data: needed)
  try {
    const satori = (await import('satori')).default
    const fonts = await getSatoriFonts()
    if (fonts.length) {
      const svg = await satori(
        {
          type: 'div',
          props: {
            style: { width: 1080, height: 810, display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #3A0A5E, #7A1FA2)' },
            children: [
              { type: 'div', props: { style: { height: 170, background: 'linear-gradient(90deg, #9747FF, #FF47A3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 36, color: 'white', letterSpacing: 1, textAlign: 'center' }, children: headerTitle } } } },
              { type: 'div', props: { style: { flex: 1, display: 'flex', gap: 30, padding: 40, paddingTop: 30 }, children: [
                { type: 'div', props: { style: { flex: 1, background: 'white', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }, children: [
                  { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 16, color: '#0F172A', letterSpacing: 3, textAlign: 'center' }, children: 'SURCHARGE DU JOUR' } },
                  { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 96, color: isRest ? '#0F172A' : dayPctColor, letterSpacing: -3, textAlign: 'center', marginTop: 8 }, children: isRest ? '—' : dayPctStr } },
                  { type: 'div', props: { style: { fontFamily: 'Barlow', fontWeight: 800, fontSize: 16, color: '#0F172A', marginTop: 4 }, children: isRest ? 'Repos' : `${dayStats.filled}/${dayStats.total} exos` } },
                  { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 12, color: '#0F172A', letterSpacing: 2.5, marginTop: 16 }, children: `${dayName} • ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` } },
                ] } },
                { type: 'div', props: { style: { flex: 1, background: 'white', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column' }, children: [
                  { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 14, color: '#0F172A', letterSpacing: 2.5, textAlign: 'center' }, children: `DÉTAIL — ${dayName}` } },
                  { type: 'div', props: { style: { fontFamily: 'Barlow', fontWeight: 600, fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4 }, children: `${dayStats.filled}/${dayStats.total} exos` } },
                  ...dayStats.perExo.slice(0,4).map(ex => ({
                    type: 'div', props: { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', borderRadius: 12, padding: '12px 14px', marginTop: 16 }, children: [
                      { type: 'div', props: { children: [
                        { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 14, color: '#0F172A' }, children: ex.exercise.slice(0,28) } },
                        { type: 'div', props: { style: { fontFamily: 'Barlow', fontSize: 11, color: '#6B7280', marginTop: 2 }, children: `S${ex.series||''} ${ex.repMin}-${ex.repMax} @${ex.weight??0}kg` } },
                        { type: 'div', props: { style: { fontFamily: 'Barlow', fontSize: 12, color: '#0F172A', marginTop: 4 }, children: `${ex.cur || '-'} • ${ex.curSum||0} reps / ${ex.last || '-'}` } },
                      ] } },
                      { type: 'div', props: { style: { background: ex.pct===null?'#F3F4F6':ex.pct>0?'#D1FAE5':'#FEE2E2', borderRadius: 999, padding: '6px 12px', fontFamily: 'Barlow', fontWeight: 900, fontSize: 12, color: ex.pct===null?'#0F172A':ex.pct>0?'#065F46':'#991B1B' }, children: ex.pct!==null?`${ex.pct>0?'+':''}${ex.pct.toFixed(0)}%`:'-' } },
                    ] }
                  })),
                ] } },
              ] } },
            ]
          }
        },
        { width: 1080, height: 810, fonts }
      )
      return svg
    }
  } catch (e) {
    // fallthrough to SVG fallback below
    console.error('satori failed', e.message)
  }

  // Fallback SVG with @font-face file:// (previous method) - for local dev if satori fails
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
      return `<text x="812" y="440" font-family="Barlow Condensed, sans-serif" font-size="22" font-weight="900" fill="#0F172A" text-anchor="middle">REPOS</text><text x="812" y="480" font-family="Barlow, sans-serif" font-size="16" font-weight="700" fill="#0F172A" text-anchor="middle">Récup active • ${esc(dayName)}</text><text x="812" y="510" font-family="Barlow, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">Aucun exo prévu</text>`
    }
    const rows = dayStats.perExo.slice(0, 4).map((ex, i) => {
      const y = 270 + i * 90
      const pct = ex.pct !== null ? `${ex.pct > 0 ? '+' : ''}${ex.pct.toFixed(0)}%` : '-'
      const pctBg = ex.pct === null ? '#F3F4F6' : ex.pct > 0 ? '#D1FAE5' : ex.pct < 0 ? '#FEE2E2' : '#F3F4F6'
      const pctCol = ex.pct === null ? '#0F172A' : ex.pct > 0 ? '#065F46' : ex.pct < 0 ? '#991B1B' : '#6B7280'
      const cur = esc(ex.cur || '-')
      const last = esc(ex.last || '-')
      return `<g><rect x="575" y="${y}" width="405" height="78" rx="16" fill="${i % 2 === 0 ? '#F9FAFB' : '#FFFFFF'}"/><text x="595" y="${y+28}" font-family="Barlow Condensed, Barlow, sans-serif" font-size="17" font-weight="900" fill="#0F172A">${esc(ex.exercise.slice(0, 28))}</text><text x="595" y="${y+48}" font-family="Barlow, sans-serif" font-size="11" font-weight="600" fill="#6B7280">S${ex.series || ''} ${ex.repMin}-${ex.repMax} @${ex.weight ?? 0}kg</text><text x="595" y="${y+66}" font-family="Barlow, sans-serif" font-size="13" font-weight="700" fill="#0F172A">${cur} • ${ex.curSum||0} reps / ${last}</text><rect x="880" y="${y+22}" width="72" height="32" rx="12" fill="${pctBg}"/><text x="916" y="${y+42}" font-family="Barlow, sans-serif" font-size="13" font-weight="900" fill="${pctCol}" text-anchor="middle">${pct}</text></g>`
    }).join('')
    return rows || `<text x="812" y="440" font-family="Barlow, sans-serif" font-size="16" fill="#0F172A" text-anchor="middle">Aucun exo</text>`
  })()
  // fallback SVG without satori (system font, no Barlow) - will show squares if font missing but satori path above is preferred
  return `<?xml version="1.0" encoding="UTF-8"?><svg width="1080" height="810" viewBox="0 0 1080 810" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="810" fill="#3A0A5E"/><rect x="0" y="0" width="1080" height="170" fill="#9747FF"/><text x="540" y="85" font-family="sans-serif" font-size="36" font-weight="900" fill="white" text-anchor="middle">${esc(headerTitle)}</text><g>${leftCard}</g><g><rect x="555" y="200" width="485" height="560" rx="24" fill="white"/><text x="812" y="265" font-family="sans-serif" font-size="16" font-weight="900" fill="#0F172A" text-anchor="middle">DÉTAIL — ${esc(dayName)}</text>${detailContent}</g></svg>`
}

export async function generatePngBuffer(svgString) {
  try {
    const sharp = (await import('sharp')).default
    return await sharp(Buffer.from(svgString)).png().toBuffer()
  } catch (e) {
    return Buffer.from(svgString)
  }
}
