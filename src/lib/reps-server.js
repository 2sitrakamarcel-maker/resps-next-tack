import 'server-only'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const isConfigured = Boolean(url && serviceRoleKey)

let client = null

function getClient() {
  if (!isConfigured) return null
  if (!client) client = createClient(url, serviceRoleKey)
  return client
}

export async function getState(deviceId) {
  const db = getClient()
  if (!db) return null
  const { data, error } = await db
    .from('reps_data')
    .select('data')
    .eq('device_id', deviceId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.data ?? null
}

export async function saveState(deviceId, data) {
  const db = getClient()
  if (!db) return null
  const { error } = await db.from('reps_data').upsert({
    device_id: deviceId,
    data,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  return true
}