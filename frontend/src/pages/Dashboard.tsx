import React from 'react'
import { AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Command Center</h1>
      
      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {['Total Beneficiaries', 'Funds Available', 'Inventory Status', 'Active Programs'].map((kpi, i) => (
          <div key={kpi} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">{kpi}</h3>
            <div className="text-3xl font-bold text-slate-800">
              {i === 0 ? '12,450' : i === 1 ? '₹4.2M' : i === 2 ? '84%' : '18'}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Alert Feed */}
        <div className="col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[500px] overflow-y-auto">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <AlertCircle className="text-red-500" /> Critical Alerts
          </h2>
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                <div className="font-semibold text-red-800">Region B Shortage</div>
                <div className="text-sm text-red-600 mb-2">Demand exceeds supply by 500 units.</div>
                <button className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Reallocate</button>
              </div>
            ))}
          </div>
        </div>

        {/* Region Status */}
        <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-slate-800">Region Status</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="pb-3 font-medium">Region</th>
                <th className="pb-3 font-medium">Demand</th>
                <th className="pb-3 font-medium">Supply</th>
                <th className="pb-3 font-medium">Gap</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-100">
                <td className="py-3 font-medium text-slate-800">Mumbai North</td>
                <td className="py-3 text-slate-600">1200</td>
                <td className="py-3 text-slate-600">1400</td>
                <td className="py-3 text-green-600 font-semibold flex items-center gap-1">+200 <ArrowUpRight size={14}/></td>
                <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Surplus</span></td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 font-medium text-slate-800">Pune Rural</td>
                <td className="py-3 text-slate-600">950</td>
                <td className="py-3 text-slate-600">400</td>
                <td className="py-3 text-red-600 font-semibold flex items-center gap-1">-550 <ArrowDownRight size={14}/></td>
                <td className="py-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Shortage</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
