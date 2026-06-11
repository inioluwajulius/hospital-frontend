import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";

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
    // Subscribe to storage changes (for multi-tab updates)
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

  // Define nav items based on user role
  let items = [];
  if (userRole === 'hospital_admin' || userRole === 'super_admin' || userRole === 'admin') {
    items = [
      { label: "Doctors", path: "/admin/doctors", icon: "👨‍⚕️" },
      { label: "Patients", path: "/admin/patients", icon: "👥" },
      { label: "Doctor Approvals", path: "/admin/pending-approvals", icon: "✓" },
      { label: "Audit Logs", path: "/admin/audit-logs", icon: "📋" },
      { label: "Settings", path: "/admin/settings", icon: "⚙️" },
    ];
  } else if (userRole === 'doctor') {
    items = [
      { label: "Dashboard", path: "/doctor/dashboard", icon: "📊" },
      { label: "Appointments", path: "/doctor/appointments", icon: "📅" },
      { label: "Prescriptions", path: "/doctor/prescriptions", icon: "💊" },
      { label: "Medical Records", path: "/doctor/medical-records", icon: "📁" },
      { label: "Lab Tests", path: "/doctor/lab-tests", icon: "🔬" },
      { label: "Radiology", path: "/doctor/radiology", icon: "🩻" },
    ];
  } else if (userRole === 'patient') {
    items = [
      { label: "Billing", path: "/patient/billing", icon: "💳" },
      { label: "Pharmacy", path: "/patient/pharmacy", icon: "🛒" },
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
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition-colors"
      >
        ☰
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative w-64 h-screen bg-linear-to-b from-teal-700 to-teal-800 text-white z-40 transform transition-transform duration-300 ${
          !isOpen ? "-translate-x-full md:translate-x-0" : ""
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-teal-600">
          <BrandLogo tone="dark" />
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-teal-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-lg font-bold">
              {user?.name?.[0]?.toUpperCase() || '👤'}
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.name || 'User'}</p>
              <p className="text-xs text-teal-100 mt-1">{user?.email || 'email@hospital.com'}</p>
              <span className="text-xs bg-teal-600 px-2 py-1 rounded mt-1 inline-block">{user?.role || 'USER'}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1">
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isActive(item.path)
                    ? "bg-teal-600 shadow-lg"
                    : "hover:bg-teal-600/50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-teal-600 bg-teal-800/50">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
