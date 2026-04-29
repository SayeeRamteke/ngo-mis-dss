import { useState } from 'react'
import { BrainCircuit, Play, Save, Activity, Loader2, AlertTriangle, TrendingUp, AlertOctagon, Cpu, Info } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import axios from 'axios'

export default function DSSPanel() {
  const [budgetChange, setBudgetChange] = useState(0)
  const [demandMultiplier, setDemandMultiplier] = useState(1.0)
  const [regionId, setRegionId] = useState(1)
  const [activeVolunteers, setActiveVolunteers] = useState(50)
  const [procurementEfficiency, setProcurementEfficiency] = useState(0.8)
  const [supplyDelayDays, setSupplyDelayDays] = useState(3)
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
        regionId: regionId,
        demandMultiplier: demandMultiplier,
        budgetChangePercent: budgetChange,
        activeVolunteers: activeVolunteers,
        procurementEfficiency: procurementEfficiency,
        supplyDelayDays: supplyDelayDays
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
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer shadow-sm mb-6"
              >
                <option value={1}>Mumbai North (Region 1)</option>
                <option value={2}>Pune Rural (Region 2)</option>
                <option value={3}>Nagpur Central (Region 3)</option>
              </select>

              <label className="block text-sm font-semibold text-slate-700 mb-2">Available Volunteers</label>
              <input 
                type="number" 
                min="0" 
                max="500" 
                value={activeVolunteers} 
                onChange={(e) => setActiveVolunteers(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm mb-6"
              />

              <label className="block text-sm font-semibold text-slate-700 mb-2">Procurement Efficiency (0.1 - 1.0)</label>
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.1"
                value={procurementEfficiency} 
                onChange={(e) => setProcurementEfficiency(parseFloat(e.target.value))}
                className="w-full accent-green-600 cursor-pointer"
              />
              <div className="mt-2 flex justify-between text-sm font-medium text-slate-500 mb-6">
                <span>0.1 (Poor)</span>
                <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 font-bold">{procurementEfficiency}</span>
                <span>1.0 (Perfect)</span>
              </div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">Supply Delay (Days)</label>
              <input 
                type="range" 
                min="0" 
                max="14" 
                step="1"
                value={supplyDelayDays} 
                onChange={(e) => setSupplyDelayDays(parseInt(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="mt-2 flex justify-between text-sm font-medium text-slate-500">
                <span>0 (Instant)</span>
                <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 font-bold">{supplyDelayDays} Days</span>
                <span>14 (Slow)</span>
              </div>
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
                <div className="flex gap-2">
                  <button onClick={() => alert("Display Logic: The engine runs a 30-day time-series loop. \n\n1. It tracks demand compounding daily. \n2. Procurement decisions are delayed by the Supply Delay. \n3. Volunteer count acts as a bottleneck on distribution efficiency. \n4. The system detects the root cause based on which constraint failed first (e.g. Budget vs Logistics).")} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-semibold text-sm">
                    <Info size={18} /> How it works
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:shadow-sm font-semibold transition-all text-sm">
                    <Save size={18} className="text-blue-500" /> Save Result
                  </button>
                </div>
              </div>

              {/* DIAGNOSTIC INSIGHTS */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/60 p-4 rounded-xl border shadow-sm">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">System Status</div>
                  <div className="flex items-center gap-2">
                    <Activity size={18} className={simResult.programStatus === 'stable' ? 'text-green-500' : 'text-amber-500'}/>
                    <span className="font-bold text-lg text-slate-800 capitalize">{simResult.programStatus}</span>
                  </div>
                </div>
                <div className="bg-white/60 p-4 rounded-xl border shadow-sm">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Shortage Trend</div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className={simResult.shortageTrend === 'increasing' ? 'text-red-500' : 'text-blue-500'}/>
                    <span className="font-bold text-lg text-slate-800 capitalize">{simResult.shortageTrend}</span>
                  </div>
                </div>
                {simResult.rootCause && (
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 shadow-sm col-span-2 flex items-start gap-3">
                    <AlertOctagon className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-red-800 mb-1">Root Cause: {simResult.rootCause}</div>
                      <div className="text-sm text-red-600 font-medium">{simResult.recommendation}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* TIMELINE CHART */}
              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><Cpu size={20} className="text-indigo-500"/> System Dynamics (30-Day Projection)</h3>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simResult.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="demand" stroke="#8b5cf6" strokeWidth={3} dot={false} name="Total Demand" />
                    <Line yAxisId="left" type="stepAfter" dataKey="stock" stroke="#10b981" strokeWidth={3} dot={false} name="Available Stock" />
                    <Line yAxisId="right" type="monotone" dataKey="shortage" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Shortage" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
