import { getState, saveState, isConfigured } from '../../../lib/reps-server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  if (!isConfigured) {
    return new Response(JSON.stringify({ error: 'Supabase non configuré' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const deviceId = request.nextUrl.searchParams.get('device_id')
  if (!deviceId) {
    return new Response(JSON.stringify({ error: 'device_id manquant' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const data = await getState(deviceId)
    return Response.json({ data })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function POST(request) {
  if (!isConfigured) {
    return new Response(JSON.stringify({ error: 'Supabase non configuré' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const body = await request.json()
    const deviceId = body.device_id
    const data = body.data
    if (!deviceId || !data) {
      return new Response(JSON.stringify({ error: 'device_id et data requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    await saveState(deviceId, data)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
