import React, { useState, useEffect } from 'react';
import { Users, User, Clock, Activity, Building, ArrowUpRight, TrendingUp, TrendingDown, Stethoscope, BriefcaseMedical } from 'lucide-react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { SkeletonCard } from '../../component/SkeletonLoader';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${colorClass.bg.replace('bg-', 'bg-')}`} style={{backgroundColor: 'currentColor'}} />
    
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className={`p-4 rounded-2xl ${colorClass.bg} ${colorClass.text}`}>
        <Icon size={28} />
      </div>
      {trend && (
        <span className={`flex items-center text-xs font-bold ${trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'} px-2.5 py-1.5 rounded-full`}>
          {trend === 'up' ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
          {trendValue}
        </span>
      )}
    </div>
    
    <div className="relative z-10">
      <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
      <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">{title}</p>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    pendingApprovals: 0,
    activeAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  // Mock data for charts
  const activityData = [
    { name: 'Mon', appointments: 45, newPatients: 12 },
    { name: 'Tue', appointments: 52, newPatients: 18 },
    { name: 'Wed', appointments: 38, newPatients: 9 },
    { name: 'Thu', appointments: 65, newPatients: 24 },
    { name: 'Fri', appointments: 48, newPatients: 15 },
    { name: 'Sat', appointments: 30, newPatients: 8 },
    { name: 'Sun', appointments: 25, newPatients: 5 },
  ];

  const departmentData = [
    { name: 'Cardiology', doctors: 12 },
    { name: 'Neurology', doctors: 8 },
    { name: 'Pediatrics', doctors: 15 },
    { name: 'Orthopedics', doctors: 10 },
    { name: 'General', doctors: 25 },
  ];

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
          activeAppointments: 142 // Placeholder until appointment endpoint is ready
        });
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Loading hospital metrics...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-4"><SkeletonCard count={1} /></div>
           <div className="space-y-4"><SkeletonCard count={1} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-100"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <Building size={28} />
            </div>
            Admin Dashboard
          </h1>
          <p className="text-slate-500 font-medium">Overview of your hospital's performance, staff, and activity.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            Download Report
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Doctors" 
          value={stats.totalDoctors}
          icon={Stethoscope} 
          trend="up"
          trendValue="12% this month"
          colorClass={{ bg: 'bg-blue-100', text: 'text-blue-600' }} 
          delay={0.1}
        />
        <StatCard 
          title="Total Patients" 
          value={stats.totalPatients}
          icon={User} 
          trend="up"
          trendValue="8% this month"
          colorClass={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }} 
          delay={0.2}
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals}
          icon={Clock} 
          trend={stats.pendingApprovals > 0 ? "down" : null}
          trendValue={stats.pendingApprovals > 0 ? "Needs Action" : null}
          colorClass={{ bg: 'bg-amber-100', text: 'text-amber-600' }} 
          delay={0.3}
        />
        <StatCard 
          title="Active Appointments" 
          value={stats.activeAppointments}
          icon={Activity} 
          trend="up"
          trendValue="24% this week"
          colorClass={{ bg: 'bg-purple-100', text: 'text-purple-600' }} 
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Hospital Activity</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Appointments & New Patients over the last 7 days</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block px-4 py-2 outline-none transition-all">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This Year</option>
            </select>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 600, color: '#64748b' }} />
                <Area type="monotone" dataKey="appointments" name="Appointments" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAppointments)" />
                <Area type="monotone" dataKey="newPatients" name="New Patients" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8"
          >
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <a href="/admin/register-doctor" className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group bg-slate-50/50 hover:bg-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">Register Doctor</span>
                    <span className="text-xs font-bold text-slate-400">Add new staff member</span>
                  </div>
                </div>
                <ArrowUpRight size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </a>
              <a href="/admin/pending-approvals" className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group bg-slate-50/50 hover:bg-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors relative">
                    <Clock size={20} />
                    {stats.pendingApprovals > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-white"></span>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">Review Approvals</span>
                    <span className="text-xs font-bold text-slate-400">{stats.pendingApprovals} pending requests</span>
                  </div>
                </div>
                <ArrowUpRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </a>
              <a href="/admin/settings" className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all group bg-slate-50/50 hover:bg-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Building size={20} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">Hospital Settings</span>
                    <span className="text-xs font-bold text-slate-400">Configure preferences</span>
                  </div>
                </div>
                <ArrowUpRight size={20} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-primary rounded-3xl shadow-xl shadow-primary/20 p-8 text-white relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black opacity-10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BriefcaseMedical size={24} />
                </div>
                <h3 className="font-extrabold text-lg">System Health</h3>
              </div>
              <p className="text-primary-foreground/80 text-sm font-medium mb-6 leading-relaxed">
                All systems are operating normally. The next scheduled maintenance is in 14 days.
              </p>
              <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <span className="text-sm font-bold">Status</span>
                <span className="flex items-center gap-2 text-sm font-extrabold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
