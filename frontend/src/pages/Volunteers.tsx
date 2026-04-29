import React, { useEffect, useState } from 'react'
import { HeartHandshake, UserPlus, Search, MapPin, UploadCloud, Trash2, ClipboardCheck, Activity, BarChart3 } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [matrixData, setMatrixData] = useState<any[]>([])
  const [utilizationData, setUtilizationData] = useState<any>(null)
  const [programs, setPrograms] = useState<any[]>([])
  
  const [searchQuery, setSearchQuery] = useState("")

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null)
  const [assignForm, setAssignForm] = useState({ program_id: 1, start_date: '', end_date: '' })

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    region_id: 1,
    skill_name: ''
  })
  const [file, setFile] = useState<File | null>(null)

  const fetchData = async () => {
    try {
      const [volRes, matRes, utilRes, progRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/reports/volunteers'),
        axios.get('http://localhost:8000/api/v1/reports/volunteer-matrix'),
        axios.get('http://localhost:8000/api/v1/reports/volunteer-utilization'),
        axios.get('http://localhost:8000/api/v1/reports/programs')
      ])
      setVolunteers(volRes.data)
      setMatrixData(matRes.data)
      setUtilizationData(utilRes.data)
      setPrograms(progRes.data)
      if (assignForm.program_id === 1 && progRes.data.length > 0) {
        setAssignForm(prev => ({ ...prev, program_id: progRes.data[0].program_id || 1 }))
      }
    } catch (e) {
      console.error("Failed to fetch volunteer data", e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredVolunteers = volunteers.filter(v => {
    const q = searchQuery.toLowerCase()
    const skillMatch = v.skills && v.skills.some((s: string) => s.toLowerCase().includes(q))
    return (
      v.name.toLowerCase().includes(q) ||
      v.region.toLowerCase().includes(q) ||
      v.availability.toLowerCase().includes(q) ||
      skillMatch
    )
  })

  const handleDelete = async (profileId: number) => {
    if (confirm("Are you sure you want to delete this volunteer?")) {
      try {
        await axios.delete(`http://localhost:8000/api/v1/volunteers/${profileId}`)
        fetchData()
      } catch (err) {
        console.error(err)
        alert("Failed to delete volunteer")
      }
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/api/v1/volunteers/', formData)
      setIsAddModalOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert("Failed to add volunteer")
    }
  }

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return;
    const data = new FormData()
    data.append("file", file)
    try {
      const res = await axios.post('http://localhost:8000/api/v1/upload/volunteers', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert(`Imported ${res.data.imported} volunteers!`)
      setIsCsvModalOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert("Failed to upload CSV")
    }
  }

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/api/v1/volunteers/assign', {
        program_id: assignForm.program_id,
        volunteer_id: selectedVolunteer.profile_id,
        start_date: assignForm.start_date,
        end_date: assignForm.end_date,
        role_description: "General Duty",
        status: "active"
      })
      alert("Assigned successfully!")
      setIsAssignModalOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert("Failed to assign volunteer")
    }
  }

  const openAssignModal = (vol: any) => {
    setSelectedVolunteer(vol)
    setIsAssignModalOpen(true)
  }

  // Format Matrix Data for Recharts BarChart
  const chartData = matrixData.map(m => ({
    name: m.region,
    ...m.skills
  }))

  const pieData = utilizationData ? [
    { name: 'Assigned', value: utilizationData.assigned, color: '#f59e0b' },
    { name: 'Idle', value: utilizationData.idle, color: '#e2e8f0' }
  ] : []

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-orange-600 flex items-center gap-3">
          <HeartHandshake className="text-amber-500" size={32} /> Volunteer Network
        </h1>
        <div className="flex gap-3">
          <button onClick={() => setIsCsvModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:shadow-md transition-all shadow-sm">
            <UploadCloud size={16} /> Bulk Upload CSV
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
            <UserPlus size={18} /> Add Volunteer
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-3 text-slate-400" size={18} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Intelligent search (name, region, skill, availability)..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm transition-all" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVolunteers.length > 0 ? filteredVolunteers.map((v, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-md relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 -z-10 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-200 to-orange-100 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                  <span className="text-xl font-black text-amber-700">{v.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{v.name}</h3>
                  <span className={`text-xs font-bold uppercase tracking-wider ${v.availability === 'available' ? 'text-green-600' : 'text-slate-500'}`}>
                    • {v.availability}
                  </span>
                </div>
              </div>
              <button onClick={() => handleDelete(v.profile_id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={18}/></button>
            </div>

            <div className="space-y-3 mb-4 z-10">
              <div className="flex flex-wrap gap-2">
                {v.skills && v.skills.length > 0 ? v.skills.map((s: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-md text-xs font-bold">
                    {s}
                  </span>
                )) : <span className="text-xs text-slate-400 italic">No skills listed</span>}
              </div>
            </div>

              <div className="pt-4 border-t border-slate-100/60 flex justify-between items-center text-sm">
                <div className="font-semibold text-slate-600 flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400"/> {v.region}
                </div>
                <button onClick={() => openAssignModal(v)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${v.availability === 'available' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  <ClipboardCheck size={14}/> {v.availability === 'available' ? 'Assign / History' : 'View History'}
                </button>
              </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200 border-dashed">
            <HeartHandshake size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-500">No volunteers found.</p>
          </div>
        )}
      </div>

      {/* Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 className="text-amber-500"/> Skill Availability Matrix by Region</h2>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Legend />
                  {/* Dynamically create bars for each skill found in the first region data, simplified for demo */}
                  {Object.keys(chartData[0] || {}).filter(k => k !== 'name').map((key, i) => (
                    <Bar key={key} dataKey={key} stackId="a" fill={`hsl(${i * 45 + 20}, 80%, 60%)`} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center pt-20">Not enough data to display matrix.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 mb-2 w-full flex items-center gap-2"><Activity className="text-amber-500"/> Utilization Report</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center absolute bottom-24">
            <div className="text-3xl font-black text-amber-600">{utilizationData?.utilization_rate || 0}%</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned</div>
          </div>
          <div className="w-full flex justify-between px-4 mt-2">
            <div className="text-center"><div className="text-xl font-bold text-slate-700">{utilizationData?.assigned || 0}</div><div className="text-xs text-slate-500">Active</div></div>
            <div className="text-center"><div className="text-xl font-bold text-slate-700">{utilizationData?.idle || 0}</div><div className="text-xs text-slate-500">Idle</div></div>
          </div>
        </div>
      </div>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Profile: ${selectedVolunteer?.name}`}>
        <div className="space-y-6">
          {selectedVolunteer?.assignments?.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-sm font-bold text-slate-700 mb-2">Assignment History</h4>
              <div className="space-y-2">
                {selectedVolunteer.assignments.map((a: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                    <span className="font-semibold text-slate-600">{a.program_name}</span>
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span>{a.start_date || 'N/A'} to {a.end_date || 'N/A'}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${a.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedVolunteer?.availability === 'available' ? (
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Program</label>
                <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" value={assignForm.program_id} onChange={e => setAssignForm({...assignForm, program_id: parseInt(e.target.value)})}>
                  {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name} ({p.region})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" value={assignForm.start_date} onChange={e => setAssignForm({...assignForm, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input required type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" value={assignForm.end_date} onChange={e => setAssignForm({...assignForm, end_date: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors">Confirm Assignment</button>
            </form>
          ) : (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm font-medium text-center">
              This volunteer is currently assigned and unavailable for new dispatches.
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Volunteer">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label><input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label><input required type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Primary Skill</label><input required type="text" placeholder="e.g. Teaching" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={formData.skill_name} onChange={e => setFormData({...formData, skill_name: e.target.value})} /></div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region ID</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={formData.region_id} onChange={e => setFormData({...formData, region_id: parseInt(e.target.value)})}>
                <option value={1}>Mumbai North (1)</option>
                <option value={2}>Pune Rural (2)</option>
                <option value={3}>Nagpur Central (3)</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-amber-600 text-white rounded-lg font-bold">Save Volunteer</button>
        </form>
      </Modal>

      <Modal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} title="Upload CSV">
        <form onSubmit={handleCsvSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
            <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-sm text-slate-600 mb-4">Upload a CSV file containing your volunteer data. Expected columns: name, email, regionId, skills</p>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
          </div>
          <button type="submit" disabled={!file} className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors disabled:opacity-50">Upload & Process</button>
        </form>
      </Modal>
    </div>
  )
}
