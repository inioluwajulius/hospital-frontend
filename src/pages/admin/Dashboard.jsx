import React, { useState, useEffect } from 'react';
import { Users, User, Clock, Activity, Building, ArrowUpRight, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 ${colorClass.bg}`} />
    
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`flex items-center text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'} bg-slate-50 px-2 py-1 rounded-full`}>
          {trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingUp size={12} className="mr-1 rotate-180" />}
          {trendValue}
        </span>
      )}
    </div>
    
    <div>
      <h3 className="text-3xl font-black text-slate-900 mb-1">{value}</h3>
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    pendingApprovals: 0,
    activeAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Note: Replace with actual backend endpoint when available
        // For MVP, we fetch the data from the individual lists to compute stats
        const [doctorsRes, patientsRes, pendingRes] = await Promise.all([
          api.get('/hospital-admin/doctors'),
          api.get('/hospital-admin/patients'),
          api.get('/hospital-admin/pending-doctors')
        ]);

        setStats({
          totalDoctors: doctorsRes.data?.data?.length || 0,
          totalPatients: patientsRes.data?.data?.length || 0,
          pendingApprovals: pendingRes.data?.data?.length || 0,
          activeAppointments: 0 // Placeholder until appointment endpoint is ready
        });
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of your hospital's performance and staff.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-sm">
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Doctors" 
          value={loading ? "..." : stats.totalDoctors}
          icon={Users} 
          trend="up"
          trendValue="12% this month"
          colorClass={{ bg: 'bg-blue-100', text: 'text-blue-600' }} 
        />
        <StatCard 
          title="Total Patients" 
          value={loading ? "..." : stats.totalPatients}
          icon={User} 
          trend="up"
          trendValue="8% this month"
          colorClass={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }} 
        />
        <StatCard 
          title="Pending Approvals" 
          value={loading ? "..." : stats.pendingApprovals}
          icon={Clock} 
          colorClass={{ bg: 'bg-amber-100', text: 'text-amber-600' }} 
        />
        <StatCard 
          title="Active Appointments" 
          value={loading ? "..." : stats.activeAppointments}
          icon={Activity} 
          colorClass={{ bg: 'bg-purple-100', text: 'text-purple-600' }} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Hospital Activity</h2>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50 text-slate-400">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Activity chart data coming soon</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/admin/register-doctor" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/10 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Users size={18} />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm">Register New Doctor</span>
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-emerald-500" />
              </a>
              <a href="/admin/pending-approvals" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/10 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Clock size={18} />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm">Review Approvals</span>
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-blue-500" />
              </a>
              <a href="/admin/settings" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/10 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Building size={18} />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm">Hospital Settings</span>
                </div>
                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-purple-500" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
