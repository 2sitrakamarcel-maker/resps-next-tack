"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Navbar from './Navbar'
import HomeView from './HomeView'
import StatsView from './StatsView'
import PlanView from './PlanView'
import ParamsView from './ParamsView'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getDeviceId } from '../lib/device'
import { getISOWeekKey, getPreviousSunday } from '../utils/week'

const STORAGE_PLANS = 'reps-tracker:plans-v1'
const STORAGE_REPS = 'reps-tracker:reps-v1'
const STORAGE_HISTORY = 'reps-tracker:history-v1'
const STORAGE_WEEK = 'reps-tracker:week-v1'

const getTodayName = () => {
  const daysMap = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
  return daysMap[new Date().getDay()]
}

const initialPlans = {
  LUNDI: [
    { id: 'lundi-1', exercise: 'Dips lestés (sac de sable)', instruction: '3 min pause', series: 4, repMin: 8, repMax: 12, weight: 5, method: 'poids' },
    { id: 'lundi-2', exercise: 'Tractions australiennes', instruction: 'Tempo négatif 4s', series: 4, repMin: 8, repMax: 12, weight: 0, method: 'reps' },
    { id: 'lundi-3', exercise: 'Pompes Déclinées', instruction: 'Haut pectoraux', series: 3, repMin: 10, repMax: 12, weight: 0, method: 'reps' },
    { id: 'lundi-4', exercise: 'Oiseau / Rear Delt Fly', instruction: 'Bouteilles', series: 3, repMin: 15, repMax: 15, weight: 3, method: 'reps' },
    { id: 'lundi-5', exercise: 'Enroulements de bassin', instruction: 'Abdos dynamiques', series: 3, repMin: 12, repMax: 20, weight: 0, method: 'reps' },
  ],
  MARDI: [
    { id: 'mardi-1', exercise: 'Fentes Bulgares', instruction: 'Pied arrière chaise', series: 3, repMin: 10, repMax: 12, weight: 0, method: 'reps' },
    { id: 'mardi-2', exercise: 'Squats sac lesté', instruction: '12-15 reps', series: 4, repMin: 12, repMax: 15, weight: 10, method: 'poids' },
    { id: 'mardi-3', exercise: 'Élévations Mollets Debout', instruction: 'Pause 2s sommet', series: 4, repMin: 20, repMax: 20, weight: 0, method: 'reps' },
    { id: 'mardi-4', exercise: 'Gainage Planche Dynamique', instruction: '45-60s', series: 3, repMin: 45, repMax: 60, weight: 0, method: 'reps' },
  ],
  MERCREDI: [],
  JEUDI: [
    { id: 'jeudi-1', exercise: 'Dips lestés (sac de sable)', instruction: '3 min pause', series: 4, repMin: 8, repMax: 12, weight: 5, method: 'poids' },
    { id: 'jeudi-2', exercise: 'Tractions australiennes', instruction: 'Tempo négatif 4s', series: 4, repMin: 8, repMax: 12, weight: 0, method: 'reps' },
    { id: 'jeudi-3', exercise: 'Pompes Déclinées', instruction: 'Haut pectoraux', series: 3, repMin: 10, repMax: 12, weight: 0, method: 'reps' },
    { id: 'jeudi-4', exercise: 'Oiseau / Rear Delt Fly', instruction: 'Bouteilles', series: 3, repMin: 15, repMax: 15, weight: 3, method: 'reps' },
    { id: 'jeudi-5', exercise: 'Enroulements de bassin', instruction: 'Abdos dynamiques', series: 3, repMin: 12, repMax: 20, weight: 0, method: 'reps' },
  ],
  VENDREDI: [
    { id: 'vendredi-1', exercise: 'Fentes Bulgares', instruction: 'Pied arrière chaise', series: 3, repMin: 10, repMax: 12, weight: 0, method: 'reps' },
    { id: 'vendredi-2', exercise: 'Squats sac lesté', instruction: '12-15 reps', series: 4, repMin: 12, repMax: 15, weight: 10, method: 'poids' },
    { id: 'vendredi-3', exercise: 'Élévations Mollets Debout', instruction: 'Pause 2s sommet', series: 4, repMin: 20, repMax: 20, weight: 0, method: 'reps' },
    { id: 'vendredi-4', exercise: 'Gainage Planche Dynamique', instruction: '45-60s', series: 3, repMin: 45, repMax: 60, weight: 0, method: 'reps' },
  ],
  SAMEDI: [],
  DIMANCHE: [],
}

