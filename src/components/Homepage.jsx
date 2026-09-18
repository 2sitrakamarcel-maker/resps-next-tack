"use client";

import React, { useState, useMemo, useEffect } from 'react'
import Navbar from './Navbar'
import HomeView from './HomeView'
import StatsView from './StatsView'
import PlanView from './PlanView'
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
    { id: 1, exercise: '', instruction: '' },
    { id: 2, exercise: '', instruction: '' },
  ],
  MARDI: [{ id: 1, exercise: '', instruction: '' }],
  MERCREDI: [{ id: 1, exercise: '', instruction: '' }],
  JEUDI: [{ id: 1, exercise: '', instruction: '' }],
  VENDREDI: [{ id: 1, exercise: '', instruction: '' }],
  SAMEDI: [{ id: 1, exercise: '', instruction: '' }],
  DIMANCHE: [{ id: 1, exercise: '', instruction: '' }],
}

const Homepage = () => {
  const [activeTab, setActiveTab] = useState('Home')
  const today = useMemo(() => getTodayName(), [])

  const [plans, setPlans] = useLocalStorage(STORAGE_PLANS, initialPlans)
  const [todayReps, setTodayReps] = useLocalStorage(STORAGE_REPS, {})
  const [history, setHistory] = useLocalStorage(STORAGE_HISTORY, {})
  const [storedWeek, setStoredWeek] = useLocalStorage(STORAGE_WEEK, '')
  const [weekNotice, setWeekNotice] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [restored, setRestored] = useState(false)

  // Restauration au montage depuis l'API (BFF) — le serveur gagne
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
          if (d.plans) setPlans(d.plans)
          if (d.todayReps) setTodayReps(d.todayReps)
          if (d.history) setHistory(d.history)
          if (d.week) setStoredWeek(d.week)
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-purple-50 via-white to-purple-100 p-0 sm:p-4 md:p-8 flex flex-col items-center">
      <div className="w-full sm:max-w-5xl border-0 sm:border-4 border-[#9747FF] rounded-none sm:rounded-[36px] overflow-hidden bg-white shadow-none sm:shadow-2xl flex flex-col min-h-[100dvh] sm:min-h-[85vh]">
        <header className="w-full bg-[#9747FF] sticky top-0 z-20">
          <Navbar activeTab={activeTab} onSelectTab={setActiveTab} selectedDay={today} />
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

        <main className="flex-1 p-3 sm:p-6 flex flex-col overflow-auto">
          {activeTab === 'Home' && (
            <HomeView selectedDay={today} plans={plans} todayReps={todayReps} setTodayReps={setTodayReps} history={history} />
          )}
          {activeTab === 'Stats' && (
            <StatsView plans={plans} todayReps={todayReps} history={history} selectedDay={today} onExport={exportJson} onImport={importJson} syncStatus={syncStatus} />
          )}
          {activeTab === 'Plan' && <PlanView today={today} plans={plans} setPlans={setPlans} />}
          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              onClick={publishNow}
              disabled={publishStatus.startsWith('loading')}
              className="px-4 py-2 rounded-xl bg-[#9747FF] text-white font-black text-sm hover:bg-[#7C3AED] disabled:opacity-50 min-h-[44px]"
            >
              {publishStatus.startsWith('loading') ? 'Publication...' : 'Publier maintenant (test FB image)'}
            </button>
            {publishStatus !== 'idle' && <p className="text-[11px] text-gray-500">{publishStatus}</p>}
            <a href={`/api/og-image?device_id=${typeof window !== 'undefined' ? (window.localStorage.getItem('reps-tracker:device_id') || '') : ''}`} target="_blank" rel="noreferrer" className="text-[11px] text-[#9747FF] underline">Aperçu image (og-image)</a>
          </div>
        </main>
      </div>

      <footer className="mt-3 sm:mt-6 text-center px-3 py-2">
        <h2 className="text-sm sm:text-2xl font-black text-gray-800 tracking-wider uppercase">
          &quot;OBJECTIF : SURCHARGE PROGRESSIVE&quot;
        </h2>
        {syncStatus === 'off' && (
          <p className="text-[11px] text-gray-400 mt-1">Sync serveur désactivé — renseigne SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env.local</p>
        )}
        {syncStatus === 'saved' && <p className="text-[11px] text-green-600 mt-1">✓ Synchronisé avec le serveur</p>}
        {syncStatus === 'error' && <p className="text-[11px] text-red-600 mt-1">Échec de la synchronisation au serveur</p>}
      </footer>
    </div>
  )
}

export default Homepage
