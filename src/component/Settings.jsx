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
  Activity
} from 'lucide-react';

const SettingItem = ({ icon: Icon, title, description, badge }) => (
  <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-200">
    <div className="p-3 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
      <Icon size={20} />
    </div>
    <div className="flex-1 text-left">
      <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    {badge && (
      <span className="px-2 py-0.5 bg-teal-600/10 text-teal-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
        {badge}
      </span>
    )}
    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
  </button>
);

export const Settings = () => {
  // Lazily initialize `user` from localStorage to avoid setState in effect
  const [user] = useState(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Configure your account and hospital management preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="w-24 h-24 bg-teal-100 rounded-full mx-auto mb-4 flex items-center justify-center text-teal-600 border-4 border-white shadow-md overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-2xl font-bold">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <h3 className="font-bold text-slate-900">{user?.name || 'User'}</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{user?.role || 'STAFF'}</p>
            <button className="w-full mt-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors">
              Edit Profile
            </button>
          </div>

          <div className="bg-teal-600 p-6 rounded-2xl shadow-lg shadow-teal-600/20 text-white overflow-hidden relative">
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
              />
              <SettingItem 
                icon={Lock} 
                title="Password & Security" 
                description="Change your password and enable 2FA" 
                badge="Secure"
              />
              <SettingItem 
                icon={Bell} 
                title="Notifications" 
                description="Manage how you receive alerts and updates" 
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Hospital Configuration</h3>
            </div>
            <div className="p-2">
              <SettingItem 
                icon={Globe} 
                title="Regional Settings" 
                description="Set timezone, language, and currency" 
              />
              <SettingItem 
                icon={Shield} 
                title="Roles & Permissions" 
                description="Manage access levels for hospital staff" 
                badge="Admin"
              />
              <SettingItem 
                icon={Database} 
                title="Data Management" 
                description="Backup, export, and manage system data" 
              />
              <SettingItem 
                icon={Smartphone} 
                title="Connected Devices" 
                description="Manage lab equipment and mobile devices" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
