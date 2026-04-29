import React, { useEffect, useState } from 'react'
import { Package, Search, Plus, ArrowRightLeft, UploadCloud } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'

export default function Resources() {
  const [stocks, setStocks] = useState<any[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  
  // Add Form State
  const [formData, setFormData] = useState({
    resource_name: '',
    category: 'Food',
    resource_type: 'consumable',
    unit_of_measure: 'kg',
    initial_quantity: 0,
    region_id: 1
  })

  // CSV Upload State
  const [file, setFile] = useState<File | null>(null)

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/reports/resources')
      setStocks(res.data)
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
      fetchData() // Refresh data
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
      fetchData() // Refresh data
    } catch (err) {
      console.error(err)
      alert("Failed to upload CSV")
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">
      <div className={`bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl flex-1 flex flex-col transition-all duration-300 relative overflow-hidden`}>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10"></div>
        
        <div className="p-8 border-b border-white/40 flex justify-between items-center z-10">
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-700 flex items-center gap-2">
            <Package size={28} className="text-teal-500" /> Resource Inventory
          </h2>
          <div className="flex gap-3">
            <button onClick={() => setIsCsvModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:shadow-md transition-all shadow-sm">
              <UploadCloud size={16} /> Bulk Upload CSV
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all">
              <Plus size={16} /> Add Resource
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto z-10 p-2">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-20 shadow-sm rounded-lg">
              <tr className="text-xs uppercase text-slate-500 font-bold tracking-wider">
                <th className="px-6 py-4 rounded-tl-lg rounded-bl-lg">Resource Name</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">Available Quantity</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {stocks.length > 0 ? stocks.map((item, i) => (
                <tr key={i} className="bg-white/50 hover:bg-white shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group rounded-xl">
                  <td className="px-6 py-4 font-bold text-slate-800 rounded-tl-xl rounded-bl-xl border-y border-l border-white/60">{item.resource}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium border-y border-white/60">{item.region}</td>
                  <td className="px-6 py-4 font-bold text-teal-700 border-y border-white/60">{item.quantity_available} units</td>
                  <td className="px-6 py-4 rounded-tr-xl rounded-br-xl border-y border-r border-white/60">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.quantity_available < 100 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.quantity_available < 100 ? 'Low Stock' : 'Healthy'}
                    </span>
                  </td>
                </tr>
              )) : (
                 <tr><td colSpan={4} className="text-center py-10 text-slate-500 italic">No resources found in inventory.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Resource">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Resource Name</label>
            <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" value={formData.resource_name} onChange={e => setFormData({...formData, resource_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Food">Food</option>
                <option value="Medical">Medical</option>
                <option value="Clothing">Clothing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" value={formData.resource_type} onChange={e => setFormData({...formData, resource_type: e.target.value})}>
                <option value="consumable">Consumable</option>
                <option value="reusable">Reusable</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measure</label>
              <input required type="text" placeholder="e.g. kg, boxes" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" value={formData.unit_of_measure} onChange={e => setFormData({...formData, unit_of_measure: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Initial Quantity</label>
              <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" value={formData.initial_quantity} onChange={e => setFormData({...formData, initial_quantity: parseFloat(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Region ID</label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" value={formData.region_id} onChange={e => setFormData({...formData, region_id: parseInt(e.target.value)})}>
                <option value={1}>Mumbai North (1)</option>
                <option value={2}>Pune Rural (2)</option>
                <option value={3}>Nagpur Central (3)</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors mt-6">
            Save Resource
          </button>
        </form>
      </Modal>

      <Modal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} title="Upload CSV">
        <form onSubmit={handleCsvSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
            <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-sm text-slate-600 mb-4">Upload a CSV file containing your resources data. Expected columns: name, category, type, unit</p>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
          </div>
          <button type="submit" disabled={!file} className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors disabled:opacity-50">
            Upload & Process
          </button>
        </form>
      </Modal>
    </div>
  )
}
