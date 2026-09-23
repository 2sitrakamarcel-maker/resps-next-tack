"use client";

export default function ParamsView({ onExport, onImport, syncStatus, publishStatus, onPublish, ogDeviceId }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 w-full max-w-4xl mx-auto my-2 sm:my-4 flex flex-col gap-4">
      <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-black text-[#0F172A] font-condensed tracking-wide">Paramètres</h2>
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${syncStatus==='saved'?'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/20':syncStatus==='error'?'bg-red-100 text-red-600':'bg-gray-100 text-gray-500'}`}>{syncStatus}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onExport} className="py-3 rounded-xl bg-white border border-gray-200 font-bold text-sm hover:bg-gray-50 hover:border-[#FF47A3]/30 transition-colors duration-200 min-h-[44px] cursor-pointer">Export JSON</button>
        <label className="py-3 rounded-xl bg-white border border-gray-200 font-bold text-sm hover:bg-gray-50 hover:border-[#FF47A3]/30 transition-colors duration-200 min-h-[44px] flex items-center justify-center cursor-pointer">Import JSON<input type="file" accept=".json" onChange={onImport} className="hidden" /></label>
      </div>
      {syncStatus === 'off' && <p className="text-[11px] text-gray-400 text-center">Sync serveur désactivé — renseigne SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY</p>}
      {syncStatus === 'saved' && <p className="text-[11px] text-green-600 text-center">✓ Synchronisé avec le serveur (device_id sans auth)</p>}
      {syncStatus === 'error' && <p className="text-[11px] text-red-600 text-center">Échec de la synchronisation au serveur</p>}
      <div className="pt-3 border-t border-gray-100 flex flex-col items-center gap-2">
        <button onClick={onPublish} disabled={publishStatus.startsWith('loading')} className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#9747FF] to-[#FF47A3] text-white font-black text-sm shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200 disabled:opacity-50 min-h-[44px] cursor-pointer">{publishStatus.startsWith('loading')?'Publication...':'Publier maintenant (test FB image)'}</button>
        {publishStatus!=='idle' && <p className="text-[11px] text-gray-500">{publishStatus}</p>}
        <a href={`/api/og-image?device_id=${ogDeviceId}`} target="_blank" rel="noreferrer" className="text-[11px] text-[#FF47A3] underline hover:text-[#9747FF] transition-colors">Aperçu image (og-image)</a>
      </div>
    </div>
  )
}
