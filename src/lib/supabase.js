export const isSupabaseConfigured = false

export async function getSupabase() {
  return null
}

export async function getDeviceId() {
  if (typeof window === 'undefined') return null
  const key = 'reps-tracker:device_id'
  let id = window.localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(key, id)
  }
  return id
}