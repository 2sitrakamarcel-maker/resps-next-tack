"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getLastFor, getPct } from '../utils/stats'

function RepInput({ value, onCommit }) {
  const [draft, setDraft] = useState(value)
  const committedRef = useRef(value)
  useEffect(() => {
    if (value !== committedRef.current) {
      setDraft(value)
      committedRef.current = value
    }
  }, [value])
  const handleChange = (e) => {
    const v = e.target.value
    if (v !== '' && !/^\d{0,3}$/.test(v)) return
    if (v !== '' && Number(v) > 999) return
    setDraft(v)
    committedRef.current = v
    onCommit(v)
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder="-"
      value={draft}
      onChange={handleChange}
      className="flex-1 sm:flex-none sm:w-20 text-center py-2.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9747FF] min-h-[44px]"
    />
  )
}

const HomeView = ({ selectedDay, plans, todayReps, setTodayReps, history }) => {
  const dayPlans = plans[selectedDay] || []

  const getRep = (id) => String(todayReps?.[selectedDay]?.[id] ?? '')
  const commitRef = useRef(null)
  const pendingRef = useRef({})

  useEffect(() => {
    return () => { if (commitRef.current) clearTimeout(commitRef.current) }
  }, [])

  const flush = useCallback(() => {
    const pending = pendingRef.current
    pendingRef.current = {}
    const keys = Object.keys(pending)
    if (keys.length === 0) return
    setTodayReps((prev) => {
      const dayPrev = prev[selectedDay] || {}
      let changed = false
      const nextDay = { ...dayPrev }
      for (const k of keys) {
        const v = pending[k]
        if (nextDay[k] !== v) { nextDay[k] = v; changed = true }
      }
      if (!changed) return prev
      return { ...prev, [selectedDay]: nextDay }
    })
  }, [selectedDay, setTodayReps])

  const setRep = useCallback((id, value) => {
    pendingRef.current[id] = value
    if (commitRef.current) clearTimeout(commitRef.current)
    commitRef.current = setTimeout(flush, 250)
  }, [flush])

  // flush on day switch/unmount
  useEffect(() => { return () => { flush() } }, [selectedDay, flush])

  if (dayPlans.length === 0 || dayPlans.every((p) => !p.exercise.trim())) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-200 p-6 sm:p-8 w-full max-w-4xl mx-auto my-2 sm:my-4 text-center">
        <p className="font-bold text-gray-500 text-sm sm:text-base">Aucun exercice planifié pour {selectedDay.toLowerCase()}.</p>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Va dans Plan pour ajouter tes exos — ils apparaîtront ici.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-6 w-full max-w-4xl mx-auto my-1 sm:my-4">
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-[#9747FF] text-base sm:text-xl shrink-0">★</span>
          <h2 className="text-base sm:text-xl font-black text-gray-800 lowercase truncate">{selectedDay}</h2>
        </div>
        <div className="flex gap-4 sm:gap-12 text-[11px] sm:text-xs font-bold text-gray-400 tracking-wider shrink-0">
          <span>TODAY&apos;S REPS</span>
          <span>LAST WEEK</span>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {dayPlans
          .filter((p) => p.exercise.trim())
          .map((item) => {
            const cur = getRep(item.id)
            const last = getLastFor(selectedDay, item.id, history)
            const pct = cur !== '' && last !== '-' ? getPct(cur, last) : null
            const isProgress = pct !== null && pct > 0
            const isRegress = pct !== null && pct < 0
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 sm:gap-3 py-3 px-3 sm:px-4 bg-gray-50/50 rounded-xl border border-gray-100"
              >
                <div className="min-w-0">
                  <span className="font-bold text-gray-800 text-sm sm:text-base block truncate">{item.exercise}</span>
                  {item.instruction && <span className="text-xs text-gray-400 block truncate">{item.instruction}</span>}
                </div>
                <div className="flex items-center justify-between gap-2 sm:gap-8">
                  <RepInput value={cur} onCommit={(v) => setRep(item.id, v)} />
                  <span
                    className={`w-20 sm:w-24 text-center text-xs sm:text-sm font-bold py-2 sm:py-1.5 px-2 sm:px-3 rounded-lg shrink-0 ${
                      isProgress ? 'bg-green-100 text-green-700' : isRegress ? 'bg-red-100 text-red-600' : 'bg-purple-100/60 text-purple-600'
                    }`}
                  >
                    {last} {pct !== null ? `(${pct > 0 ? '+' : ''}${pct.toFixed(0)}%)` : ''}
                  </span>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default HomeView
