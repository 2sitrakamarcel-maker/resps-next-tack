import fs from 'node:fs'
import path from 'node:path'
export const dynamic = 'force-dynamic'
export async function GET() {
  const cwd = process.cwd()
  const base = path.join(cwd, 'public', 'fonts')
  const bcPath = path.join(base, 'BarlowCondensed-Black.ttf')
  const bPath = path.join(base, 'Barlow-Bold.ttf')
  const bcTmp = path.join('/tmp', 'BarlowCondensed-Black.ttf')
  const bTmp = path.join('/tmp', 'Barlow-Bold.ttf')
  const info = {
    cwd,
    bcPath, bcExists: fs.existsSync(bcPath), bcSize: fs.existsSync(bcPath) ? fs.statSync(bcPath).size : 0,
    bPath, bExists: fs.existsSync(bPath), bSize: fs.existsSync(bPath) ? fs.statSync(bPath).size : 0,
    bcTmpExists: fs.existsSync(bcTmp), bTmpExists: fs.existsSync(bTmp),
    publicExists: fs.existsSync(path.join(cwd, 'public')),
    fontsDir: fs.existsSync(base) ? fs.readdirSync(base) : null,
  }
  // try getFontCss
  let fontCssLen = 0
  let fontCssPreview = ''
  try { const { buildSvg } = await import('../../../lib/image.js'); const svg = buildSvg({plans:{LUNDI:[{id:'1',exercise:'Test',instruction:'',series:4,repMin:8,repMax:12,weight:5,method:'poids'}]},todayReps:{LUNDI:{'1':['10','10','9','8']}},history:{}}, new Date()); fontCssLen = svg.length; fontCssPreview = svg.slice(0,1200) } catch(e){ fontCssPreview = String(e.message).slice(0,500) }
  return Response.json({ ...info, fontCssLen, fontCssPreview: fontCssPreview.slice(0,800) })
}
