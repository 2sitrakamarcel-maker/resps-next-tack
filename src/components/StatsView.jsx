"use client";

import React, { useMemo, useState } from 'react'
import { DAYS_ORDER, calcDayStats, calcGlobalStats } from '../utils/stats'

const StatsView = ({ plans, todayReps, history, selectedDay, onExport, onImport, syncStatus }) => {
  const [showParJour, setShowParJour] = useState(true)
  const global = useMemo(() => calcGlobalStats(plans, todayReps, history), [plans, todayReps, history])

  const dayStatsMap = useMemo(() => {
    const map = {}
    DAYS_ORDER.forEach((day) => {
      map[day] = calcDayStats(day, plans, todayReps, history)
    })
    return map
  }, [plans, todayReps, history])

  const currentDay = dayStatsMap[selectedDay]

  const pctColor = (pct) => {
    if (pct === null) return 'text-gray-400'
    if (pct > 0) return 'text-green-600'
    if (pct < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const pctBg = (pct) => {
    if (pct === null) return 'bg-gray-100 text-gray-500'
    if (pct > 0) return 'bg-green-100 text-green-700'
    if (pct < 0) return 'bg-red-100 text-red-600'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-6 w-full max-w-4xl mx-auto my-1 sm:my-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-purple-600 text-base sm:text-xl shrink-0">📊</span>
          <h2 className="text-sm sm:text-xl font-bold text-gray-800 uppercase truncate">Statistiques</h2>
        </div>
        <span className="text-[11px] sm:text-xs font-bold text-purple-600 bg-purple-100 py-1 px-2 sm:px-3 rounded-full shrink-0">
          {selectedDay}
        </span>
      </div>

      {/* 2 cartes surcharge */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-purple-50/60 p-4 sm:p-5 rounded-xl border border-purple-100 text-center">
          <span className="text-[11px] sm:text-xs text-gray-500 font-semibold block">SURCHARGE MOY.</span>
          <span className={`text-2xl sm:text-3xl font-black mt-1 block ${pctColor(global.globalPctAvg)}`}>
            {global.globalPctAvg !== null ? `${global.globalPctAvg > 0 ? '+' : ''}${global.globalPctAvg.toFixed(1)}%` : '-'}
          </span>
          <span className="text-[11px] text-gray-400">moy. tous exos ({global.pctCount})</span>
        </div>
        <div className="bg-purple-50/60 p-4 sm:p-5 rounded-xl border border-purple-100 text-center">
          <span className="text-[11px] sm:text-xs text-gray-500 font-semibold block">SURCHARGE — {selectedDay}</span>
          <span className={`text-2xl sm:text-3xl font-black mt-1 block ${pctColor(currentDay.dayPct)}`}>
            {currentDay.dayPct !== null ? `${currentDay.dayPct > 0 ? '+' : ''}${currentDay.dayPct.toFixed(1)}%` : '-'}
          </span>
          <span className="text-[11px] text-gray-400">{currentDay.filled}/{currentDay.total} exos aujourd&apos;hui</span>
        </div>
      </div>

      {/* Par jour + toggle */}
      <button onClick={() => setShowParJour(v=>!v)} className={`self-start text-[11px] font-black px-3 py-1.5 rounded-full border ${showParJour ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
        {showParJour ? 'Par jour : ON' : 'Par jour : OFF — aujourd’hui seul'}
      </button>
      {showParJour && <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-3 sm:px-4 py-2 border-b border-gray-200 flex justify-between items-center">
          <span className="text-xs sm:text-sm font-black text-gray-700 uppercase">Par jour</span>
          <span className="text-[11px] text-gray-400">vs last week</span>
        </div>
        <div className="divide-y divide-gray-100 max-h-[28vh] overflow-y-auto">
          {DAYS_ORDER.map((day) => {
            const ds = dayStatsMap[day]
            const isToday = day === selectedDay
            const isRest = ds.total === 0
            return (
              <div key={day} className={`flex items-center justify-between px-3 sm:px-4 py-2.5 ${isRest ? 'bg-blue-50/50' : isToday ? 'bg-purple-50/60' : 'bg-white'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRest ? 'bg-blue-400' : isToday ? 'bg-[#9747FF]' : 'bg-gray-300'}`} />
                  <span className={`text-xs sm:text-sm font-bold truncate ${isRest ? 'text-blue-700' : isToday ? 'text-[#9747FF]' : 'text-gray-700'}`}>{day}</span>
                  {isRest ? <span className="text-[11px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">REPOS</span> : ds.total > 0 && <span className="text-[11px] text-gray-400 hidden sm:inline">· {ds.filled}/{ds.total} exos</span>}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {!isRest && <span className="text-xs text-gray-500 hidden sm:inline">
                    {ds.curTotal} vs {ds.lastTotal || '-'}
                  </span>}
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${isRest ? 'bg-blue-100 text-blue-700' : pctBg(ds.dayPct)}`}>
                    {isRest ? '💤' : ds.dayPct !== null ? `${ds.dayPct > 0 ? '+' : ''}${ds.dayPct.toFixed(1)}%` : '-'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>}
      {/* Détail exercices du jour sélectionné */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-3 sm:px-4 py-2 border-b border-gray-200">
          <span className="text-xs sm:text-sm font-black text-gray-700 uppercase">Détail — {selectedDay}</span>
        </div>
        {currentDay.total === 0 ? (
          <div className="p-4 text-center text-sm text-blue-600 bg-blue-50">💤 Jour de Repos — récup active, bien mérité !</div>
        ) : currentDay.perExo.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">Aucun exercice planifié. Va dans Plan.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentDay.perExo.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between px-3 sm:px-4 py-2.5 gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-bold text-gray-800 block truncate">{ex.exercise}</span>
                  {ex.instruction && <span className="text-[11px] text-gray-400 block truncate">{ex.instruction}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-600 font-medium">
                    {ex.cur || '-'} <span className="text-gray-300">/</span> {ex.last}
                  </span>
                  <span className={`text-xs font-black px-2 py-1 rounded-full min-w-[60px] text-center ${pctBg(ex.pct)}`}>
                    {ex.pct !== null ? `${ex.pct > 0 ? '+' : ''}${ex.pct.toFixed(1)}%` : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExport}
            className="py-3 rounded-xl bg-white border border-gray-200 font-bold text-sm hover:bg-gray-50 min-h-[44px]"
          >
            Export JSON
          </button>
          <label className="py-3 rounded-xl bg-white border border-gray-200 font-bold text-sm hover:bg-gray-50 min-h-[44px] flex items-center justify-center cursor-pointer">
            Import JSON
            <input type="file" accept=".json" onChange={onImport} className="hidden" />
          </label>
        </div>
        {syncStatus === 'off' && (
          <p className="text-[11px] text-gray-400 text-center">Sync serveur désactivé — renseigne SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY pour exporter vers le serveur</p>
        )}
        {syncStatus === 'saved' && <p className="text-[11px] text-green-600 text-center">✓ Synchronisé avec le serveur (device_id sans auth)</p>}
        {syncStatus === 'error' && <p className="text-[11px] text-red-600 text-center">Échec de la synchronisation au serveur</p>}
        <div className="text-center py-3 sm:py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 px-3">
          <p className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wide">&quot;OBJECTIF : SURCHARGE PROGRESSIVE&quot;</p>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-1">Consistez, progressez, répétez.</p>
        </div>
      </div>
    </div>
  )
}

export default StatsView
