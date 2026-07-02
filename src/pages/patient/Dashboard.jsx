import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Activity, 
  Pill, 
  FileText, 
  Clock, 
  ChevronRight,
  Plus,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Skeleton } from '../../component/SkeletonLoader';
import { EmptyState } from '../../component/EmptyState';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    appointments: 0,
    prescriptions: 0,
    testResults: 0,
    unpaidBills: 0
  });
  const [nextAppointment, setNextAppointment] = useState(null);
  const [activePrescriptions, setActivePrescriptions] = useState([]);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
      fetchDashboardData();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [aptRes, presRes, recordsRes, billsRes] = await Promise.all([
        api.getAppointments(),
        api.getPrescriptions(),
        api.getMedicalRecords(),
        api.getInvoices()
      ]);

      const appointments = aptRes.data?.data || aptRes.data || [];
      const prescriptions = presRes.data?.data || presRes.data || [];
      const records = recordsRes.data?.data || recordsRes.data || [];
      const bills = billsRes.data?.data || billsRes.data || [];

      // Calculate stats
      const upcomingApts = appointments.filter(a => new Date(a.appointmentDate) >= new Date() && a.status !== 'cancelled');
      const activePresc = prescriptions.filter(p => p.status === 'pending');
      const unpaid = bills.filter(b => b.status === 'pending');

      setStats({
        appointments: upcomingApts.length,
        prescriptions: activePresc.length,
        testResults: records.length,
        unpaidBills: unpaid.reduce((acc, curr) => acc + (curr.amount || 0), 0)
      });

      // Next appointment
      if (upcomingApts.length > 0) {
        const sorted = upcomingApts.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
        setNextAppointment(sorted[0]);
      }

      setActivePrescriptions(activePresc.slice(0, 3)); // Top 3
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Upcoming Visits', value: stats.appointments, icon: Calendar, color: 'blue' },
    { title: 'Active Prescriptions', value: stats.prescriptions, icon: Pill, color: 'emerald' },
    { title: 'Recent Results', value: stats.testResults, icon: Activity, color: 'amber' },
    { title: 'Unpaid Bills', value: `$${stats.unpaidBills}`, icon: FileText, color: 'red' }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-slate-900/10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'Patient'}
          </h1>
          <p className="text-slate-300 mt-2 font-medium">Here is an overview of your health and upcoming activities.</p>
        </div>
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/patient/appointments')}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus size={18} />
            Book Appointment
          </motion.button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.title}</h3>
              <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${colorClasses[stat.color]}`}>
                <stat.icon size={20} />
              </div>
            </div>
            {loading ? (
              <Skeleton height="h-10" width="w-20" />
            ) : (
              <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Appointment */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Next Appointment</h3>
            <button 
              onClick={() => navigate('/patient/appointments')}
              className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="space-y-4">
                <Skeleton height="h-24" />
              </div>
            ) : nextAppointment ? (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col sm:flex-row items-start gap-5 hover:bg-slate-100 transition-colors cursor-pointer group" onClick={() => navigate('/patient/appointments')}>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center w-full sm:w-auto sm:min-w-[70px] group-hover:border-primary/20 group-hover:shadow-primary/5 transition-all shrink-0">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {new Date(nextAppointment.appointmentDate).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-2xl font-black text-primary">
                    {new Date(nextAppointment.appointmentDate).getDate()}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors">{nextAppointment.reason || 'General Checkup'}</h4>
                  <p className="text-sm text-slate-500 font-medium mb-3">Dr. {nextAppointment.doctorId?.name || 'Assigned Doctor'} • {nextAppointment.doctorId?.specialization || 'General'}</p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-flex shadow-sm">
                    <Clock size={14} className="text-primary" />
                    {new Date(nextAppointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState 
                icon={Calendar} 
                title="No upcoming visits" 
                description="You have no scheduled appointments."
                action={() => navigate('/patient/appointments')}
                actionLabel="Book Appointment"
                size="small"
              />
            )}
          </div>
        </motion.div>

        {/* Current Medications */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Current Medications</h3>
            <button 
              onClick={() => navigate('/patient/prescriptions')}
              className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="flex-1">
            {loading ? (
              <div className="space-y-3">
                <Skeleton height="h-16" />
                <Skeleton height="h-16" />
                <Skeleton height="h-16" />
              </div>
            ) : activePrescriptions.length > 0 ? (
              <div className="space-y-3">
                {activePrescriptions.map((presc) => (
                  presc.medications?.map((med, idx) => (
                    <div key={`${presc._id}-${idx}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                          <Pill size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{med.name}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-1">{med.dosage} • {med.frequency}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" />
                    </div>
                  ))
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Pill} 
                title="No active prescriptions" 
                description="You don't have any current medications."
                size="small"
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PatientDashboard;
