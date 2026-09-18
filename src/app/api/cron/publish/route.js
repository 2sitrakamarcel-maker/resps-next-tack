import { getState, isConfigured } from '../../../../lib/reps-server'
import { buildSvg, buildCaption, generatePngBuffer } from '../../../../lib/image'

export const dynamic = 'force-dynamic'

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev sans secret
  const header = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
  const vercelCron = request.headers.get('x-vercel-cron') // Vercel Cron header
  if (vercelCron) return true // Vercel Cron trusted
  return header === secret
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }
  const url = new URL(request.url)
  const deviceId = url.searchParams.get('device_id') || process.env.PUBLISH_DEVICE_ID
  const dryRun = url.searchParams.get('dryRun') === '1' || url.searchParams.get('dry') === '1'

  if (!deviceId) {
    return new Response(JSON.stringify({ error: 'device_id manquant (query ?device_id= ou env PUBLISH_DEVICE_ID)' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  if (!isConfigured) {
    return new Response(JSON.stringify({ error: 'Supabase non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
  }
  const fbPageId = process.env.FB_PAGE_ID
  const fbToken = process.env.FB_PAGE_TOKEN
  if (!fbPageId || !fbToken) {
    return new Response(JSON.stringify({ error: 'FB_PAGE_ID / FB_PAGE_TOKEN manquant' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  let data
  try {
    data = await getState(deviceId)
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
  if (!data) {
    return new Response(JSON.stringify({ error: 'Aucune donnée pour ce device_id', deviceId }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  const caption = buildCaption(data, new Date())
  const svg = buildSvg(data, new Date())

  if (dryRun) {
    return new Response(JSON.stringify({ dryRun: true, deviceId, caption, svgLength: svg.length }), { headers: { 'Content-Type': 'application/json' } })
  }

  let pngBuffer
  try {
    pngBuffer = await generatePngBuffer(svg)
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Génération image échouée: ' + e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
  const isPng = pngBuffer.slice(0, 4).toString('hex') === '89504e47'
  if (!isPng) {
    return new Response(JSON.stringify({ error: 'sharp non installé — PNG non généré. Installe sharp (npm i sharp) pour publier.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  // Upload binaire vers /photos
  const form = new FormData()
  form.append('caption', caption)
  form.append('access_token', fbToken)
  // Node 18+ FormData needs Blob
  form.append('source', new Blob([pngBuffer], { type: 'image/png' }), 'reps-tracker.png')

  let fbData
  try {
    const fbRes = await fetch(`https://graph.facebook.com/v22.0/${fbPageId}/photos`, {
      method: 'POST',
      body: form,
    })
    fbData = await fbRes.json()
    if (!fbRes.ok) {
      return new Response(JSON.stringify({ error: 'Facebook API error', fbData, caption }), { status: 502, headers: { 'Content-Type': 'application/json' } })
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Fetch FB échoué: ' + e.message }), { status: 502, headers: { 'Content-Type': 'application/json' } })
  }

  console.log('✅ FB PHOTO PUBLIÉE:', fbData)
  return Response.json({ success: true, deviceId, caption, facebookPhotoId: fbData.id, postId: fbData.post_id || null, fbData })
}

// POST alias pour compatibilité n8n/webhook
export async function POST(request) {
  return GET(request)
}
