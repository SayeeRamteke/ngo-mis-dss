import React, { useState } from 'react'
import { BrainCircuit, Play, Save, Activity, Loader2, AlertTriangle, Package } from 'lucide-react'
import axios from 'axios'

export default function DSSPanel() {
  const [budgetChange, setBudgetChange] = useState(0)
  const [demandMultiplier, setDemandMultiplier] = useState(1.0)
  const [regionId, setRegionId] = useState(1)
  const [hasRun, setHasRun] = useState(false)
  const [loading, setLoading] = useState(false)
  const [simResult, setSimResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runSimulation = async () => {
    setLoading(true)
    setError(null)
    setHasRun(true)
    try {
      const response = await axios.post('http://localhost:8000/api/v1/dss/simulate', {
        regionId: 1, // default mock region for now
        demandMultiplier: demandMultiplier,
        budgetCutPercent: budgetChange < 0 ? Math.abs(budgetChange) : 0 // Handle budget cuts specifically
      })
      setSimResult(response.data)
    } catch (err) {
      console.error(err)
      setError("Failed to run simulation against backend.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-700 flex items-center gap-3">
          <BrainCircuit className="text-blue-500" size={32} /> DSS Engine & Simulator
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Left Panel - Inputs */}
        <div className="col-span-1 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 translate-x-10 -translate-y-10"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-6 bg-clip-text">Scenario Inputs</h2>
          
          <div className="space-y-8 flex-1 overflow-auto z-10">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Budget Change (%)</label>
              <input 
                type="range" 
                min="-80" 
                max="50" 
                value={budgetChange} 
                onChange={(e) => setBudgetChange(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="mt-2 flex justify-between text-sm font-medium text-slate-500">
                <span>-80%</span>
                <span className={`px-2 py-1 rounded-md ${budgetChange < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{budgetChange > 0 ? '+' : ''}{budgetChange}%</span>
                <span>+50%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Demand Multiplier (e.g. 1.5x)</label>
              <input 
                type="range" 
                min="0.5" 
                max="3.0" 
                step="0.1"
                value={demandMultiplier} 
                onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="mt-2 flex justify-between text-sm font-medium text-slate-500">
                <span>0.5x</span>
                <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 font-bold">{demandMultiplier}x</span>
                <span>3.0x</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/60">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Region</label>
              <select 
                value={regionId}
                onChange={(e) => setRegionId(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer shadow-sm"
              >
                <option value={1}>Mumbai North (Region 1)</option>
                <option value={2}>Pune Rural (Region 2)</option>
                <option value={3}>Nagpur Central (Region 3)</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200/60 mt-auto flex gap-3 z-10">
            <button 
              onClick={runSimulation}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />} 
              {loading ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Right Panel - Outputs */}
        <div className="col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 -translate-x-20 translate-y-20"></div>
          
          {!hasRun ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <div className="p-6 bg-slate-50/50 rounded-full mb-4 ring-1 ring-slate-100 shadow-sm">
                <Activity size={48} className="text-blue-300" />
              </div>
              <p className="text-lg font-medium text-slate-500">Configure parameters and run simulation</p>
            </div>
          ) : loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
              <p className="text-lg font-medium text-slate-600">Calculating projections...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
               <AlertTriangle size={48} className="mb-4" />
               <p className="text-lg font-medium">{error}</p>
            </div>
          ) : simResult ? (
            <div className="p-8 flex flex-col h-full overflow-auto animate-in fade-in zoom-in-95 duration-500 z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Simulation Results</h2>
                  <p className="text-slate-500 mt-1 font-medium">Impact analysis for Region 1</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:shadow-sm font-semibold transition-all">
                  <Save size={18} className="text-blue-500" /> Save Result
                </button>
              </div>

              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><Package size={20} className="text-indigo-500"/> Resource Impact</h3>
              <div className="grid grid-cols-2 gap-6 mb-8">
                {simResult.resourceSimulation.length > 0 ? simResult.resourceSimulation.map((r: any, i: number) => (
                    <div key={i} className={`p-6 border rounded-2xl shadow-sm bg-white/50 backdrop-blur-sm ${r.projected_shortage > 0 ? 'border-red-200' : 'border-green-200'}`}>
                      <div className="text-slate-800 text-sm font-bold uppercase tracking-wider mb-2">{r.resource}</div>
                      <div className={`text-4xl font-extrabold mb-2 ${r.projected_shortage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {r.projected_shortage > 0 ? `-${r.projected_shortage}` : 'OK'}
                      </div>
                      <div className="flex justify-between text-xs font-medium text-slate-500 bg-slate-50 rounded-lg p-2 mt-3">
                         <span>Stock: {r.current_stock}</span>
                         <span>Demand: {r.simulated_demand}</span>
                      </div>
                    </div>
                )) : <p className="text-slate-500 italic">No resource data available for this region.</p>}
              </div>

              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><Activity size={20} className="text-blue-500"/> Budget Impact</h3>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Program</th>
                      <th className="px-6 py-4 font-semibold">Original Budget</th>
                      <th className="px-6 py-4 font-semibold">Simulated Cut</th>
                      <th className="px-6 py-4 font-semibold">Deficit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {simResult.budgetImpact.length > 0 ? simResult.budgetImpact.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{p.program}</td>
                        <td className="px-6 py-4 font-medium text-slate-600">₹{p.original.toLocaleString()}</td>
                        <td className="px-6 py-4 font-medium text-slate-600">₹{p.after_cut.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          {p.deficit === 'Yes' ? (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold shadow-sm border border-red-200">Deficit Projected</span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold shadow-sm border border-green-200">Sustainable</span>
                          )}
                        </td>
                      </tr>
                    )) : <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500 italic">No programs found for this region.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