const Homepage = () => {
  const [activeTab, setActiveTab] = useState('Home')
  const [today, setToday] = useState('')
  useEffect(() => { setToday(getTodayName()) }, [])

  const [plans, setPlans] = useLocalStorage(STORAGE_PLANS, initialPlans)
  const [todayReps, setTodayReps] = useLocalStorage(STORAGE_REPS, {})
  const [history, setHistory] = useLocalStorage(STORAGE_HISTORY, {})
  const [storedWeek, setStoredWeek] = useLocalStorage(STORAGE_WEEK, '')
  const [weekNotice, setWeekNotice] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [restored, setRestored] = useState(false)
  const hasEditedRef = useRef(false)
  const setPlansTracked = useCallback((updater) => { hasEditedRef.current = true; setPlans(updater) }, [setPlans])

  // Migration v1 -> v2: ajoute series/repMin/repMax/weight/method si manquant (Upper/Lower 50kg par défaut)
  useEffect(() => {
    const needs = Object.values(plans).some(list => Array.isArray(list) && list.some(it => it.series == null))
    if (!needs) return
    const migrated = {}
    for (const day of Object.keys(initialPlans)) {
      const list = plans[day] || []
      migrated[day] = list.map(it => ({
        id: String(it.id),
        exercise: it.exercise ?? '',
        instruction: it.instruction ?? '',
        series: it.series ?? (it.exercise ? 3 : 3),
        repMin: it.repMin ?? 8,
        repMax: it.repMax ?? 12,
        weight: it.weight ?? 0,
        method: it.method ?? 'reps',
      }))
    }
    // garde jours non prévus mais présents dans plans
    for (const day of Object.keys(plans)) if (!migrated[day]) migrated[day] = plans[day]
    setPlans(migrated)
  }, []) // run once

  // Restauration au montage depuis l'API — local-wins si édité avant fetch
  useEffect(() => {
    const deviceId = getDeviceId()
    if (!deviceId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/reps?device_id=${encodeURIComponent(deviceId)}`)
        if (cancelled) return
        if (res.status === 503) {
          setSyncStatus('off')
          return
        }
        if (!res.ok) return
        const json = await res.json()
        if (cancelled) return
        const d = json?.data
        if (d) {
          if (d.plans && !hasEditedRef.current) setPlans(d.plans)
          if (d.todayReps && !hasEditedRef.current) setTodayReps(d.todayReps)
          if (d.history && !hasEditedRef.current) setHistory(d.history)
          if (d.week && !hasEditedRef.current) setStoredWeek(d.week)
          setSyncStatus('saved')
        }
      } catch {
        if (!cancelled) setSyncStatus('error')
      } finally {
        if (!cancelled) setRestored(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setPlans, setTodayReps, setHistory, setStoredWeek])

  // Auto-save debounced vers l'API
  useEffect(() => {
    if (!restored) return
    const deviceId = getDeviceId()
    if (!deviceId) return
    const timeout = setTimeout(() => {
      fetch('/api/reps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, data: { plans, todayReps, history, week: storedWeek } }),
      })
        .then((res) => {
          if (res.status === 503) {
            setSyncStatus('off')
            return
          }
          if (!res.ok) throw new Error('save failed')
          setSyncStatus('saved')
        })
        .catch(() => setSyncStatus('error'))
    }, 800)
    return () => clearTimeout(timeout)
  }, [plans, todayReps, history, storedWeek, restored])

  useEffect(() => {
    const handleWeekCheck = () => {
      const currentWeek = getISOWeekKey(new Date())
      if (!storedWeek) {
        setStoredWeek(currentWeek)
        return
      }
      if (storedWeek === currentWeek) return
      const archiveDate = getPreviousSunday(new Date())
      setHistory((prev) => {
        if (Object.keys(todayReps).length === 0) return prev
        return { ...prev, [archiveDate]: todayReps }
      })
      setTodayReps({})
      setStoredWeek(currentWeek)
      setWeekNotice(true)
    }
    handleWeekCheck()
    window.addEventListener('focus', handleWeekCheck)
    return () => window.removeEventListener('focus', handleWeekCheck)
  }, [storedWeek, todayReps, setHistory, setTodayReps, setStoredWeek])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ plans, todayReps, history, week: storedWeek }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reps-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (parsed.plans) setPlans(parsed.plans)
        if (parsed.todayReps) setTodayReps(parsed.todayReps)
        if (parsed.history) setHistory(parsed.history)
        if (parsed.week) setStoredWeek(parsed.week)
      } catch {}
    }
    reader.readAsText(file)
  }

  const [ogDeviceId, setOgDeviceId] = useState('')
  useEffect(() => { setOgDeviceId(window.localStorage.getItem('reps-tracker:device_id') || '') }, [restored])

  const [publishStatus, setPublishStatus] = useState('idle')
  const publishNow = async () => {
    const deviceId = getDeviceId()
    if (!deviceId) return
    setPublishStatus('loading')
    try {
      const res = await fetch(`/api/cron/publish?device_id=${encodeURIComponent(deviceId)}&dryRun=0`, {
        headers: { 'x-cron-secret': 'f21cd3034bf4e77c669b85e711502766514cfa753e5da1f36ce7ca44ef895fd4' },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'publish failed')
      setPublishStatus('ok:' + (json.facebookPhotoId || json.postId || 'posted'))
      setTimeout(() => setPublishStatus('idle'), 4000)
    } catch (err) {
      setPublishStatus('error:' + err.message)
      setTimeout(() => setPublishStatus('idle'), 4000)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-purple-50 via-white to-purple-100 p-4 sm:p-4 md:p-8 flex flex-col items-center">
      <div className="w-full sm:max-w-5xl mx-auto border-0 sm:border-4 border-[#9747FF] rounded-none sm:rounded-[36px] overflow-hidden bg-white shadow-none sm:shadow-2xl flex flex-col min-h-[calc(100dvh-32px)] sm:min-h-[85vh]">
        <header className="w-full bg-[#9747FF] sticky top-0 z-20" suppressHydrationWarning>
          <Navbar activeTab={activeTab} onSelectTab={setActiveTab} selectedDay={today || 'LUNDI'} />
        </header>

        {weekNotice && (
          <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-2 bg-[#9747FF]/10 border-b border-[#9747FF]/30 text-[#9747FF]">
            <p className="text-xs sm:text-sm font-bold">Nouvelle semaine détectée — la semaine précédente a été archivée.</p>
            <button
              onClick={() => setWeekNotice(false)}
              aria-label="Fermer"
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-[#9747FF] font-black"
            >
              ✕
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 flex flex-col overflow-auto min-h-0">
          {!today ? (
            <div className="flex-1 flex items-center justify-center p-8 text-gray-400">Chargement...</div>
          ) : (
            <>
              {activeTab === 'Home' && (
                <HomeView selectedDay={today} plans={plans} todayReps={todayReps} setTodayReps={setTodayReps} history={history} setPlans={setPlansTracked} />
              )}
              {activeTab === 'Stats' && (
                <StatsView plans={plans} todayReps={todayReps} history={history} selectedDay={today} />
              )}
              {activeTab === 'Plan' && <PlanView today={today} plans={plans} setPlans={setPlansTracked} />}
              {activeTab === 'Params' && (
                <ParamsView onExport={exportJson} onImport={importJson} syncStatus={syncStatus} publishStatus={publishStatus} onPublish={publishNow} ogDeviceId={ogDeviceId} />
              )}
            </>
          )}
        </main>
      </div>

      <footer className="w-full max-w-5xl mx-auto text-center px-4 py-6 mt-auto border-t border-purple-100/50 bg-white/80 backdrop-blur">
        <p className="text-sm sm:text-base font-black tracking-[0.2em] text-gray-800 uppercase">stay hard</p>
      </footer>
    </div>
  )
}

export default Homepage
