import React, { useState, useEffect } from 'react';
import { Building2, Users, Activity, Settings } from 'lucide-react';
import { api } from '../../services/api';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalHospitals: 0,
    totalUsers: 0,
    activeHospitals: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await api.get('/superadmin/stats');
      if (res.data?.success) {
        setStats({
          totalHospitals: res.data.data.totalHospitals || 0,
          totalUsers: res.data.data.totalUsers || 0,
          activeHospitals: res.data.data.activeHospitals || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Platform Overview
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Welcome, Super Admin. Here is the global status of all registered hospitals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Hospitals</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : stats.totalHospitals}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Hospitals</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : stats.activeHospitals}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Users</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : stats.totalUsers}</p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
