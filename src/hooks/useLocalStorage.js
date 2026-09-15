"use client";

import { useSyncExternalStore, useCallback } from 'react'

const cache = new Map()
const listeners = new Set()

function subscribe(callback) {
  listeners.add(callback)
  window.addEventListener('storage', callback)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', callback)
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
  const parsed = readValue(key, initialValue)
  const id = JSON.stringify(parsed)
  const entry = cache.get(key)
  if (!entry || entry.id !== id) {
    cache.set(key, { id, value: parsed })
  }
  return cache.get(key).value
}

function setSnapshot(key, nextValue) {
  cache.set(key, { id: JSON.stringify(nextValue), value: nextValue })
}

function notify() {
  for (const listener of listeners) listener()
}

export function useLocalStorage(key, initialValue) {
  const value = useSyncExternalStore(
    subscribe,
    () => getSnapshot(key, initialValue),
    () => initialValue
  )

  const setValue = useCallback(
    (next) => {
      const current = cache.get(key)?.value ?? initialValue
      const resolved = typeof next === 'function' ? next(current) : next
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved))
        setSnapshot(key, resolved)
        notify()
      } catch {}
    },
    [key, initialValue]
  )

  return [value, setValue]
}