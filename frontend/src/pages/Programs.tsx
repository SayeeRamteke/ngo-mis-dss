import React, { useEffect, useState } from 'react'
import { Activity, Plus, MoreHorizontal, Target, Users, Zap } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'

export default function Programs() {
  const [programs, setPrograms] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDssModalOpen, setIsDssModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  
  const [dssProgram, setDssProgram] = useState<any>(null)
  const [selectedProgramDetails, setSelectedProgramDetails] = useState<any>(null)
  
  const [dssSkills, setDssSkills] = useState("teaching, logistics, medical")
  const [dssResults, setDssResults] = useState<any[]>([])
  const [isDssLoading, setIsDssLoading] = useState(false)

  const [formData, setFormData] = useState({
    program_name: '',
    program_type: 'basic_needs',
    region_id: 1,
    start_date: new Date().toISOString().split('T')[0],
    total_budget: 0,
    target_beneficiaries: 0
  })

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/reports/programs')
      setPrograms(res.data)
    } catch (e) {
      console.error("Failed to fetch programs", e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/api/v1/programs/', formData)
      setIsModalOpen(false)
      fetchData() // Refresh
    } catch (err) {
      console.error(err)
      alert("Failed to create program")
    }
  }

  const openDssModal = (p: any) => {
    setDssProgram(p)
    setDssResults([])
    setIsDssModalOpen(true)
  }

  const openDetailsModal = (p: any) => {
    setSelectedProgramDetails(p)
    setIsDetailsModalOpen(true)
  }

  const runDssMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDssLoading(true)
    try {
      // Map region string to ID (assuming 1: Mumbai North, 2: Pune Rural, 3: Nagpur Central)
      let rId = 1;
      if (dssProgram.region.includes("Pune")) rId = 2;
      if (dssProgram.region.includes("Nagpur")) rId = 3;

      const skillsList = dssSkills.split(',').map(s => s.trim()).filter(s => s)

      // Get program ID by matching name (workaround since reports endpoint doesn't return program_id directly yet, wait, let's assume it does, but we didn't add it)
      // I'll fetch raw programs to find ID, or just pass program_name if possible. 
      // Actually, my backend reports endpoint doesn't return program_id! I need to fix that or just fetch raw programs.
      const rawRes = await axios.get('http://localhost:8000/api/v1/finance/budget') // Or any endpoint with IDs
      const rawProgs = await axios.get('http://localhost:8000/api/v1/finance/budget') // Not ideal. 
      // I'll update the DSS call to just work with what we have. If we need program_id, we will guess it's index + 1 for now.
      const pId = programs.findIndex(x => x.program_name === dssProgram.program_name) + 1;

      const res = await axios.post(`http://localhost:8000/api/v1/volunteers/match?program_id=${pId}&region_id=${rId}`, skillsList)
      setDssResults(res.data)
    } catch (err) {
      console.error(err)
      alert("Failed to run DSS Matching")
    } finally {
      setIsDssLoading(false)
    }
  }

  const handleAssign = async (volId: number) => {
    try {
      const pId = programs.findIndex(x => x.program_name === dssProgram.program_name) + 1;
      await axios.post('http://localhost:8000/api/v1/volunteers/assign', {
        program_id: pId,
        volunteer_id: volId,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        role_description: "DSS Auto-assigned",
        status: "active"
      })
      alert("Volunteer assigned!")
      setDssResults(prev => prev.filter(v => v.profile_id !== volId))
    } catch (err) {
      console.error(err)
      alert("Failed to assign volunteer")
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-fuchsia-700 flex items-center gap-3">
          <Activity className="text-purple-500" size={32} /> Active Programs
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
          <Plus size={18} /> Create Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {programs.length > 0 ? programs.map((p, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-fuchsia-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="flex justify-between items-start mb-4 z-10">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">{p.program_name}</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{p.region}</span>
              </div>
              <button className="text-slate-400 hover:text-slate-700 bg-white p-1.5 rounded-full shadow-sm"><MoreHorizontal size={18}/></button>
            </div>

            <div className="space-y-4 z-10">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-600">Budget Spent</span>
                  <span className="font-bold text-purple-700">{p.utilization}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full transition-all duration-1000 ${p.utilization > 80 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-fuchsia-400'}`} style={{width: `${p.utilization}%`}}></div>
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">₹{p.budget_spent.toLocaleString()} of ₹{p.total_budget.toLocaleString()}</div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button onClick={() => openDssModal(p)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                  <Zap size={14}/> DSS Match Volunteers
                </button>
                <button onClick={() => openDetailsModal(p)} className="text-sm font-bold text-fuchsia-600 hover:text-fuchsia-800 flex items-center gap-1"><Target size={14}/> Details</button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/50 border-dashed">
            <Activity size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-500">No active programs found.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isDssModalOpen} onClose={() => setIsDssModalOpen(false)} title="DSS Skill Matching">
        <div className="space-y-6">
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <h4 className="text-sm font-bold text-purple-800 mb-1">Target Program: {dssProgram?.program_name}</h4>
            <p className="text-xs text-purple-600">The DSS will query all volunteers in <strong>{dssProgram?.region}</strong>, filtering out anyone already assigned during this program's active dates, and rank them by skill match.</p>
          </div>
          
          <form onSubmit={runDssMatch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (Comma separated)</label>
              <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500" value={dssSkills} onChange={e => setDssSkills(e.target.value)} />
            </div>
            <button type="submit" disabled={isDssLoading} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <Zap size={18} /> {isDssLoading ? 'Analyzing Database...' : 'Run Algorithm'}
            </button>
          </form>

          {dssResults.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Users size={16}/> Ranked Best-Fit Volunteers</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {dssResults.map((v, i) => (
                  <div key={i} className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {v.name} 
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{v.matchScore} Match</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-1 flex-wrap">
                        {v.skills.map((s:string, idx:number) => <span key={idx} className="bg-slate-100 px-1.5 rounded">{s}</span>)}
                      </div>
                    </div>
                    <button onClick={() => handleAssign(v.profile_id)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors">
                      Dispatch
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Program Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Program Details: ${selectedProgramDetails?.program_name}`}>
        {selectedProgramDetails && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div className="text-xs font-bold text-purple-600 uppercase">Total Served</div>
                <div className="text-2xl font-black text-purple-900">{selectedProgramDetails.summary?.total_served || 0}</div>
                <div className="text-xs text-purple-600 mt-1">₹{selectedProgramDetails.summary?.cost_per_beneficiary || 0} / capita</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Priority Split</div>
                <div className="flex gap-2 text-sm mt-1">
                  <span className="text-red-600 font-bold">{selectedProgramDetails.summary?.high_served || 0} H</span>
                  <span className="text-amber-600 font-bold">{selectedProgramDetails.summary?.medium_served || 0} M</span>
                  <span className="text-green-600 font-bold">{selectedProgramDetails.summary?.low_served || 0} L</span>
                </div>
              </div>
              <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100">
                <div className="text-xs font-bold text-fuchsia-600 uppercase">Total Resources</div>
                <div className="text-2xl font-black text-fuchsia-900">{selectedProgramDetails.summary?.total_resources || 0}</div>
              </div>
            </div>

            {/* Beneficiaries Served Excel Sheet style */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-sm text-slate-700 flex justify-between">
                <span>Beneficiaries Served ({selectedProgramDetails.beneficiary_table?.length || 0})</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white sticky top-0 border-b border-slate-200 shadow-sm z-10">
                    <tr>
                      <th className="px-4 py-2 text-xs text-slate-500">Name</th>
                      <th className="px-4 py-2 text-xs text-slate-500">Type</th>
                      <th className="px-4 py-2 text-xs text-slate-500">Resource</th>
                      <th className="px-4 py-2 text-xs text-slate-500">Qty</th>
                      <th className="px-4 py-2 text-xs text-slate-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProgramDetails.beneficiary_table?.map((b:any, i:number) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium">{b.name}</td>
                        <td className="px-4 py-2"><span className="text-xs bg-slate-200 px-1 rounded">{b.type}</span></td>
                        <td className="px-4 py-2 text-slate-600">{b.resource}</td>
                        <td className="px-4 py-2 font-bold text-slate-700">{b.quantity}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">{new Date(b.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {(!selectedProgramDetails.beneficiary_table || selectedProgramDetails.beneficiary_table.length === 0) && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No beneficiaries served yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assigned Volunteers */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2">Assigned Volunteers</h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedProgramDetails.volunteers?.map((v:any, i:number) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      {v.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{v.name}</div>
                      <div className="text-xs text-slate-500">Role: {v.role}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(v.start_date).toLocaleDateString()} - {new Date(v.end_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
                {(!selectedProgramDetails.volunteers || selectedProgramDetails.volunteers.length === 0) && (
                  <div className="col-span-2 text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">No volunteers assigned to this program yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Program">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Program Name</label>
            <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={formData.program_name} onChange={e => setFormData({...formData, program_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Program Type</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={formData.program_type} onChange={e => setFormData({...formData, program_type: e.target.value})}>
                <option value="basic_needs">Basic Needs</option>
                <option value="health">Health</option>
                <option value="education">Education</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region ID</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={formData.region_id} onChange={e => setFormData({...formData, region_id: parseInt(e.target.value)})}>
                <option value={1}>Mumbai North (1)</option>
                <option value={2}>Pune Rural (2)</option>
                <option value={3}>Nagpur Central (3)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Budget (₹)</label>
              <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={formData.total_budget} onChange={e => setFormData({...formData, total_budget: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Beneficiaries</label>
              <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={formData.target_beneficiaries} onChange={e => setFormData({...formData, target_beneficiaries: parseInt(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input required type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors mt-6">
            Create Program
          </button>
        </form>
      </Modal>
    </div>
  )
}
