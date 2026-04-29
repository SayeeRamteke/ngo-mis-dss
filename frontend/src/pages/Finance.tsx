import React, { useEffect, useState } from 'react'
import { IndianRupee, PieChart, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'

export default function Finance() {
  const [budgetData, setBudgetData] = useState<any>(null)
  const [programsBudget, setProgramsBudget] = useState<any[]>([])
  
  const [isExpenseOpen, setIsExpenseOpen] = useState(false)
  const [isDonationOpen, setIsDonationOpen] = useState(false)

  const [expenseData, setExpenseData] = useState({
    category: 'supplies',
    amount: 0,
    program_id: 1,
    region_id: 1,
    description: ''
  })

  const [donationData, setDonationData] = useState({
    donor_name: '',
    amount: 0,
    donation_type: 'general',
    program_id: 1,
    notes: ''
  })

  const fetchData = async () => {
    try {
      const [summaryRes, programsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/reports/finance'),
        axios.get('http://localhost:8000/api/v1/finance/budget')
      ])
      setBudgetData(summaryRes.data)
      setProgramsBudget(programsRes.data)
    } catch (e) {
      console.error("Failed to fetch finance data", e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/api/v1/finance/expenses', expenseData)
      setIsExpenseOpen(false)
      fetchData() // Refresh
    } catch (err) {
      console.error(err)
      alert("Failed to log expense")
    }
  }

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/api/v1/finance/donations', donationData)
      setIsDonationOpen(false)
      fetchData() // Refresh
    } catch (err) {
      console.error(err)
      alert("Failed to record donation")
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-800 to-pink-600 flex items-center gap-3">
          <IndianRupee className="text-rose-500" size={32} /> Financial Dashboard
        </h1>
        <div className="flex gap-3">
          <button onClick={() => setIsExpenseOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:shadow-md transition-all shadow-sm">
            Log Expense
          </button>
          <button onClick={() => setIsDonationOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
            <Plus size={18} /> Record Donation
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-md relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 group-hover:scale-110 transition-transform"></div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Donations</h3>
          <div className="text-4xl font-black text-slate-800 flex items-center gap-3">
            ₹{budgetData?.total_donations?.toLocaleString() || '0'}
            <ArrowUpRight size={24} className="text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-md relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 group-hover:scale-110 transition-transform"></div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Expenses</h3>
          <div className="text-4xl font-black text-slate-800 flex items-center gap-3">
            ₹{budgetData?.total_expenses?.toLocaleString() || '0'}
            <ArrowDownRight size={24} className="text-rose-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10"></div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Net Available Budget</h3>
          <div className="text-4xl font-black text-white">
            ₹{budgetData ? (budgetData.total_budget_allocated - budgetData.total_expenses).toLocaleString() : '0'}
          </div>
        </div>
      </div>

      {/* Program Budgets Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg p-8 relative overflow-hidden mt-2">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 translate-x-20 -translate-y-20"></div>
        
        <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <PieChart className="text-rose-400" /> Budget Allocation by Program
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
                <th className="p-4 font-bold rounded-tl-xl">Program</th>
                <th className="p-4 font-bold">Allocated</th>
                <th className="p-4 font-bold">Spent</th>
                <th className="p-4 font-bold">Remaining</th>
                <th className="p-4 font-bold rounded-tr-xl">Utilization</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/60">
              {programsBudget.length > 0 ? programsBudget.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{p.program}</td>
                  <td className="p-4 font-semibold text-slate-600">₹{p.allocated.toLocaleString()}</td>
                  <td className="p-4 font-semibold text-rose-600">₹{p.spent.toLocaleString()}</td>
                  <td className="p-4 font-semibold text-emerald-600">₹{p.remaining.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner w-32">
                        <div className={`h-full ${p.utilizationPercent > 80 ? 'bg-red-500' : 'bg-gradient-to-r from-rose-400 to-pink-500'}`} style={{width: `${Math.min(p.utilizationPercent, 100)}%`}}></div>
                      </div>
                      <span className={`text-xs font-bold ${p.utilizationPercent > 80 ? 'text-red-600' : 'text-slate-600'}`}>{p.utilizationPercent}%</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">No program budgets defined.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} title="Log Expense">
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" value={expenseData.category} onChange={e => setExpenseData({...expenseData, category: e.target.value})}>
                <option value="supplies">Supplies</option>
                <option value="logistics">Logistics</option>
                <option value="staffing">Staffing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
              <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: parseFloat(e.target.value)})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Program ID</label>
              <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" value={expenseData.program_id} onChange={e => setExpenseData({...expenseData, program_id: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region ID</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" value={expenseData.region_id} onChange={e => setExpenseData({...expenseData, region_id: parseInt(e.target.value)})}>
                <option value={1}>Mumbai North (1)</option>
                <option value={2}>Pune Rural (2)</option>
                <option value={3}>Nagpur Central (3)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" rows={3} value={expenseData.description} onChange={e => setExpenseData({...expenseData, description: e.target.value})}></textarea>
          </div>
          <button type="submit" className="w-full py-2.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors mt-6">
            Log Expense
          </button>
        </form>
      </Modal>

      <Modal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} title="Record Donation">
        <form onSubmit={handleDonationSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Donor Name</label>
            <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" value={donationData.donor_name} onChange={e => setDonationData({...donationData, donor_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
              <input required type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" value={donationData.amount} onChange={e => setDonationData({...donationData, amount: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Donation Type</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" value={donationData.donation_type} onChange={e => setDonationData({...donationData, donation_type: e.target.value})}>
                <option value="general">General</option>
                <option value="program_specific">Program Specific</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Program ID (Optional)</label>
            <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" value={donationData.program_id} onChange={e => setDonationData({...donationData, program_id: parseInt(e.target.value)})} />
          </div>
          <button type="submit" className="w-full py-2.5 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-colors mt-6">
            Record Donation
          </button>
        </form>
      </Modal>
    </div>
  )
}
