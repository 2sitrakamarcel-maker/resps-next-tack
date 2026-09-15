"use client";

import React from 'react'

const Navbar = ({ activeTab, onSelectTab, selectedDay }) => {
  const tabs = ['Home', 'Stats', 'Plan']

  return (
    <nav className="w-full px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
      <div className="bg-white text-[#9747FF] rounded-full px-3 sm:px-5 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm shadow-md shrink-0">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
        <span className="whitespace-nowrap">DAY : {selectedDay}</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none flex-1 justify-end -mr-1 pr-1 scroll-smooth">
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`px-3.5 sm:px-6 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap shrink-0 min-h-[36px] sm:min-h-0 transition-all duration-300 ${
                isActive
                  ? 'bg-white text-[#9747FF] shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default Navbar
