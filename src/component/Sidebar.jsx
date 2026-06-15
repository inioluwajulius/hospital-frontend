import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { 
  Users, UserCheck, ClipboardList, Settings,
  LayoutDashboard, Calendar, Pill, FolderHeart, Microscope, Activity,
  CreditCard, ShoppingCart, LogOut, Menu, X, User
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch (error) {
          console.error('Failed to parse user from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const userRole = user?.role?.toLowerCase() || '';

  let items = [];
  if (userRole === 'hospital_admin' || userRole === 'super_admin' || userRole === 'admin') {
    items = [
      { label: "Doctors", path: "/admin/doctors", icon: <Users size={20} /> },
      { label: "Patients", path: "/admin/patients", icon: <User size={20} /> },
      { label: "Doctor Approvals", path: "/admin/pending-approvals", icon: <UserCheck size={20} /> },
      { label: "Audit Logs", path: "/admin/audit-logs", icon: <ClipboardList size={20} /> },
      { label: "Settings", path: "/admin/settings", icon: <Settings size={20} /> },
    ];
  } else if (userRole === 'doctor') {
    items = [
      { label: "Dashboard", path: "/doctor/dashboard", icon: <LayoutDashboard size={20} /> },
      { label: "Appointments", path: "/doctor/appointments", icon: <Calendar size={20} /> },
      { label: "Prescriptions", path: "/doctor/prescriptions", icon: <Pill size={20} /> },
      { label: "Medical Records", path: "/doctor/medical-records", icon: <FolderHeart size={20} /> },
      { label: "Lab Tests", path: "/doctor/lab-tests", icon: <Microscope size={20} /> },
      { label: "Radiology", path: "/doctor/radiology", icon: <Activity size={20} /> },
    ];
  } else if (userRole === 'patient') {
    items = [
      { label: "Billing", path: "/patient/billing", icon: <CreditCard size={20} /> },
      { label: "Pharmacy", path: "/patient/pharmacy", icon: <ShoppingCart size={20} /> },
    ];
  }

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth/login/patient');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-emerald-600 text-white p-2 rounded-xl shadow-md hover:bg-emerald-700 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:relative w-72 h-full bg-white text-slate-700 z-40 transform transition-transform duration-300 ease-in-out border-r border-slate-200 shadow-xl flex flex-col ${
          !isOpen ? "-translate-x-full md:translate-x-0" : ""
        }`}
      >
        <div className="p-6 pb-4 border-b border-slate-100">
          <BrandLogo tone="light" />
        </div>

        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || 'email@hospital.com'}</p>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full mt-2 inline-block uppercase tracking-wider">
                {user?.role?.replace('_', ' ') || 'USER'}
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            {items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold group ${
                  isActive(item.path)
                    ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                }`}
              >
                <span className={`transition-transform duration-200 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110 text-slate-400 group-hover:text-emerald-500'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 py-3 rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
