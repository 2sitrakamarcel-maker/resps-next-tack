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
        LUNDI: [
          { id: '1', exercise: 'Dips lestés', instruction: '3 min pause', series: 4, repMin: 8, repMax: 12, weight: 5, method: 'poids' },
          { id: '2', exercise: 'Pompes Déclinées', instruction: '', series: 3, repMin: 10, repMax: 12, weight: 0, method: 'reps' },
        ],
        MARDI: [{ id: '1', exercise: 'Squats sac lesté', instruction: '', series: 4, repMin: 12, repMax: 15, weight: 10, method: 'poids' }],
        MERCREDI: [], JEUDI: [], VENDREDI: [], SAMEDI: [], DIMANCHE: []
      },
      todayReps: { LUNDI: { '1': ['10','10','9','8'], '2': ['11','11','10'] }, MARDI: { '1': ['12','12','12','12'] } },
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
