"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { parseSeries, sumSeries, getLastSeriesFor, getTargetFor } from '../utils/progression'
import { getPct } from '../utils/stats'

function SeriesInput({ value, onCommit }) {
  const [draft, setDraft] = useState(value)
  const ref = useRef(value)
  useEffect(() => { if (value !== ref.current) { setDraft(value); ref.current = value } }, [value])
  const handle = (e) => {
    const v = e.target.value
    if (v !== '' && !/^\d{0,3}$/.test(v)) return
    if (v !== '' && Number(v) > 999) return
    setDraft(v); ref.current = v; onCommit(v)
  }
  return (
    <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="-" value={draft} onChange={handle}
      className="w-full text-center py-2.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9747FF] min-h-[44px]" />
  )
}

const HomeView = ({ selectedDay, plans, todayReps, setTodayReps, history, setPlans }) => {
  const dayPlans = (plans[selectedDay] || []).filter(p => p.exercise.trim())
  const getSeries = (id, n) => {
    const v = todayReps?.[selectedDay]?.[id]
    if (Array.isArray(v)) return v.slice(0, n).concat(Array(n).fill('')).slice(0, n)
    if (v === '' || v == null) return Array(n).fill('')
    if (typeof v === 'string' && v.includes('-')) return v.split('-').map(s=>s.trim()).slice(0,n).concat(Array(n).fill('')).slice(0,n)
    return [String(v), ...Array(n-1).fill('')]
  }
  const pendingRef = useRef({})
  const commitRef = useRef(null)
  useEffect(() => () => { if(commitRef.current) clearTimeout(commitRef.current) }, [])
  const flush = useCallback(() => {
    const pending = pendingRef.current; pendingRef.current = {}
    const keys = Object.keys(pending); if (!keys.length) return
    setTodayReps(prev => {
      const dayPrev = prev[selectedDay] || {}; let changed=false; const nextDay={...dayPrev}
      for (const k of keys) { const v=pending[k]; if(JSON.stringify(nextDay[k])!==JSON.stringify(v)){ nextDay[k]=v; changed=true } }
      if(!changed) return prev; return {...prev, [selectedDay]: nextDay}
    })
  }, [selectedDay, setTodayReps])
  const setSeriesVal = useCallback((id, idx, value, n) => {
    const cur = getSeries(id, n); cur[idx]=value; pendingRef.current[id]=cur
    if(commitRef.current) clearTimeout(commitRef.current); commitRef.current=setTimeout(flush,250)
  }, [flush, todayReps, selectedDay])
  useEffect(() => { return () => flush() }, [selectedDay, flush])
  const updateWeight = (id, v) => {
    const num = v === '' ? 0 : Number(v)
    if (v !== '' && Number.isNaN(num)) return
    setPlans(prev => ({ ...prev, [selectedDay]: prev[selectedDay].map(it => it.id===id ? { ...it, weight: num } : it)}))
  }

  if (dayPlans.length === 0) {
    return (
      <div className="bg-blue-50 rounded-xl sm:rounded-2xl border-2 border-blue-200 p-6 sm:p-8 w-full max-w-4xl mx-auto my-2 sm:my-4 text-center">
        <p className="font-black text-blue-700 text-sm sm:text-base">💤 Jour de Repos — {selectedDay.toLowerCase()}</p>
        <p className="text-xs sm:text-sm text-blue-500 mt-1">Aucun exercice prévu. Récupération active.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 w-full max-w-4xl mx-auto my-2 sm:my-4">
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-[#9747FF] text-base sm:text-xl shrink-0">★</span>
          <h2 className="text-base sm:text-xl font-black text-gray-800 lowercase truncate">{selectedDay}</h2>
        </div>
        <div className="flex gap-2 sm:gap-4 text-[11px] sm:text-xs font-bold text-gray-400 tracking-wider shrink-0">
          <span className="hidden sm:inline">POIDS</span>
          <span>TARGET</span>
        </div>
      </div>

      <div className="space-y-3">
        {dayPlans.map((item) => {
          const n = item.series ?? 3
          const curArr = getSeries(item.id, n)
          const lastArr = getLastSeriesFor(selectedDay, item.id, history, n)
          const target = getTargetFor(lastArr, item)
          const curSum = sumSeries(curArr)
          const lastSum = lastArr ? sumSeries(lastArr) : 0
          const pct = curSum && lastSum ? getPct(curSum, lastSum) : null
          const isProgress = pct !== null && pct > 0
          const isRegress = pct !== null && pct < 0
          const curFilled = curArr.some(s => s !== '')
          return (
              <div key={item.id} className="flex flex-col gap-3 py-3 px-3 sm:px-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#FF47A3]/40 transition-colors duration-200">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-bold text-gray-800 text-sm sm:text-base block truncate">{item.exercise}</span>
                  {item.instruction && <span className="text-xs text-gray-400 block truncate">{item.instruction} · {item.repMin}-{item.repMax} reps · {item.method==='poids' ? 'poids' : 'reps'}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input type="text" inputMode="numeric" placeholder="kg" value={item.weight ?? 0} onChange={(e)=> updateWeight(item.id, e.target.value)}
                    className="w-20 text-center py-2 bg-white border border-gray-300 rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#9747FF] min-h-[44px]" />
                  <span className={`px-3 py-1.5 rounded-full text-xs font-black shrink-0 bg-gradient-to-r from-[#9747FF] to-[#FF47A3] text-white shadow-sm ${target.overload ? '!from-green-500 !to-emerald-600' : ''}`}>
                    {target.display}
                  </span>
                </div>
              </div>
              <div className="grid gap-2" style={{gridTemplateColumns: `repeat(${n},1fr)`}}>
                {Array.from({length:n}).map((_,idx)=> (
                  <SeriesInput key={idx} value={curArr[idx]} onCommit={(v)=> setSeriesVal(item.id, idx, v, n)} />
                ))}
              </div>
              {curFilled && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{curArr.filter(s=>s!=='').join('-') || '-'} total {curSum} reps</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${isProgress?'bg-green-100 text-green-700':isRegress?'bg-red-100 text-red-600':'bg-purple-100/60 text-purple-600'}`}>
                    last {lastArr ? lastArr.filter(s=>s!=='').join('-') : '-'} {pct!==null?`(${pct>0?'+':''}${pct.toFixed(0)}%)`:''}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default HomeView
