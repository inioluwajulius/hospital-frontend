import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Loader2,
  Heart,
  Droplets,
  Thermometer,
  Weight,
  FileText,
  ShieldCheck,
  CalendarDays,
  Stethoscope,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';

const StatCard = ({ title, value, icon: _Icon, trend, trendValue, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      <button className="text-slate-400 hover:text-slate-600">
        <MoreVertical size={20} />
      </button>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      <div className="flex items-center gap-1 mt-2">
        {trend === 'up' ? (
          <ArrowUpRight size={16} className="text-emerald-500" />
        ) : (
          <ArrowDownRight size={16} className="text-red-500" />
        )}
        <span className={cn("text-xs font-semibold", trend === 'up' ? "text-emerald-500" : "text-red-500")}>
          {trendValue}
        </span>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider ml-1">vs last month</span>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, aRes, iRes] = await Promise.all([
          api.getPatients(),
          api.getAppointments(),
          api.getInvoices()
        ]);
        setPatients(pRes.data || []);
        setAppointments(aRes.data || []);
        setInvoices(iRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Continue with empty data instead of crashing
        setPatients([]);
        setAppointments([]);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const upcomingAppointments = appointments
    .filter(a => a.status === 'Scheduled')
    .slice(0, 5);

  const chartData = [
    { name: 'Mon', patients: 45, appointments: 32 },
    { name: 'Tue', patients: 52, appointments: 40 },
    { name: 'Wed', patients: 48, appointments: 35 },
    { name: 'Thu', patients: 61, appointments: 45 },
    { name: 'Fri', patients: 55, appointments: 38 },
    { name: 'Sat', patients: 30, appointments: 20 },
    { name: 'Sun', patients: 25, appointments: 15 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading dashboard overview...</p>
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
          icon={Users} 
          trend="up" 
          trendValue="+12.5%" 
          color="bg-blue-500"
        />
        <StatCard 
          title="Appointments" 
          value={appointments.length.toLocaleString()} 
          icon={Calendar} 
          trend="up" 
          trendValue="+8.2%" 
          color="bg-primary"
        />
        <StatCard 
          title="Surgeries" 
          value="12" 
          icon={Activity} 
          trend="down" 
          trendValue="-2.4%" 
          color="bg-purple-500"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toLocaleString()}`} 
          icon={TrendingUp} 
          trend="up" 
          trendValue="+15.3%" 
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-slate-900">Patient Statistics</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Weekly activity report</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Upcoming Appointments</h3>
          <div className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900">{apt.patientName}</div>
                    <div className="text-xs text-slate-400">{apt.time || 'Scheduled'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                No upcoming appointments
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-linear-to-br from-slate-50 to-slate-100 p-8 rounded-3xl border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Department Performance</h3>
          <div className="space-y-4">
            {[
              { name: 'Emergency', patients: 28, color: 'bg-red-500' },
              { name: 'Cardiology', patients: 42, color: 'bg-blue-500' },
              { name: 'Orthopedics', patients: 31, color: 'bg-purple-500' },
              { name: 'Neurology', patients: 19, color: 'bg-amber-500' },
            ].map((dept, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-900">{dept.name}</span>
                  <span className="text-xs font-bold text-slate-600">{dept.patients} patients</span>
                </div>
                <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-slate-200">
                  <div className={cn("h-full", dept.color)} style={{ width: `${(dept.patients / 50) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
          <ShieldCheck className="text-emerald-400 mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">System Health</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">All systems operational. Database integrity verified. Security protocols active.</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Uptime</span>
              <span className="font-bold text-emerald-400">99.9%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Response Time</span>
              <span className="font-bold text-emerald-400">245ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Data Backup</span>
              <span className="font-bold text-emerald-400">2h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
