import React, { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'

export default function Beneficiaries() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Main Table Area */}
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col transition-all duration-300`}>
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Beneficiaries</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="text" placeholder="Search name..." className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Filter size={16} /> Filters
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-xs uppercase text-slate-500 font-semibold">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">Family</th>
                <th className="px-6 py-4">Last Aid</th>
                <th className="px-6 py-4">Priority</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} onClick={() => setSelected(item)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">Ravi Kumar</td>
                  <td className="px-6 py-4 text-slate-600">Mumbai North</td>
                  <td className="px-6 py-4 text-slate-600">5</td>
                  <td className="px-6 py-4 text-slate-600">15 days ago</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item === 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item === 1 ? 'High (0.85)' : 'Low (0.32)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Drawer */}
      {selected && (
        <div className="w-96 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col animate-in slide-in-from-right-8">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Beneficiary Profile</h3>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <div className="p-6 flex-1 overflow-auto space-y-6">
            <div>
              <div className="text-2xl font-bold text-slate-800 mb-1">Ravi Kumar</div>
              <div className="text-sm text-slate-500">Mumbai North</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Monthly Income</div>
                <div className="font-semibold text-slate-800">₹8,000</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Family Size</div>
                <div className="font-semibold text-slate-800">5</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-800 mb-3">DSS Priority Analysis</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1"><span className="text-slate-600">Income Risk</span><span className="font-medium">High (0.4)</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-red-500 w-[80%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="text-slate-600">Time Urgency</span><span className="font-medium">Medium (0.2)</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 w-[40%]"></div></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <button className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">Mark Urgent</button>
              <button className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors">Add to Allocation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
