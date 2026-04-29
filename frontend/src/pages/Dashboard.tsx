import React, { useEffect, useState } from 'react'
import { AlertCircle, ArrowUpRight, ArrowDownRight, Users, IndianRupee, Package, Activity, Plus } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'

export default function Dashboard() {
  const navigate = useNavigate()
  const [budgetData, setBudgetData] = useState<any>(null)
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [finRes, benRes, progRes, resRes] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/reports/finance'),
          axios.get('http://localhost:8000/api/v1/beneficiaries'),
          axios.get('http://localhost:8000/api/v1/reports/programs'),
          axios.get('http://localhost:8000/api/v1/reports/resources')
        ])
        setBudgetData(finRes.data)
        setBeneficiaries(benRes.data)
        setPrograms(progRes.data)
        setResources(resRes.data)
      } catch (e) {
        console.error("Failed to fetch dashboard data", e)
      }
    }
    fetchData()
  }, [])

  // Distribute Aid Modal State
  const [isAidModalOpen, setIsAidModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferData, setTransferData] = useState<any>(null)
  
  const [aidForm, setAidForm] = useState({
    region_id: '',
    program_id: '',
    beneficiary_id: '',
    resource_id: '',
    quantity_received: 1
  })

  // Filter by selected region
  const selectedRegionId = parseInt(aidForm.region_id) || null;
  
  const eligiblePrograms = programs.filter(p => !selectedRegionId || (p.region.includes("Mumbai") && selectedRegionId === 1) || (p.region.includes("Pune") && selectedRegionId === 2) || (p.region.includes("Nagpur") && selectedRegionId === 3) || p.region_id === selectedRegionId);
  
  const eligibleBeneficiaries = beneficiaries
    .filter(b => !selectedRegionId || b.location_id === selectedRegionId)
    .sort((a, b) => {
      const pA = a.priority_level === 'high' ? 3 : a.priority_level === 'medium' ? 2 : 1;
      const pB = b.priority_level === 'high' ? 3 : b.priority_level === 'medium' ? 2 : 1;
      return pB - pA;
    });

  const handleDistributeAid = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(`http://localhost:8000/api/v1/beneficiaries/${aidForm.beneficiary_id}/aid`, {
        program_id: parseInt(aidForm.program_id),
        resource_id: parseInt(aidForm.resource_id),
        quantity_received: aidForm.quantity_received,
        date_received: new Date().toISOString()
      })
      alert("Aid Distributed Successfully!")
      setIsAidModalOpen(false)
      setAidForm({ region_id: '', program_id: '', beneficiary_id: '', resource_id: '', quantity_received: 1 })
    } catch (err: any) {
      console.error(err)
      if(err.response?.data?.detail) {
        alert("Error: " + err.response.data.detail)
      } else {
        alert("Failed to distribute aid")
      }
    }
  }

  const handleTransfer = async () => {
    if(!transferData) return;
    try {
      await axios.post('http://localhost:8000/api/v1/resources/transfer', {
        resource_id: transferData.resource_id,
        from_region_id: transferData.from_region_id,
        to_region_id: transferData.to_region_id,
        quantity: transferData.quantity,
        notes: "Dashboard Quick Transfer"
      })
      alert("Transfer Executed Successfully!")
      setIsTransferModalOpen(false)
      setTransferData(null)
      // Refresh Data
      const resRes = await axios.get('http://localhost:8000/api/v1/reports/resources')
      setResources(resRes.data)
    } catch(err: any) {
      alert("Failed to transfer: " + (err.response?.data?.detail || ""))
    }
  }

  // Calculate some derived metrics
  const activeProgramsCount = programs.filter(p => p.status === 'active').length
  const lowStockCount = resources.filter(r => r.quantity_available < 100).length
  const inventoryStatus = resources.length > 0 ? Math.round(((resources.length - lowStockCount) / resources.length) * 100) : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-700 tracking-tight">Command Center</h1>
        <button onClick={() => setIsAidModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
          <Plus size={18} /> Distribute Aid
        </button>
      </div>
      
      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Beneficiaries', value: beneficiaries.length.toString(), icon: <Users size={24} className="text-blue-500"/> },
          { label: 'Funds Available', value: budgetData ? `₹${(budgetData.total_budget_allocated - budgetData.total_expenses).toLocaleString()}` : '₹0', icon: <IndianRupee size={24} className="text-emerald-500"/> },
          { label: 'Inventory Health', value: `${inventoryStatus}%`, icon: <Package size={24} className="text-indigo-500"/> },
          { label: 'Active Programs', value: activeProgramsCount.toString(), icon: <Activity size={24} className="text-purple-500"/> }
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 bg-slate-50 rounded-full p-8 opacity-50 group-hover:scale-110 transition-transform duration-500 ease-out">
              {kpi.icon}
            </div>
            <h3 className="text-sm font-semibold text-slate-500 mb-2">{kpi.label}</h3>
            <div className="text-3xl font-black text-slate-800">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Alert Feed */}
        <div className="col-span-1 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm h-[500px] overflow-y-auto relative">
          <div className="sticky top-0 bg-white/90 backdrop-blur pb-4 mb-4 border-b border-slate-100 z-10">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <AlertCircle className="text-red-500" /> Critical Alerts
            </h2>
          </div>
          <div className="space-y-4">
            {lowStockCount > 0 ? resources.filter(r => r.quantity_available < 100).map((r, i) => (
              <div key={i} className="p-4 border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-white rounded-r-xl shadow-sm">
                <div className="font-bold text-red-900 flex items-center justify-between">
                  {r.region} Shortage
                  <span className="text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">New</span>
                </div>
                <div className="text-sm text-red-700/80 mb-3 mt-1 font-medium">{r.resource} stock is critically low ({r.quantity_available} units left).</div>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/resources', { state: { filterResourceId: r.resource_id } })} className="text-xs font-bold bg-slate-800 text-white px-5 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm w-full text-center">Manage Resource ➔</button>
                </div>
              </div>
            )) : (
               <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">No critical alerts at this time. All systems nominal.</div>
            )}
          </div>
        </div>

        {/* Region Status */}
        <div className="col-span-2 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 translate-x-20 -translate-y-20"></div>
          
          <h2 className="text-lg font-bold mb-6 text-slate-800 flex items-center justify-between">
            Region Inventory Status
            <button className="text-sm text-blue-600 font-semibold hover:text-blue-800">View Map →</button>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500 bg-slate-50/50">
                  <th className="p-4 font-semibold rounded-tl-lg">Region</th>
                  <th className="p-4 font-semibold">Resource</th>
                  <th className="p-4 font-semibold">Available</th>
                  <th className="p-4 font-semibold rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {resources.length > 0 ? resources.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{r.region}</td>
                    <td className="p-4 text-slate-600 font-medium">{r.resource}</td>
                    <td className="p-4 text-slate-600 font-medium">{r.quantity_available} units</td>
                    <td className="p-4">
                      {r.quantity_available < 100 ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold shadow-sm border border-red-200 flex items-center gap-1 w-max"><ArrowDownRight size={14}/> Shortage</span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold shadow-sm border border-green-200 flex items-center gap-1 w-max"><ArrowUpRight size={14}/> Surplus</span>
                      )}
                    </td>
                  </tr>
                )) : <tr><td colSpan={4} className="p-4 text-center text-slate-500 italic">No region data available.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Global Distribute Aid Modal */}
      <Modal isOpen={isAidModalOpen} onClose={() => setIsAidModalOpen(false)} title="Quick Action: Distribute Aid">
        <form onSubmit={handleDistributeAid} className="space-y-5">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-2">
            <h4 className="font-bold text-slate-800 text-sm mb-1">Step 1: Select Region</h4>
            <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white" value={aidForm.region_id} onChange={e => setAidForm({...aidForm, region_id: e.target.value, program_id: '', beneficiary_id: ''})}>
              <option value="" disabled>Select a Region...</option>
              <option value="1">Region 1 (Mumbai)</option>
              <option value="2">Region 2 (Pune)</option>
              <option value="3">Region 3 (Nagpur)</option>
            </select>
          </div>

          <div className={`p-4 border rounded-xl mb-2 transition-all ${aidForm.region_id ? 'bg-blue-50 border-blue-200' : 'bg-slate-100 border-slate-200 opacity-50'}`}>
            <h4 className="font-bold text-blue-800 text-sm mb-1">Step 2: Select Program</h4>
            <select required disabled={!aidForm.region_id} className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-slate-100" value={aidForm.program_id} onChange={e => setAidForm({...aidForm, program_id: e.target.value})}>
              <option value="" disabled>Select a Program...</option>
              {eligiblePrograms.map((p:any, i:number) => (
                <option key={i} value={p.program_id || i+1}>{p.program_name} ({p.region})</option>
              ))}
            </select>
          </div>

          <div className={`p-4 border rounded-xl transition-all ${aidForm.region_id ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 opacity-50'}`}>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Step 3: Select Beneficiary</h4>
            <p className="text-xs text-slate-500 mb-3">Filtered by region. High priority beneficiaries are auto-suggested first.</p>
            <select required disabled={!aidForm.region_id} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-slate-100" value={aidForm.beneficiary_id} onChange={e => setAidForm({...aidForm, beneficiary_id: e.target.value})}>
              <option value="" disabled>Select a Beneficiary...</option>
              {eligibleBeneficiaries.map(b => (
                <option key={b.beneficiary_id} value={b.beneficiary_id}>
                  {b.priority_level === 'high' ? '🔥 ' : ''}{b.full_name} ({b.priority_level.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Step 4: Resource</label>
              <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" value={aidForm.resource_id} onChange={e => setAidForm({...aidForm, resource_id: e.target.value})}>
                <option value="" disabled>Select Resource...</option>
                {/* Fallback to index mapping if resource_id is missing from reports endpoint */}
                {resources.map((r:any, i:number) => <option key={i} value={r.resource_id || i+1}>{r.resource}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Quantity</label>
              <input required type="number" step="0.1" min="0.1" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" value={aidForm.quantity_received} onChange={e => setAidForm({...aidForm, quantity_received: parseFloat(e.target.value)})} />
            </div>
          </div>

          <button type="submit" disabled={!aidForm.program_id || !aidForm.beneficiary_id || !aidForm.resource_id} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 mt-6">
            Confirm & Save Mapping
          </button>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Execute Resource Transfer">
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <h4 className="font-bold text-indigo-900 mb-2">Transfer Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-slate-500 mb-1 text-xs font-bold">From Region ID</label>
                <input type="number" className="w-full px-3 py-2 border rounded" value={transferData?.from_region_id || ''} onChange={e => setTransferData({...transferData, from_region_id: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 text-xs font-bold">To Region ID</label>
                <input type="number" className="w-full px-3 py-2 border rounded" value={transferData?.to_region_id || ''} onChange={e => setTransferData({...transferData, to_region_id: parseInt(e.target.value)})} />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-500 mb-1 text-xs font-bold">Quantity</label>
                <input type="number" className="w-full px-3 py-2 border rounded" value={transferData?.quantity || ''} onChange={e => setTransferData({...transferData, quantity: parseFloat(e.target.value)})} />
              </div>
            </div>
          </div>
          <button onClick={handleTransfer} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md">Confirm Transfer</button>
        </div>
      </Modal>
    </div>
  )
}
