import { getState, isConfigured } from '../../../lib/reps-server'
import { buildSvg, generatePngBuffer } from '../../../lib/image'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const deviceId = request.nextUrl.searchParams.get('device_id') || process.env.PUBLISH_DEVICE_ID
  let data = null
  if (deviceId && isConfigured) {
    try {
      data = await getState(deviceId)
    } catch {}
  }
  // fallback demo data si pas de Supabase/device
  if (!data) {
    data = {
      plans: {
        LUNDI: [{ id: 1, exercise: 'Pompes', instruction: '3x12' }, { id: 2, exercise: 'Squats', instruction: '' }],
        MARDI: [{ id: 1, exercise: 'Tractions', instruction: '' }],
        MERCREDI: [], JEUDI: [], VENDREDI: [], SAMEDI: [], DIMANCHE: []
      },
      todayReps: { LUNDI: { 1: '42', 2: '30' }, MARDI: { 1: '15' } },
      history: {},
    }
  }
  const svg = buildSvg(data, new Date())
  const buf = await generatePngBuffer(svg)
  const isPng = buf.slice(0, 4).toString('hex') === '89504e47' // PNG magic
  return new Response(buf, {
    headers: {
      'Content-Type': isPng ? 'image/png' : 'image/svg+xml',
      'Cache-Control': 'no-store',
      'Content-Length': String(buf.length),
    },
  })
}
