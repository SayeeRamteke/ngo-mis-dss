import React, { useEffect, useState } from 'react'
import { Package, Search, Plus, UploadCloud, AlertTriangle, CheckCircle, Clock, BarChart3, Activity } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import Modal from '../components/Modal'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Resources() {
  const [stocks, setStocks] = useState<any[]>([])
  const [insights, setInsights] = useState<any>(null)
  
  const location = useLocation()
  const filterResourceId = location.state?.filterResourceId
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  
  // Modals Data
  const [transferData, setTransferData] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    resource_name: '',
    category: 'food',
    resource_type: 'consumable',
    unit_of_measure: 'kg',
    initial_quantity: 0,
    minimum_threshold: 0,
    maximum_threshold: 0,
    region_id: 1
  })

  const fetchData = async () => {
    try {
      const [stockRes, insightRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/reports/resources'),
        axios.get('http://localhost:8000/api/v1/reports/resource-insights')
      ])
      setStocks(stockRes.data)
      setInsights(insightRes.data)
    } catch (e) {
      console.error("Failed to fetch resources", e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/api/v1/resources/', formData)
      setIsAddModalOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert("Failed to add resource")
    }
  }

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return;
    const data = new FormData()
    data.append("file", file)
    try {
      const res = await axios.post('http://localhost:8000/api/v1/upload/resources', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert(`Imported ${res.data.imported} resources!`)
      setIsCsvModalOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert("Failed to upload CSV")
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
        notes: "DSS Suggested Transfer"
      })
      alert("Transfer Approved & Executed!")
      setIsTransferModalOpen(false)
      setTransferData(null)
      fetchData()
    } catch(err: any) {
      alert("Failed to transfer: " + (err.response?.data?.detail || ""))
    }
  }

  // Aggregate Data for Graphs
  let regionChart: any = {}
  stocks.forEach(s => {
    regionChart[s.region] = (regionChart[s.region] || 0) + s.quantity_available
  })
  const barData = Object.keys(regionChart).map(k => ({ region: k, total: regionChart[k] }))

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12 h-[calc(100vh-8rem)] overflow-y-auto">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-700 flex items-center gap-3">
          <Package size={32} className="text-teal-500" /> Resource Intelligence
        </h2>
        <div className="flex gap-3">
          <button onClick={() => setIsCsvModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <UploadCloud size={16} /> Bulk Upload
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all">
            <Plus size={16} /> Add Resource
          </button>
        </div>
      </div>

      {/* LAYER A: TOP KPI BAR */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-slate-100 rounded-xl text-slate-600"><Package size={24}/></div>
          <div>
            <div className="text-sm font-bold text-slate-500">Total Categories</div>
            <div className="text-2xl font-black text-slate-800">{insights?.kpis?.total_types || 0}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-100 rounded-xl text-red-600"><AlertTriangle size={24}/></div>
          <div>
            <div className="text-sm font-bold text-slate-500">Low Stock Alerts</div>
            <div className="text-2xl font-black text-red-600">{insights?.kpis?.low_stock || 0}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-100 rounded-xl text-amber-600"><Clock size={24}/></div>
          <div>
            <div className="text-sm font-bold text-slate-500">Expiring Soon</div>
            <div className="text-2xl font-black text-amber-600">{insights?.kpis?.expiring_soon || 0}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-100 rounded-xl text-green-600"><CheckCircle size={24}/></div>
          <div>
            <div className="text-sm font-bold text-slate-500">Surplus Regions</div>
            <div className="text-2xl font-black text-green-600">{insights?.kpis?.surplus || 0}</div>
          </div>
        </div>
      </div>

      {/* LAYER B: DSS INSIGHTS CARDS (Only shown when Managing a specific resource from Dashboard) */}
      {filterResourceId && insights?.dss_cards && Array.isArray(insights.dss_cards) && (
        <div className="bg-slate-800 rounded-3xl p-6 shadow-lg text-white">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Activity className="text-teal-400"/> Actionable Intelligence for Selected Resource</h3>
          <div className="grid grid-cols-2 gap-4">
            {insights.dss_cards.filter((c:any) => c.resource_id === filterResourceId).map((card: any, idx: number) => (
              <div key={idx} className={`p-4 rounded-xl border ${card.type === 'transfer' ? 'bg-indigo-900/50 border-indigo-500/30' : card.type === 'buy' ? 'bg-fuchsia-900/30 border-fuchsia-500/30' : card.type === 'shortage' ? 'bg-red-900/30 border-red-500/30' : card.type === 'expiry' ? 'bg-amber-900/30 border-amber-500/30' : 'bg-green-900/30 border-green-500/30'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className={`text-xs font-bold uppercase tracking-wider ${card.type === 'transfer' ? 'text-indigo-400' : card.type === 'buy' ? 'text-fuchsia-400' : card.type === 'shortage' ? 'text-red-400' : card.type === 'expiry' ? 'text-amber-400' : 'text-green-400'}`}>
                    {card.type === 'buy' ? 'Restock / Buy' : card.type}
                  </div>
                </div>
                <div className="text-sm font-medium mb-4">{card.message}</div>
                {card.type === 'transfer' && (
                  <button onClick={() => { setTransferData(card); setIsTransferModalOpen(true); }} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-bold transition-colors">
                    Approve Transfer
                  </button>
                )}
                {card.type === 'buy' && (
                  <button onClick={() => { alert("Admin Approval Required: Purchase Order sent to Admin.") }} className="w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-500 rounded text-sm font-bold transition-colors">
                    Approve Purchase
                  </button>
                )}
              </div>
            ))}
            {insights.dss_cards.filter((c:any) => c.resource_id === filterResourceId).length === 0 && (
              <div className="col-span-2 text-slate-400 italic">No automated actions available for this resource.</div>
            )}
          </div>
        </div>
      )}

      {/* LAYER C: GRAPHS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-blue-500"/> Total Stock by Region</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="total" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LAYER D: ENHANCED TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Inventory Master List</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" placeholder="Search inventory..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {stocks && stocks.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{item?.resource || "Unknown"}</td>
                  <td className="px-6 py-4 text-slate-600">{item?.region || "Unknown"}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{item?.quantity_available || 0}</td>
                  <td className="px-6 py-4">
                     {insights?.dss_cards?.find((c:any) => c.type==='shortage' && c.resource_id === item?.resource_id && c.region_id === item?.region_id) ? (
                       <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Shortage</span>
                     ) : insights?.dss_cards?.find((c:any) => c.type==='surplus' && c.resource_id === item?.resource_id && c.region_id === item?.region_id) ? (
                       <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Surplus</span>
                     ) : (
                       <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">Normal</span>
                     )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => {
                        const match = insights?.dss_cards?.find((c:any) => c.type === 'transfer' && c.resource_id === item?.resource_id && c.to_region_id === item?.region_id);
                        setTransferData({resource_id: item?.resource_id, from_region_id: match ? match.from_region_id : (item?.region_id === 1 ? 2 : 1), to_region_id: item?.region_id, quantity: match ? match.quantity : 0})
                        setIsTransferModalOpen(true)
                    }} className="text-blue-600 font-bold text-xs hover:text-blue-800 px-3 py-1 bg-blue-50 rounded mr-2">Transfer</button>
                    <button className="text-slate-500 font-bold text-xs hover:text-red-600 px-3 py-1 bg-slate-100 hover:bg-red-50 rounded">Mark Expired</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
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
          <button onClick={handleTransfer} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Confirm Transfer</button>
        </div>
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Resource">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Resource Name</label>
            <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={formData.resource_name} onChange={e => setFormData({...formData, resource_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Threshold</label>
              <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={formData.minimum_threshold} onChange={e => setFormData({...formData, minimum_threshold: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Threshold</label>
              <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={formData.maximum_threshold} onChange={e => setFormData({...formData, maximum_threshold: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Initial Qty</label>
              <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={formData.initial_quantity} onChange={e => setFormData({...formData, initial_quantity: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region ID</label>
              <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={formData.region_id} onChange={e => setFormData({...formData, region_id: parseInt(e.target.value)})} />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-teal-600 text-white rounded-lg font-bold">Save</button>
        </form>
      </Modal>

      <Modal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} title="Upload CSV">
        <form onSubmit={handleCsvSubmit} className="space-y-4">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="w-full" />
          <button type="submit" disabled={!file} className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-bold">Upload</button>
        </form>
      </Modal>
    </div>
  )
}
