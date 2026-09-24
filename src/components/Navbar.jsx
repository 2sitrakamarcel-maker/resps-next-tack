"use client";

import React, { useState, useRef, useEffect } from 'react'
import { BicepsFlexed, ChartNoAxesGantt, ChartNoAxesCombined, CalendarRange, EllipsisVertical } from 'lucide-react'

const Navbar = ({ activeTab, onSelectTab, selectedDay }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const triggerRef = useRef(null)
  const isGroupActive = activeTab === 'Stats' || activeTab === 'Plan'

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus() }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const ids = ['menu-stats', 'menu-plan']
        const curr = document.activeElement?.id
        const idx = ids.indexOf(curr)
        const next = e.key === 'ArrowDown' ? (idx + 1) % 2 : (idx - 1 + 2) % 2
        document.getElementById(ids[next])?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => { if (open) setTimeout(() => document.getElementById('menu-stats')?.focus(), 0) }, [open])

  return (
    <nav className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4 min-h-[56px] sm:min-h-[60px]">
      <div className="bg-white text-[#9747FF] rounded-full px-3 sm:px-5 py-1.5 sm:py-2 flex items-center gap-1.5 font-black text-[11px] sm:text-sm shadow-md shrink-0 max-w-[38%] sm:max-w-none font-condensed">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
        <span className="whitespace-nowrap truncate">DAY : {selectedDay}</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button aria-label="Accueil" onClick={() => onSelectTab('Home')}
          className={`w-11 h-11 sm:w-auto sm:px-6 py-2 rounded-full flex items-center justify-center gap-2 font-bold text-sm whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-0 transition-all duration-200 cursor-pointer focus-visible:ring-2 ring-white ring-offset-2 ring-offset-[#9747FF] ${activeTab === 'Home' ? 'bg-white text-[#9747FF] shadow-md' : 'text-white hover:bg-white/10'}`}>
          <BicepsFlexed size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Home</span>
        </button>

        <div ref={ref} className="relative">
          <button ref={triggerRef} aria-haspopup="menu" aria-expanded={open} aria-controls="nav-stats-plan-menu"
            onClick={() => setOpen(v => !v)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(v => !v) } }}
            className={`w-11 h-11 sm:w-auto sm:px-5 py-2 rounded-full flex items-center justify-center font-bold text-sm whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-0 transition-all duration-200 cursor-pointer focus-visible:ring-2 ring-white ring-offset-2 ring-offset-[#9747FF] ${isGroupActive ? 'bg-white text-[#9747FF] shadow-md' : 'text-white hover:bg-white/10'}`}>
            <ChartNoAxesGantt size={18} aria-hidden="true" />
          </button>
          {open && (
            <div id="nav-stats-plan-menu" role="menu" aria-labelledby="nav-dropdown-trigger"
              className="absolute right-0 top-full mt-2 w-52 max-w-[calc(100vw-16px)] bg-white rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden">
              <button id="menu-stats" role="menuitem" tabIndex={0}
                onClick={() => { onSelectTab('Stats'); setOpen(false) }}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold hover:bg-[#9747FF]/8 focus:bg-[#9747FF]/12 focus:outline-none cursor-pointer ${activeTab === 'Stats' ? 'bg-[#9747FF]/10 text-[#9747FF]' : 'text-gray-700'}`}>
                <ChartNoAxesCombined size={16} aria-hidden="true" /> Statistiques
              </button>
              <button id="menu-plan" role="menuitem" tabIndex={-1}
                onClick={() => { onSelectTab('Plan'); setOpen(false) }}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold hover:bg-[#9747FF]/8 focus:bg-[#9747FF]/12 focus:outline-none cursor-pointer ${activeTab === 'Plan' ? 'bg-[#9747FF]/10 text-[#9747FF]' : 'text-gray-700'}`}>
                <CalendarRange size={16} aria-hidden="true" /> Plan
              </button>
            </div>
          )}
        </div>

        <button aria-label="Paramètres" onClick={() => onSelectTab('Params')}
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold transition-all duration-200 min-h-[44px] cursor-pointer focus-visible:ring-2 ring-white ring-offset-2 ring-offset-[#9747FF] ${activeTab === 'Params' ? 'bg-white text-[#9747FF] shadow-md' : 'text-white hover:bg-white/10'}`}>
          <EllipsisVertical size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

export default Navbar
