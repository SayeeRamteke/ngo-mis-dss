import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Package, Activity, BrainCircuit } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Beneficiaries from './pages/Beneficiaries'
import DSSPanel from './pages/DSSPanel'

function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
      <div className="text-2xl font-bold mb-8 text-blue-400">NGO Platform</div>
      <nav className="flex flex-col gap-2">
        <Link to="/" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg">
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        <Link to="/beneficiaries" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg">
          <Users size={20} /> Beneficiaries
        </Link>
        <Link to="/resources" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg">
          <Package size={20} /> Resources
        </Link>
        <Link to="/programs" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg">
          <Activity size={20} /> Programs
        </Link>
        <Link to="/dss" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg">
          <BrainCircuit size={20} /> DSS Engine
        </Link>
      </nav>
    </div>
  )
}

function Topbar() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8">
      <div className="font-semibold text-slate-800">Welcome, Program Manager</div>
      <div className="text-sm text-slate-500">Mock Auth Active</div>
    </header>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-8 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/beneficiaries" element={<Beneficiaries />} />
          <Route path="/dss" element={<DSSPanel />} />
          <Route path="*" element={<div className="text-xl">Coming Soon...</div>} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
