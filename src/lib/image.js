import { calcGlobalStats, calcDayStats } from '../utils/stats.js'
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
    for (const w of [900, 800, 700, 600]) list.push({ name: 'Barlow Condensed', data, weight: w, style: 'normal' })
  }
  if (fs.existsSync(bPath)) {
    const data = await fs.promises.readFile(bPath)
    for (const w of [900, 800, 700, 600, 400]) list.push({ name: 'Barlow', data, weight: w, style: 'normal' })
  }
  satoriFontsCache = list
  return list
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildCaption(data, date = new Date()) {
  if (!data) return `LE DESTIN S'EST ENCORE FAIT BAISE — ${date.toLocaleDateString('fr-FR')} — Pas de donnees`
  const { plans = {}, todayReps = {}, history = {} } = data
  const dayName = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'][date.getDay()]
  const dayStats = calcDayStats(dayName, plans, todayReps, history)
  if (dayStats.total === 0) return `J'AI AGIS COMME UNE PUTE — ${dayName} ${date.toLocaleDateString('fr-FR')} — Repos`
  if (dayStats.filled === 0) return `LE DESTIN S'EST ENCORE FAIT BAISE — ${dayName} ${date.toLocaleDateString('fr-FR')} — 0/${dayStats.total} exos`
  const pct = dayStats.dayPct !== null ? ` (${dayStats.dayPct > 0 ? '+' : ''}${dayStats.dayPct.toFixed(1)}%)` : ''
  return `LE DESTIN S'EST ENCORE FAIT BAISE — ${dayName} ${date.toLocaleDateString('fr-FR')} — ${dayStats.curTotal} reps sur ${dayStats.total} exos${pct}`
}

export async function buildSvg(data, date = new Date()) {
  const plans = data?.plans || {}
  const todayReps = data?.todayReps || {}
  const history = data?.history || {}
  const dayName = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'][date.getDay()]
  const dayStats = calcDayStats(dayName, plans, todayReps, history)
  const isRest = dayStats.total === 0
  const headerTitle = isRest ? "J'AI AGIS COMME UNE PUTE" : "LE DESTIN S'EST ENCORE FAIT BAISE"
  const dayPctStr = dayStats.dayPct !== null ? `${dayStats.dayPct > 0 ? '+' : ''}${dayStats.dayPct.toFixed(1)}%` : '-'
  const dayPctColor = dayPctStr === '-' ? '#0F172A' : dayPctStr.includes('+') ? '#059669' : '#DC2626'

  const satori = (await import('satori')).default
  const fonts = await getSatoriFonts()
  if (!fonts.length) throw new Error('Polices Barlow introuvables dans public/fonts')

  const exoRows = dayStats.perExo.slice(0, 4).map((ex) => {
    const pct = ex.pct !== null ? `${ex.pct > 0 ? '+' : ''}${ex.pct.toFixed(0)}%` : '-'
    const pctBg = ex.pct === null ? '#F3F4F6' : ex.pct > 0 ? '#D1FAE5' : ex.pct < 0 ? '#FEE2E2' : '#F3F4F6'
    const pctCol = ex.pct === null ? '#0F172A' : ex.pct > 0 ? '#065F46' : ex.pct < 0 ? '#991B1B' : '#6B7280'
    return {
      type: 'div',
      props: {
        style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', borderRadius: 12, padding: '12px 14px', marginTop: 12 },
        children: [
          { type: 'div', props: { style: { display: 'flex', flexDirection: 'column' }, children: [
            { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 15, color: '#0F172A' }, children: ex.exercise.slice(0, 28) } },
            { type: 'div', props: { style: { fontFamily: 'Barlow', fontSize: 11, color: '#6B7280', marginTop: 2 }, children: `S${ex.series || ''} ${ex.repMin}-${ex.repMax} @${ex.weight ?? 0}kg` } },
            { type: 'div', props: { style: { fontFamily: 'Barlow', fontSize: 12, color: '#0F172A', marginTop: 4 }, children: `${ex.cur || '-'} - ${ex.curSum || 0} reps / ${ex.last || '-'}` } },
          ] } },
          { type: 'div', props: { style: { background: pctBg, borderRadius: 999, padding: '6px 12px', fontFamily: 'Barlow', fontWeight: 900, fontSize: 12, color: pctCol }, children: pct } },
        ],
      },
    }
  })

  const detailChildren = isRest
    ? [
        { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 22, color: '#0F172A', textAlign: 'center', marginTop: 60 }, children: 'REPOS' } },
        { type: 'div', props: { style: { fontFamily: 'Barlow', fontSize: 15, color: '#0F172A', textAlign: 'center', marginTop: 8 }, children: `Recup active - ${dayName}` } },
      ]
    : (exoRows.length ? exoRows : [
        { type: 'div', props: { style: { fontFamily: 'Barlow', fontSize: 14, color: '#0F172A', textAlign: 'center', marginTop: 60 }, children: 'Aucun exo' } },
      ])

  const tree = {
    type: 'div',
    props: {
      style: { width: 1080, height: 810, display: 'flex', flexDirection: 'column', backgroundColor: '#3A0A5E' },
      children: [
        { type: 'div', props: { style: { height: 170, backgroundColor: '#9747FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 34, color: 'white', textAlign: 'center' }, children: headerTitle } } } },
        { type: 'div', props: { style: { flex: 1, display: 'flex', flexDirection: 'row', gap: 30, padding: 40, paddingTop: 30 }, children: [
          { type: 'div', props: { style: { flex: 1, backgroundColor: 'white', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }, children: [
            { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 15, color: '#0F172A', letterSpacing: 2, textAlign: 'center' }, children: 'SURCHARGE DU JOUR' } },
            { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 92, color: isRest ? '#0F172A' : dayPctColor, textAlign: 'center', marginTop: 8 }, children: isRest ? '-' : dayPctStr } },
            { type: 'div', props: { style: { fontFamily: 'Barlow', fontWeight: 800, fontSize: 15, color: '#0F172A', marginTop: 4 }, children: isRest ? 'Repos' : `${dayStats.filled}/${dayStats.total} exos` } },
            { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 12, color: '#0F172A', marginTop: 16 }, children: `${dayName} - ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` } },
          ] } },
          { type: 'div', props: { style: { flex: 1, backgroundColor: 'white', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column' }, children: [
            { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 14, color: '#0F172A', textAlign: 'center' }, children: `DETAIL - ${dayName}` } },
            { type: 'div', props: { style: { fontFamily: 'Barlow', fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4 }, children: `${dayStats.filled}/${dayStats.total} exos` } },
            ...detailChildren,
            { type: 'div', props: { style: { fontFamily: 'Barlow', fontWeight: 800, fontSize: 11, color: '#0F172A', textAlign: 'center', marginTop: 16 }, children: 'stay hard' } },
          ] } },
        ] } },
      ],
    },
  }

  const svg = await satori(tree, { width: 1080, height: 810, fonts })
  return svg
}

export async function generatePngBuffer(svgString) {
  const sharp = (await import('sharp')).default
  return await sharp(Buffer.from(svgString)).png().toBuffer()
}
