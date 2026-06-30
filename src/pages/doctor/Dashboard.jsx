import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Loader2,
  FileText,
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
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
import { cn } from '../../lib/utils';
import { api } from '../../services/api';

const StatCard = ({ title, value, subtitle, icon: _Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <_Icon size={24} className="text-white" />
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {subtitle && (
        <p className="text-xs text-slate-400 font-medium mt-2">{subtitle}</p>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
        setError('Unable to load dashboard data. Please try again.');
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading dashboard overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 bg-red-50 rounded-full">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-sm text-slate-700 font-semibold">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clinical Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Welcome back. Here's your hospital overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Patients" 
          value={patients.length.toLocaleString()} 
          subtitle={`${recentPatients.length > 0 ? 'Most recent today' : 'No new patients today'}`}
          icon={Users} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Appointments" 
          value={appointments.length.toLocaleString()} 
          subtitle={`${appointmentStats.scheduled} upcoming`}
          icon={Calendar} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="Prescriptions" 
          value={prescriptions.length.toLocaleString()} 
          subtitle="Total issued"
          icon={Pill} 
          color="bg-purple-500"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toLocaleString()}`} 
          subtitle={`${invoices.length} invoices`}
          icon={TrendingUp} 
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-slate-900">Weekly Activity</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Patients & appointments — Last 7 days</p>
            </div>
          </div>
          <div className="h-75 w-full">
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
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="patients" 
                  stroke="#14b8a6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPatients)"
                  name="Patients"
                />
                <Area 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAppointments)"
                  name="Appointments"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Upcoming Appointments</h3>
          <div className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt, i) => {
                const patientName = apt.patientId?.userId?.name || apt.patientId?.name || 'Patient';
                const dateObj = new Date(apt.appointmentDate);
                const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={apt._id || i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs">
                      {dateObj.getDate()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">{patientName}</div>
                      <div className="text-xs text-slate-400">{dateObj.toLocaleDateString()} at {timeString}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <Calendar className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm text-slate-400 font-medium">No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status Breakdown — real data */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Appointment Overview</h3>
          <div className="space-y-5">
            {[
              { label: 'Scheduled', count: appointmentStats.scheduled, color: 'bg-blue-500', icon: Clock },
              { label: 'Completed', count: appointmentStats.completed, color: 'bg-emerald-500', icon: CheckCircle2 },
              { label: 'Cancelled', count: appointmentStats.cancelled, color: 'bg-red-400', icon: XCircle },
            ].map((item) => {
              const pct = appointmentStats.total > 0 ? (item.count / appointmentStats.total) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <item.icon size={16} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-900">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-600">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", item.color)} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {appointmentStats.total === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No appointment data yet</p>
            )}
          </div>
        </div>

        {/* Recent Patients — real data */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Patients</h3>
          <div className="space-y-4">
            {recentPatients.length > 0 ? recentPatients.map((patient, i) => {
              const name = patient.userId?.name || patient.name || 'Patient';
              const initial = name.charAt(0).toUpperCase();
              const joinDate = patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A';
              return (
                <div key={patient._id || i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                    <p className="text-xs text-slate-400">Registered {joinDate}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    (patient.status === 'active' || patient.status === 'Active') 
                      ? "bg-emerald-100 text-emerald-600" 
                      : "bg-slate-100 text-slate-500"
                  )}>
                    {patient.status || 'Active'}
                  </span>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center py-8 text-center">
                <Users className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm text-slate-400 font-medium">No patients registered yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
