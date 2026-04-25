import React, { useState } from 'react'
import { BrainCircuit, Play, Save, ChevronRight, Activity, ArrowRight } from 'lucide-react'

export default function DSSPanel() {
  const [budgetChange, setBudgetChange] = useState(0)
  const [donationDrop, setDonationDrop] = useState(0)
  const [hasRun, setHasRun] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BrainCircuit className="text-blue-500" /> DSS Engine & Simulator
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Left Panel - Inputs */}
        <div className="col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Scenario Inputs</h2>
          
          <div className="space-y-8 flex-1 overflow-auto">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Budget Change (%)</label>
              <input 
                type="range" 
                min="-80" 
                max="50" 
                value={budgetChange} 
                onChange={(e) => setBudgetChange(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="mt-2 flex justify-between text-sm text-slate-500">
                <span>-80%</span>
                <span className={`font-bold ${budgetChange < 0 ? 'text-red-500' : 'text-green-500'}`}>{budgetChange > 0 ? '+' : ''}{budgetChange}%</span>
                <span>+50%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Donation Drop (%)</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={donationDrop} 
                onChange={(e) => setDonationDrop(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="mt-2 flex justify-between text-sm text-slate-500">
                <span>0%</span>
                <span className="font-bold text-amber-500">{donationDrop}%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2">Scenario Name</label>
              <input type="text" placeholder="e.g. Worst Case 2026" className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="pt-6 border-t mt-auto flex gap-3">
            <button 
              onClick={() => setHasRun(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Play size={18} /> Run Simulation
            </button>
          </div>
        </div>

        {/* Right Panel - Outputs */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
          {!hasRun ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <Activity size={48} className="mb-4 opacity-50" />
              <p className="text-lg">Configure parameters and run simulation</p>
            </div>
          ) : (
            <div className="p-8 flex flex-col h-full overflow-auto animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Simulation Results</h2>
                  <p className="text-slate-500 mt-1">Impact analysis for selected parameters</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                  <Save size={16} /> Save Result
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-red-50 border border-red-100 rounded-xl">
                  <div className="text-red-800 text-sm font-medium mb-2">Beneficiaries Impacted</div>
                  <div className="text-4xl font-bold text-red-600">
                    {Math.round((Math.abs(budgetChange) * 120) + (donationDrop * 45)).toLocaleString()}
                  </div>
                  <div className="mt-2 text-sm text-red-700">Will lose access to aid</div>
                </div>
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="text-amber-800 text-sm font-medium mb-2">Estimated Recovery</div>
                  <div className="text-4xl font-bold text-amber-600">
                    {Math.round(donationDrop * 1.5)} <span className="text-xl">Days</span>
                  </div>
                  <div className="mt-2 text-sm text-amber-700">To rebuild inventory levels</div>
                </div>
              </div>

              <h3 className="font-bold text-slate-800 mb-4">Programs at Risk</h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Program</th>
                      <th className="px-4 py-3 font-medium">Current Budget</th>
                      <th className="px-4 py-3 font-medium">New Budget</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-medium text-slate-800">Rural Education</td>
                      <td className="px-4 py-3 text-slate-600">₹400,000</td>
                      <td className="px-4 py-3 text-slate-600">₹{Math.round(400000 * (1 + budgetChange/100)).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {budgetChange < -40 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Critical Stop</span>
                        ) : budgetChange < -20 ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">At Risk</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Sustainable</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
