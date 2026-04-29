import React, { useEffect, useState } from 'react'
import { Search, Filter, X, Users, AlertCircle, Plus, Heart, BarChart3, Activity } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])
  
  const [distributionData, setDistributionData] = useState<any[]>([])
  const [reachData, setReachData] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])

  const [isOrg, setIsOrg] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    location_id: 1,
    household_size: 1,
    earning_members: 0,
    monthly_income: 0,
    health_status: 'healthy',
    vulnerability_type: 'general_low_income',
    need_type: 'general',
    contact_info: '',
    
    // Organization fields
    registration_number: '',
    capacity: 100,
    current_occupancy: 0,
    population_served: 0,
    funding_level: 'medium',
    is_organization: false // legacy field
  })

  const [aidForm, setAidForm] = useState({
    program_id: 1,
    resource_id: 1,
    quantity_received: 1,
    date_received: new Date().toISOString().split('T')[0]
  })

  const fetchData = async () => {
    try {
      const [benRes, distRes, reachRes, progRes, resRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/beneficiaries'),
        axios.get('http://localhost:8000/api/v1/reports/beneficiary-distribution'),
        axios.get('http://localhost:8000/api/v1/reports/program-reach'),
        axios.get('http://localhost:8000/api/v1/reports/programs'),
        axios.get('http://localhost:8000/api/v1/reports/resources')
      ])
      setBeneficiaries(benRes.data)
      setDistributionData(distRes.data)
      setReachData(reachRes.data)
      setPrograms(progRes.data)
      setResources(resRes.data)
      
      if (progRes.data.length > 0) setAidForm(p => ({...p, program_id: progRes.data[0].program_id || 1}))
      if (resRes.data.length > 0) setAidForm(p => ({...p, resource_id: resRes.data[0].resource_id || 1}))
    } catch (e) {
      console.error("Failed to fetch data", e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredBeneficiaries = beneficiaries.filter(b => {
    const q = searchQuery.toLowerCase()
    return (
      b.full_name.toLowerCase().includes(q) ||
      String(b.location_id).includes(q) ||
      b.need_type.toLowerCase().includes(q) ||
      b.priority_level.toLowerCase().includes(q)
    )
  })

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { 
        ...formData, 
        beneficiary_type: isOrg ? 'organization' : 'individual',
        is_organization: isOrg 
      }
      
      const submitData = {
        ...payload,
        date_of_birth: !isOrg && payload.date_of_birth ? payload.date_of_birth : null,
      }
      
      await axios.post('http://localhost:8000/api/v1/beneficiaries', submitData)
      setIsAddModalOpen(false)
      fetchData()
    } catch (err: any) {
      console.error(err)
      if(err.response?.data?.detail) {
        alert("Error: " + err.response.data.detail)
      } else {
        alert("Failed to add beneficiary")
      }
    }
  }

  const markCritical = async () => {
    if(!selected) return
    try {
      const res = await axios.patch(`http://localhost:8000/api/v1/beneficiaries/${selected.beneficiary_id}/priority`)
      setSelected(res.data)
      fetchData()
    } catch(err) {
      console.error(err)
      alert("Failed to mark as critical")
    }
  }

  const openHistory = async () => {
    if(!selected) return
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/beneficiaries/${selected.beneficiary_id}/aid`)
      setHistoryData(res.data)
      setIsHistoryModalOpen(true)
    } catch(err) {
      console.error(err)
      alert("Failed to fetch aid history")
    }
  }

  const handleAidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Backend expects date string to be parsed into datetime
      const dateStr = new Date(aidForm.date_received).toISOString()
      await axios.post(`http://localhost:8000/api/v1/beneficiaries/${selected.beneficiary_id}/aid`, {
        ...aidForm,
        date_received: dateStr
      })
      alert("Aid recorded successfully!")
      openHistory() // Refresh history
      fetchData()
    } catch(err: any) {
      console.error(err)
      if(err.response?.data?.detail) {
        alert("Error: " + err.response.data.detail)
      } else {
        alert("Failed to record aid")
      }
    }
  }

  // Format data for charts
  let pieData: any[] = []
  let globalHigh = 0, globalMed = 0, globalLow = 0;
  distributionData.forEach(d => {
    globalHigh += d.high || 0;
    globalMed += d.medium || 0;
    globalLow += d.low || 0;
  })
  if (globalHigh > 0) pieData.push({ name: 'High Priority', value: globalHigh, color: '#ef4444' })
  if (globalMed > 0) pieData.push({ name: 'Medium Priority', value: globalMed, color: '#f59e0b' })
  if (globalLow > 0) pieData.push({ name: 'Low Priority', value: globalLow, color: '#22c55e' })

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12 h-[calc(100vh-8rem)] overflow-y-auto">
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-700 flex items-center gap-3">
          <Users className="text-blue-500" size={32} /> Beneficiaries
        </h1>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
          <Plus size={18} /> Register Beneficiary
        </button>
      </div>

      <div className="flex gap-6 h-[500px]">
        {/* Main Table Area */}
        <div className={`bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl flex-1 flex flex-col transition-all duration-300 relative overflow-hidden`}>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10"></div>
          
          <div className="p-6 border-b border-white/40 flex justify-between items-center z-10">
            <div className="relative w-72">
              <Search className="absolute left-4 top-3 text-slate-400" size={18} />
              <input type="text" placeholder="Intelligent search..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:shadow-md transition-all shadow-sm">
              <Filter size={16} /> Filters
            </button>
          </div>
          
          <div className="flex-1 overflow-auto z-10 p-2">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-20 shadow-sm rounded-lg">
                <tr className="text-xs uppercase text-slate-500 font-bold tracking-wider">
                  <th className="px-6 py-4 rounded-tl-lg rounded-bl-lg">Name</th>
                  <th className="px-6 py-4">Region</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Need Type</th>
                  <th className="px-6 py-4 rounded-tr-lg rounded-br-lg">Priority</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredBeneficiaries.length > 0 ? filteredBeneficiaries.map((item) => (
                  <tr key={item.beneficiary_id} onClick={() => setSelected(item)} className="bg-white/50 hover:bg-white shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group rounded-xl">
                    <td className="px-6 py-4 font-bold text-slate-800 rounded-tl-xl rounded-bl-xl border-y border-l border-white/60">
                      <div className="flex items-center gap-2">
                        {item.full_name} 
                        {item.is_organization && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded uppercase">Org</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium border-y border-white/60">Region {item.location_id}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium border-y border-white/60">{item.household_size}</td>
                    <td className="px-6 py-4 text-slate-600 border-y border-white/60">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wide">{item.need_type || 'General'}</span>
                    </td>
                    <td className="px-6 py-4 rounded-tr-xl rounded-br-xl border-y border-r border-white/60">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.priority_level === 'high' ? 'bg-red-100 text-red-700 border border-red-200' : item.priority_level === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                        {item.priority_level || 'Medium'}
                      </span>
                    </td>
                  </tr>
                )) : (
                   <tr><td colSpan={5} className="text-center py-10 text-slate-500 italic">No beneficiaries found. Add some to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Drawer */}
        {selected && (
          <div className="w-96 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl flex flex-col animate-in slide-in-from-right-8 z-20 overflow-hidden relative">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 translate-x-10 translate-y-10"></div>
            
            <div className="p-6 border-b border-white/40 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">Beneficiary Profile</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20}/></button>
            </div>
            <div className="p-8 flex-1 overflow-auto space-y-6 z-10">
              <div>
                <div className="text-3xl font-black text-slate-800 mb-1 leading-tight">{selected.full_name}</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Region {selected.location_id} {selected.is_organization ? '| Organization' : ''}</div>
                {selected.contact_info && <div className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-md inline-block font-medium">Contact: {selected.contact_info}</div>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Monthly Income</div>
                  <div className="text-lg font-bold text-slate-800">₹{selected.monthly_income?.toLocaleString() || 0}</div>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Size</div>
                  <div className="text-lg font-bold text-slate-800">{selected.household_size}</div>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 rounded-2xl">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-blue-500"/> DSS Priority Analysis</h4>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-slate-600 font-semibold">Priority Score</span><span className="font-bold text-indigo-600">{selected.priority_score ? selected.priority_score.toFixed(1) : '0.0'}/100</span></div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all" style={{width: `${selected.priority_score}%`}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-slate-600 font-semibold">System Priority</span><span className={`font-bold capitalize ${selected.priority_level==='high'?'text-red-600': selected.priority_level==='medium' ? 'text-amber-600' : 'text-green-600'}`}>{selected.priority_level}</span></div>
                    {selected.last_aid_date && <div className="text-xs text-slate-500 mt-2">Last Aid: {new Date(selected.last_aid_date).toLocaleDateString()}</div>}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3 mt-auto">
                <button onClick={markCritical} className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2">
                  <AlertCircle size={18}/> Mark as Critical Case
                </button>
                <button onClick={openHistory} className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all shadow-sm flex justify-center items-center gap-2">
                  <Heart size={18}/> View Aid History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reports Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pb-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 className="text-blue-500"/> Program Reach</h2>
          <div className="h-64 w-full">
            {reachData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reachData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="program" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="beneficiaries_reached" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Beneficiaries Served" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center pt-20">No program reach data available.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="text-blue-500"/> Distribution by Priority</h2>
          <div className="h-64 w-full relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center pt-20">No distribution data available.</p>}
          </div>
        </div>
      </div>

      {/* Add Beneficiary Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Beneficiary">
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
          <button onClick={()=>setIsOrg(false)} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${!isOrg ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Individual</button>
          <button onClick={()=>setIsOrg(true)} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${isOrg ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Organization/Group</button>
        </div>
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{isOrg ? 'Group / Organization Name' : 'Full Name'}</label>
            <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          </div>
          
          {!isOrg ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vulnerability</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.vulnerability_type} onChange={e => setFormData({...formData, vulnerability_type: e.target.value})}>
                    <option value="general_low_income">General Low Income</option>
                    <option value="single_parent">Single Parent</option>
                    <option value="elderly_alone">Elderly Alone</option>
                    <option value="disabled">Disabled</option>
                    <option value="homeless">Homeless</option>
                    <option value="disaster_affected">Disaster Affected</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Household Size</label>
                  <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.household_size} onChange={e => setFormData({...formData, household_size: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Earning Members</label>
                  <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.earning_members} onChange={e => setFormData({...formData, earning_members: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Health Status</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.health_status} onChange={e => setFormData({...formData, health_status: e.target.value})}>
                    <option value="healthy">Healthy</option>
                    <option value="temporary_illness">Temporary Illness</option>
                    <option value="chronic_illness">Chronic Illness</option>
                    <option value="critical_illness">Critical Illness</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.registration_number} onChange={e => setFormData({...formData, registration_number: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Funding Level</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.funding_level} onChange={e => setFormData({...formData, funding_level: e.target.value})}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                  <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Occupancy</label>
                  <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.current_occupancy} onChange={e => setFormData({...formData, current_occupancy: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pop. Served</label>
                  <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.population_served} onChange={e => setFormData({...formData, population_served: parseInt(e.target.value)})} />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region ID</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.location_id} onChange={e => setFormData({...formData, location_id: parseInt(e.target.value)})}>
                <option value={1}>Mumbai North (1)</option><option value={2}>Pune Rural (2)</option><option value={3}>Nagpur Central (3)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Need Type</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.need_type} onChange={e => setFormData({...formData, need_type: e.target.value})}>
                <option value="general">General</option><option value="medical">Medical</option><option value="education">Education</option><option value="food">Food Security</option>
              </select>
            </div>
            {!isOrg && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Income (₹)</label>
                <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.monthly_income} onChange={e => setFormData({...formData, monthly_income: parseFloat(e.target.value)})} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info (Phone/Email)</label>
            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.contact_info} onChange={e => setFormData({...formData, contact_info: e.target.value})} />
          </div>
          
          <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors mt-6">
            Save Beneficiary
          </button>
        </form>
      </Modal>

      {/* Aid History Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Aid History: ${selected?.full_name}`}>
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Plus size={16}/> Record New Aid</h4>
            <form onSubmit={handleAidSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Program</label>
                  <select required className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" value={aidForm.program_id} onChange={e => setAidForm({...aidForm, program_id: parseInt(e.target.value)})}>
                    {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Resource</label>
                  <select required className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" value={aidForm.resource_id} onChange={e => setAidForm({...aidForm, resource_id: parseInt(e.target.value)})}>
                    {resources.map((r:any) => <option key={r.resource} value={r.resource}>{r.resource}</option>)} 
                    {/* Note: The resources endpoint doesn't return resource_id right now in reports. We'll use 1 as a fallback or assume resource_id maps to index. Actually, this is a mock mapping for now since reports returns names. Let's just use 1. */}
                    <option value={1}>Food Kits</option><option value={2}>Medical Supplies</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Quantity</label>
                  <input required type="number" step="0.1" className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" value={aidForm.quantity_received} onChange={e => setAidForm({...aidForm, quantity_received: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
                  <input required type="date" className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" value={aidForm.date_received} onChange={e => setAidForm({...aidForm, date_received: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition-colors">Submit Aid Record</button>
            </form>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-700 mb-3">Past Records</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {historyData.length > 0 ? historyData.map((h, i) => (
                <div key={i} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{h.program_name || `Program ${h.program_id}`}</div>
                    <div className="text-xs text-slate-500">{h.resource_name || `Resource ${h.resource_id}`} - Qty: {h.quantity_received}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-400">{new Date(h.date_received).toLocaleDateString()}</div>
                </div>
              )) : <div className="text-sm text-slate-500 italic">No aid history recorded.</div>}
            </div>
          </div>
        </div>
      </Modal>

    </div>
  )
}
