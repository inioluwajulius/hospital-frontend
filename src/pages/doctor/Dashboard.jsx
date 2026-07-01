import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  FileText,
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../../component/SkeletonLoader';
import { EmptyState } from '../../component/EmptyState';

const StatCard = ({ title, value, subtitle, icon: _Icon, color, index }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${color.replace('text-', 'bg-')}`}></div>
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className={cn("p-4 rounded-2xl", color.replace('text-', 'bg-').replace('500', '100'))}>
        <_Icon size={28} className={color} />
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
      <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">{title}</p>
      {subtitle && (
        <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600">
          {subtitle}
        </div>
      )}
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pRes, aRes, prRes, iRes] = await Promise.all([
          api.getPatients(),
          api.getAppointments(),
          api.getPrescriptions(),
          api.getInvoices()
        ]);
        setPatients(pRes.data?.data || pRes.data || []);
        setAppointments(aRes.data?.data || aRes.data || []);
        setPrescriptions(prRes.data?.data || prRes.data || []);
        setInvoices(iRes.data?.data || iRes.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Unable to load dashboard data.');
        setPatients([]);
        setAppointments([]);
        setPrescriptions([]);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        const aptDate = new Date(a.appointmentDate);
        return aptDate >= new Date() && a.status !== 'cancelled' && a.status !== 'Cancelled';
      })
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
      .slice(0, 5);
  }, [appointments]);

  const appointmentStats = useMemo(() => {
    const scheduled = appointments.filter(a => a.status === 'Scheduled' || a.status === 'scheduled').length;
    const completed = appointments.filter(a => a.status === 'Completed' || a.status === 'completed').length;
    const cancelled = appointments.filter(a => a.status === 'Cancelled' || a.status === 'cancelled').length;
    const total = appointments.length;
    return { scheduled, completed, cancelled, total };
  }, [appointments]);

  const recentPatients = useMemo(() => {
    return [...patients]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [patients]);

  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const pts = patients.filter(p => p.createdAt && new Date(p.createdAt).toDateString() === d.toDateString()).length;
      const apts = appointments.filter(a => {
        const aDate = a.appointmentDate || a.date;
        return aDate && new Date(aDate).toDateString() === d.toDateString();
      }).length;
      
      data.push({ name: dayStr, patients: pts, appointments: apts });
    }
    return data;
  }, [patients, appointments]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Dashboard</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Loading your overview...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonCard count={1} />
          </div>
          <div>
            <SkeletonCard count={1} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <Stethoscope size={28} />
            </div>
            Clinical Dashboard
          </h1>
          <p className="text-slate-500 font-medium">Welcome back. Here's your practice overview for today.</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Patients" 
          value={patients.length.toLocaleString()} 
          subtitle={`${recentPatients.length > 0 ? 'Most recent today' : 'No new patients today'}`}
          icon={Users} 
          color="text-blue-500"
          index={0}
        />
        <StatCard 
          title="Appointments" 
          value={appointments.length.toLocaleString()} 
          subtitle={`${appointmentStats.scheduled} upcoming`}
          icon={CalendarIcon} 
          color="text-emerald-500"
          index={1}
        />
        <StatCard 
          title="Prescriptions" 
          value={prescriptions.length.toLocaleString()} 
          subtitle="Total issued"
          icon={Pill} 
          color="text-purple-500"
          index={2}
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toLocaleString()}`} 
          subtitle={`${invoices.length} invoices`}
          icon={TrendingUp} 
          color="text-amber-500"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="text-indigo-500" size={24} />
                Weekly Activity
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Patients & appointments — Last 7 days</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} 
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                    fontWeight: 'bold',
                    padding: '12px'
                  }} 
                  itemStyle={{
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="patients" 
                  stroke="#14b8a6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPatients)"
                  name="Patients"
                />
                <Area 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorAppointments)"
                  name="Appointments"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="text-primary" size={24} />
              Today's Schedule
            </h3>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt, i) => {
                const patientName = apt.patientId?.userId?.name || apt.patientId?.name || 'Patient';
                const dateObj = new Date(apt.appointmentDate);
                const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={apt._id || i} className="group flex flex-col gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary font-bold shadow-sm border border-slate-100">
                          {dateObj.getHours() > 12 ? dateObj.getHours() - 12 : dateObj.getHours()}
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">{patientName}</div>
                          <div className="text-xs font-bold text-primary">{timeString}</div>
                        </div>
                      </div>
                      <span className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {apt.status || 'Scheduled'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState 
                  icon={CalendarIcon} 
                  title="Schedule Clear" 
                  description="You have no upcoming appointments for today."
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
        >
          <h3 className="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={24} />
            Appointment Overview
          </h3>
          <div className="space-y-6">
            {[
              { label: 'Scheduled', count: appointmentStats.scheduled, color: 'bg-blue-500', icon: Clock },
              { label: 'Completed', count: appointmentStats.completed, color: 'bg-emerald-500', icon: CheckCircle2 },
              { label: 'Cancelled', count: appointmentStats.cancelled, color: 'bg-red-500', icon: XCircle },
            ].map((item) => {
              const pct = appointmentStats.total > 0 ? (item.count / appointmentStats.total) * 100 : 0;
              return (
                <div key={item.label} className="group">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-opacity-10", item.color.replace('bg-', 'bg-').replace('500', '100'))}>
                        <item.icon size={18} className={item.color.replace('bg-', 'text-')} />
                      </div>
                      <span className="text-sm font-extrabold text-slate-700">{item.label}</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {appointmentStats.total === 0 && (
              <EmptyState 
                icon={FileText} 
                title="No Data" 
                description="No appointment data available yet."
              />
            )}
          </div>
        </motion.div>

        {/* Recent Patients */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
        >
          <h3 className="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
            <Users className="text-blue-500" size={24} />
            Recent Patients
          </h3>
          <div className="space-y-4">
            {recentPatients.length > 0 ? recentPatients.map((patient, i) => {
              const name = patient.userId?.name || patient.name || 'Patient';
              const initial = name.charAt(0).toUpperCase();
              const joinDate = patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A';
              return (
                <div key={patient._id || i} className="flex items-center gap-5 p-4 rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-sm bg-slate-50 hover:bg-white transition-all">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-inner">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">{name}</p>
                    <p className="text-xs font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                      <CalendarIcon size={12} />
                      Registered {joinDate}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border",
                    (patient.status === 'active' || patient.status === 'Active') 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-slate-50 text-slate-500 border-slate-200"
                  )}>
                    {patient.status || 'Active'}
                  </span>
                </div>
              );
            }) : (
              <EmptyState 
                icon={Users} 
                title="No Patients" 
                description="No patients registered yet."
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
