"use client";

import React from 'react'

const DAYS_ORDER = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']

const PlanView = ({ today, plans, setPlans }) => {
  const updateField = (day, id, field, value) => {
    setPlans((prev) => ({
      ...prev,
      [day]: prev[day].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))
  }

  const addExercise = (day) => {
    setPlans((prev) => ({
      ...prev,
      [day]: [...prev[day], { id: crypto.randomUUID(), exercise: '', instruction: '' }],
    }))
  }

  const removeExercise = (day, id) => {
    setPlans((prev) => ({
      ...prev,
      [day]: prev[day].filter((item) => item.id !== id),
    }))
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-1 sm:my-2 max-h-[calc(100dvh-160px)] sm:max-h-[60vh] overflow-y-auto pr-1 sm:pr-2 space-y-4 sm:space-y-6">
      {DAYS_ORDER.map((day) => {
        const isToday = day === today
        return (
          <div
            key={day}
            className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 space-y-3 sm:space-y-4 transition-all ${
              isToday ? 'border-[#9747FF] bg-purple-50/40 shadow-md' : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className={`text-base sm:text-xl shrink-0 ${isToday ? 'text-[#9747FF]' : 'text-gray-300'}`}>★</span>
                <h3 className="font-black text-gray-800 lowercase tracking-wide text-sm sm:text-base truncate">{day}</h3>
                {isToday && (
                  <span className="bg-[#9747FF] text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0">
                    Aujourd&apos;hui
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-gray-400 shrink-0">instructions</span>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {plans[day]?.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-2 sm:gap-3">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="exercice"
                      value={item.exercise}
                      onChange={(e) => updateField(day, item.id, 'exercise', e.target.value)}
                      className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9747FF] focus:border-transparent min-h-[44px]"
                    />
                    <button
                      onClick={() => removeExercise(day, item.id)}
                      aria-label="Supprimer"
                      className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 active:scale-95 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="instructions"
                    value={item.instruction}
                    onChange={(e) => updateField(day, item.id, 'instruction', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9747FF] focus:border-transparent min-h-[44px]"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => addExercise(day)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-500 hover:border-[#9747FF] hover:text-[#9747FF] hover:bg-purple-50/50 active:scale-[0.99] transition-all min-h-[44px]"
            >
              + Ajouter un exercice
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default PlanView
