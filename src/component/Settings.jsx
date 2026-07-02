import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Bell, 
  Lock, 
  Globe, 
  Shield, 
  Database, 
  Smartphone,
  ChevronRight,
  Activity,
  Palette
} from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

const SettingItem = ({ icon: Icon, title, description, badge, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-200">
    <div className="p-3 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
      <Icon size={20} />
    </div>
    <div className="flex-1 text-left">
      <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    {badge && (
      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
        {badge}
      </span>
    )}
    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
  </button>
);

export const Settings = () => {
  // Lazily initialize `user` from localStorage
  const [user] = useState(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  });

  const { currency, setCurrency } = useCurrency();

  const handleComingSoon = (featureName) => {
    alert(`${featureName} feature is coming soon!`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Configure your account and hospital management preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center text-emerald-600 border-4 border-white shadow-md overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-2xl font-bold">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <h3 className="font-bold text-slate-900">{user?.name || 'User'}</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{user?.role?.replace('_', ' ') || 'STAFF'}</p>
            <button 
              onClick={() => handleComingSoon('Profile Editing')}
              className="w-full mt-6 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed"
            >
              Edit Profile (Coming Soon)
            </button>
          </div>

          <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-600/20 text-white overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">System Status</p>
              <h4 className="font-bold text-lg mb-4">All Systems Operational</h4>
              <div className="flex items-center gap-2 text-xs font-medium">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Uptime: 99.9%
              </div>
            </div>
            <Activity className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24" />
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Account Settings</h3>
            </div>
            <div className="p-2">
              <SettingItem 
                icon={UserIcon} 
                title="Personal Information" 
                description="Update your name, email, and contact details" 
                badge="Coming Soon"
                onClick={() => handleComingSoon('Personal Information')}
              />
              <SettingItem 
                icon={Lock} 
                title="Password & Security" 
                description="Change your password and enable 2FA" 
                badge="Coming Soon"
                onClick={() => handleComingSoon('Password & Security')}
              />
              <SettingItem 
                icon={Bell} 
                title="Notifications" 
                description="Manage how you receive alerts and updates" 
                badge="Coming Soon"
                onClick={() => handleComingSoon('Notification Settings')}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Hospital Configuration</h3>
            </div>
            <div className="p-2">
              <div className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-200">
                <div className="p-3 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Globe size={20} />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-slate-900 text-sm">Currency Preference</h4>
                  <p className="text-xs text-slate-500">Select your preferred currency</p>
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-2 font-medium shadow-sm outline-none transition-all cursor-pointer hover:border-emerald-300"
                >
                  <option value="NGN">Naira (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">Pound (£)</option>
                </select>
              </div>
              <SettingItem 
                icon={Palette} 
                title="Branding & White-Label" 
                description="Customize colors and logos for your hospital" 
                badge="Coming Soon"
                onClick={() => handleComingSoon('Branding')}
              />
              <SettingItem 
                icon={Shield} 
                title="Roles & Permissions" 
                description="Manage access levels for hospital staff" 
                badge="Coming Soon"
                onClick={() => handleComingSoon('Roles & Permissions')}
              />
              <SettingItem 
                icon={Database} 
                title="Data Management" 
                description="Backup, export, and manage system data" 
                badge="Coming Soon"
                onClick={() => handleComingSoon('Data Management')}
              />
              <SettingItem 
                icon={Smartphone} 
                title="Connected Devices" 
                description="Manage lab equipment and mobile devices" 
                badge="Coming Soon"
                onClick={() => handleComingSoon('Connected Devices')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
