"use client";

import { useSyncExternalStore, useCallback } from 'react'

const cache = new Map() // key -> { raw, value }
const listenersByKey = new Map() // key -> Set<callback>
const pendingNotifyKeys = new Set()
let notifyScheduled = false

function subscribeForKey(key, callback) {
  let set = listenersByKey.get(key)
  if (!set) { set = new Set(); listenersByKey.set(key, set) }
  set.add(callback)
  const onStorage = (e) => {
    if (e.key === null || e.key === key) callback()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    set.delete(callback)
    if (set.size === 0) listenersByKey.delete(key)
    window.removeEventListener('storage', onStorage)
  }
}

function readValue(key, initialValue) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : initialValue
  } catch {
    return initialValue
  }
}

function getSnapshot(key, initialValue) {
  try {
    const raw = window.localStorage.getItem(key)
    const entry = cache.get(key)
    if (entry && entry.raw === raw) return entry.value
    const parsed = raw !== null ? JSON.parse(raw) : initialValue
    cache.set(key, { raw, value: parsed })
    return parsed
  } catch {
    return initialValue
  }
}

function setSnapshot(key, nextValue, raw) {
  cache.set(key, { raw: raw ?? JSON.stringify(nextValue), value: nextValue })
}

function notifyKey(key) {
  pendingNotifyKeys.add(key)
  if (notifyScheduled) return
  notifyScheduled = true
  queueMicrotask(() => {
    notifyScheduled = false
    for (const k of pendingNotifyKeys) {
      const set = listenersByKey.get(k)
      if (!set) continue
      for (const cb of set) cb()
    }
    pendingNotifyKeys.clear()
  })
}

export function useLocalStorage(key, initialValue) {
  const value = useSyncExternalStore(
    (cb) => subscribeForKey(key, cb),
    () => getSnapshot(key, initialValue),
    () => initialValue
  )

  const setValue = useCallback(
    (next) => {
      const current = cache.get(key)?.value ?? initialValue
      const resolved = typeof next === 'function' ? next(current) : next
      const raw = JSON.stringify(resolved)
      try {
        window.localStorage.setItem(key, raw)
      } catch {}
      setSnapshot(key, resolved, raw)
      notifyKey(key)
    },
    [key, initialValue]
  )

  return [value, setValue]
}
