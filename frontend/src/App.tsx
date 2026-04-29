import React, { createContext, useContext, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Package, Activity, BrainCircuit, HeartHandshake, IndianRupee } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Beneficiaries from './pages/Beneficiaries'
import DSSPanel from './pages/DSSPanel'
import Resources from './pages/Resources'
import Programs from './pages/Programs'
import Volunteers from './pages/Volunteers'
import Finance from './pages/Finance'

// --- Mock Auth Context ---
type Role = 'Super Admin' | 'Regional Manager' | 'Volunteer'
interface AuthContextType {
  role: Role
  setRole: (role: Role) => void
}
const AuthContext = createContext<AuthContextType>({ role: 'Super Admin', setRole: () => {} })

function Sidebar() {
  const { role } = useContext(AuthContext)
  const location = useLocation()
  
  const navLink = (path: string, label: string, Icon: any, allowedRoles: Role[]) => {
    if (!allowedRoles.includes(role)) return null
    const isActive = location.pathname === path
    return (
      <Link 
        to={path} 
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 backdrop-blur-sm ${isActive ? 'bg-white/20 font-bold' : 'hover:bg-white/10 text-white/80'}`}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-blue-300'} /> {label}
      </Link>
    )
  }

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-indigo-900 text-white min-h-screen p-4 flex flex-col shadow-xl z-20 relative">
      <div className="text-2xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200 tracking-tight">NGO Platform</div>
      <nav className="flex flex-col gap-2">
        {navLink('/', 'Dashboard', LayoutDashboard, ['Super Admin', 'Regional Manager'])}
        {navLink('/beneficiaries', 'Beneficiaries', Users, ['Super Admin', 'Regional Manager', 'Volunteer'])}
        {navLink('/resources', 'Resources', Package, ['Super Admin', 'Regional Manager'])}
        {navLink('/programs', 'Programs', Activity, ['Super Admin', 'Regional Manager', 'Volunteer'])}
        {navLink('/volunteers', 'Volunteers', HeartHandshake, ['Super Admin', 'Regional Manager'])}
        {navLink('/finance', 'Finance', IndianRupee, ['Super Admin'])}
        {navLink('/dss', 'DSS Engine', BrainCircuit, ['Super Admin', 'Regional Manager'])}
      </nav>
    </div>
  )
}

function Topbar() {
  const { role, setRole } = useContext(AuthContext)
  
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
        Welcome, {role}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-slate-500">View As:</span>
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value as Role)}
          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-200 focus:outline-none cursor-pointer"
        >
          <option value="Super Admin">Super Admin</option>
          <option value="Regional Manager">Regional Manager</option>
          <option value="Volunteer">Volunteer</option>
        </select>
      </div>
    </header>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        <Topbar />
        <main className="p-8 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  const [role, setRole] = useState<Role>('Super Admin')
  
  return (
    <AuthContext.Provider value={{ role, setRole }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/beneficiaries" element={<Beneficiaries />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/volunteers" element={<Volunteers />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/dss" element={<DSSPanel />} />
            <Route path="*" element={<div className="text-xl">Coming Soon...</div>} />
          </Routes>
        </Layout>
      </Router>
    </AuthContext.Provider>
  )
}

export default App
