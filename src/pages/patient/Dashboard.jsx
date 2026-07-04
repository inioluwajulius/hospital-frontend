import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Activity, 
  Pill, 
  FileText, 
  Clock, 
  ChevronRight,
  Plus,
  ArrowRight,
  HeartPulse,
  Stethoscope,
  BellRing,
  Syringe,
  MessageSquare,
  Download,
  AlertCircle,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../contexts/CurrencyContext';
import { api } from '../../services/api';
import { Skeleton } from '../../component/SkeletonLoader';
import { EmptyState } from '../../component/EmptyState';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = useCurrency();
  const [stats, setStats] = useState({
    appointments: 0,
    prescriptions: 0,
    testResults: 0,
    unpaidBills: 0
  });
  const [nextAppointment, setNextAppointment] = useState(null);
  const [activePrescriptions, setActivePrescriptions] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [vitals, setVitals] = useState(null);
  const [immunizations, setImmunizations] = useState([]);
  const [insurance, setInsurance] = useState(null);

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
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.id || currentUser._id;
      
      const [aptRes, presRes, recordsRes, billsRes, notifRes, patientRes] = await Promise.all([
        api.getAppointments(),
        api.getPrescriptions(),
        api.getMedicalRecords(),
        api.getInvoices(),
        api.getNotifications().catch(() => ({ data: [] })),
        userId ? api.get(`/patients?userId=${userId}`).catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } })
      ]);

      const appointments = aptRes.data?.data || aptRes.data || [];
      const prescriptions = presRes.data?.data || presRes.data || [];
      const records = recordsRes.data?.data || recordsRes.data || [];
      const bills = billsRes.data?.data || billsRes.data || [];
      const notifications = notifRes.data?.data || notifRes.data || [];
      const patients = patientRes.data?.data || patientRes.data || [];

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
      
      // Recent records
      const sortedRecords = [...records].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setRecentRecords(sortedRecords.slice(0, 3));
      
      // Recent Bills
      const sortedBills = [...bills].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setRecentBills(sortedBills.slice(0, 2));
      
      // Patient details (immunizations, insurance)
      if (patients.length > 0) {
        setImmunizations(patients[0].immunizations || []);
        setInsurance(patients[0].insurance || null);
      }
      
      // Alerts mapping
      setAlerts(notifications.slice(0, 3).map((n, i) => ({
        id: n._id || i,
        type: (n.type === 'SYSTEM' || n.type === 'BILLING') ? 'warning' : 'info',
        message: n.message,
        actionText: n.link ? 'View' : '',
        path: n.link || '#'
      })));
      
      // Vitals from latest record
      const recordWithVitals = sortedRecords.find(r => r.vitals);
      if (recordWithVitals && recordWithVitals.vitals) {
        let bmiValue = '';
        if (recordWithVitals.vitals.weight && recordWithVitals.vitals.height) {
          const h = recordWithVitals.vitals.height / 100;
          bmiValue = (recordWithVitals.vitals.weight / (h * h)).toFixed(1);
        }
        setVitals({
          bloodPressure: recordWithVitals.vitals.bloodPressure || '--',
          heartRate: recordWithVitals.vitals.heartRate || '--',
          weight: recordWithVitals.vitals.weight || '--',
          height: recordWithVitals.vitals.height || '--',
          bmi: bmiValue || '--',
          lastUpdated: new Date(recordWithVitals.createdAt || recordWithVitals.date)
        });
      }
      
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
    { title: 'Unpaid Bills', value: formatAmount(stats.unpaidBills), icon: FileText, color: 'red' }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };
  
  const quickActions = [
    { name: 'Book Visit', icon: Calendar, color: 'blue', action: () => navigate('/patient/appointments') },
    { name: 'Request Refill', icon: Pill, color: 'emerald', action: () => navigate('/patient/prescriptions') },
    { name: 'Message Doctor', icon: MessageSquare, color: 'purple', action: () => alert('Messaging coming soon') },
    { name: 'Download Records', icon: Download, color: 'indigo', action: () => navigate('/patient/records') }
  ];

  return (
    <div className="space-y-6 pb-8">
      
      {/* Alerts & Notifications */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={alert.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border ${
                alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                {alert.type === 'warning' ? <AlertCircle size={20} className="shrink-0" /> : <BellRing size={20} className="shrink-0" />}
                <p className="font-medium text-sm">{alert.message}</p>
              </div>
              {alert.actionText && (
                <button 
                  onClick={() => navigate(alert.path)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                    alert.type === 'warning' ? 'bg-amber-200/50 hover:bg-amber-200 text-amber-900' : 'bg-blue-200/50 hover:bg-blue-200 text-blue-900'
                  }`}
                >
                  {alert.actionText}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Patient'}
            </h1>
            <p className="text-slate-300 mt-2 font-medium">Here is an overview of your health and upcoming activities.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto shrink-0">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/patient/appointments')}
              className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
            >
              <Plus size={18} />
              Book Appointment
            </motion.button>
          </div>
        </div>
        
        {/* Quick Actions Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
          {quickActions.map((action, idx) => (
            <button 
              key={idx}
              onClick={action.action}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group"
            >
              <div className={`p-2 rounded-lg ${colorClasses[action.color]} group-hover:scale-110 transition-transform`}>
                <action.icon size={18} />
              </div>
              <span className="font-semibold text-sm text-slate-200 group-hover:text-white">{action.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4 gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate min-w-0">{stat.title}</h3>
              <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 shrink-0 ${colorClasses[stat.color]}`}>
                <stat.icon size={20} />
              </div>
            </div>
            {loading ? (
              <Skeleton height="h-10" width="w-20" />
            ) : (
              <p className="text-3xl font-extrabold text-slate-900 truncate">{stat.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-6 lg:space-y-8">
          
          {/* Next Appointment */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="text-primary" size={20} />
                Next Appointment
              </h3>
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
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center w-full sm:w-auto sm:min-w-[80px] group-hover:border-primary/20 group-hover:shadow-primary/5 transition-all shrink-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {new Date(nextAppointment.appointmentDate).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-3xl font-black text-primary my-1">
                      {new Date(nextAppointment.appointmentDate).getDate()}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {new Date(nextAppointment.appointmentDate).toLocaleString('default', { weekday: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="font-bold text-slate-900 text-xl group-hover:text-primary transition-colors truncate">{nextAppointment.reason || 'General Checkup'}</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1 mb-4 flex items-center gap-2 truncate">
                      <Stethoscope size={16} className="shrink-0" />
                      Dr. {nextAppointment.doctorId?.name || 'Assigned Doctor'} • {nextAppointment.doctorId?.specialization || 'General'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                        <Clock size={14} className="text-primary shrink-0" />
                        <span>{new Date(nextAppointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize shadow-sm border ${
                          nextAppointment.status === 'scheduled' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          nextAppointment.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                        {nextAppointment.status}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState 
                  icon={Calendar} 
                  title="No upcoming visits" 
                  description="You have no scheduled appointments at the moment."
                  action={() => navigate('/patient/appointments')}
                  actionLabel="Book Appointment"
                  size="small"
                />
              )}
            </div>
          </motion.div>

          {/* Health Vitals Summary (Mock) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="text-rose-500" size={20} />
                Recent Vitals
              </h3>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                Last updated: {vitals ? vitals.lastUpdated.toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            {vitals ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50 flex flex-col">
                  <span className="text-xs font-bold text-rose-800/60 uppercase tracking-wider mb-2">Blood Pressure</span>
                  <span className="text-2xl font-black text-rose-600 truncate">{vitals.bloodPressure}</span>
                  <span className="text-xs font-medium text-rose-800/60 mt-1">mmHg</span>
                </div>
                <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/50 flex flex-col">
                  <span className="text-xs font-bold text-orange-800/60 uppercase tracking-wider mb-2">Heart Rate</span>
                  <span className="text-2xl font-black text-orange-600 truncate">{vitals.heartRate}</span>
                  <span className="text-xs font-medium text-orange-800/60 mt-1">bpm</span>
                </div>
                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 flex flex-col">
                  <span className="text-xs font-bold text-emerald-800/60 uppercase tracking-wider mb-2">Weight</span>
                  <span className="text-2xl font-black text-emerald-600 truncate">{vitals.weight}</span>
                  <span className="text-xs font-medium text-emerald-800/60 mt-1">kg</span>
                </div>
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex flex-col">
                  <span className="text-xs font-bold text-blue-800/60 uppercase tracking-wider mb-2">BMI</span>
                  <span className="text-2xl font-black text-blue-600 truncate">{vitals.bmi}</span>
                  <span className="text-xs font-medium text-blue-800/60 mt-1">Normal</span>
                </div>
              </div>
            ) : (
              <EmptyState 
                icon={HeartPulse} 
                title="No vitals recorded" 
                description="Your vitals from your visits will appear here."
                size="small"
              />
            )}
          </motion.div>

          {/* Immunizations (Mock) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Syringe className="text-teal-500" size={20} />
                Immunizations & Preventative
              </h3>
            </div>
            
            <div className="space-y-3">
              {immunizations && immunizations.length > 0 ? immunizations.map(imm => (
                <div key={imm.id || imm._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${imm.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <div>
                      <h4 className="font-bold text-slate-900">{imm.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{imm.status === 'completed' ? 'Given on' : 'Due by'} {new Date(imm.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${
                    imm.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {imm.status}
                  </div>
                </div>
              )) : (
                <EmptyState 
                  icon={Syringe} 
                  title="No immunizations found" 
                  description="Your immunization records will appear here."
                  size="small"
                />
              )}
            </div>
          </motion.div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-6 lg:space-y-8">
          
          {/* Current Medications */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Pill className="text-emerald-500" size={20} />
                Current Medications
              </h3>
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
                </div>
              ) : activePrescriptions.length > 0 ? (
                <div className="space-y-3">
                  {activePrescriptions.map((presc) => (
                    presc.medications?.map((med, idx) => (
                      <div key={`${presc._id}-${idx}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="p-2.5 bg-white shadow-sm border border-slate-200 text-emerald-600 rounded-xl shrink-0">
                            <Pill size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{med.name}</h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{med.dosage} • {med.frequency}</p>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-slate-300 shrink-0 ml-4" />
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

          {/* Recent Medical History */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="text-blue-500" size={20} />
                Recent History
              </h3>
              <button 
                onClick={() => navigate('/patient/records')}
                className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                View All <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="flex-1 relative">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton height="h-14" />
                  <Skeleton height="h-14" />
                </div>
              ) : recentRecords.length > 0 ? (
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {recentRecords.map((record, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3 pl-8 md:pl-0">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute left-0 md:left-1/2 -translate-x-1/2"></div>
                      <div className="w-full md:w-[calc(50%-1.5rem)] bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{record.diagnosis || record.type || 'Visit'}</h4>
                          <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-xs border border-slate-100 shrink-0 ml-2">
                            {new Date(record.createdAt || record.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{record.doctor?.name ? `Dr. ${record.doctor.name}` : 'Hospital Visit'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={FileText} 
                  title="No recent history" 
                  description="Your recent visits will appear here."
                  size="small"
                />
              )}
            </div>
          </motion.div>

          {/* Insurance & Billing Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="text-indigo-500" size={20} />
                Billing & Insurance
              </h3>
              <button 
                onClick={() => navigate('/patient/billing')}
                className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                Billing <ChevronRight size={16} />
              </button>
            </div>
            
            {insurance ? (
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900/60 uppercase tracking-wider">Primary Insurance</h4>
                    <p className="font-bold text-indigo-900">{insurance.provider || 'N/A'} - {insurance.policyNumber || 'N/A'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${insurance.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{insurance.status || 'Active'}</span>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 text-slate-600 rounded-lg shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Insurance</h4>
                    <p className="font-bold text-slate-900">No insurance on file</p>
                  </div>
                </div>
              </div>
            )}

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Invoices</h4>
            
            <div className="flex-1">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton height="h-12" />
                  <Skeleton height="h-12" />
                </div>
              ) : recentBills.length > 0 ? (
                <div className="space-y-3">
                  {recentBills.map((bill, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-sm text-slate-900 truncate">{bill.description || 'Medical Services'}</span>
                        <span className="text-xs text-slate-500 truncate">{new Date(bill.createdAt || bill.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-bold text-sm text-slate-900">{formatAmount(bill.amount)}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${bill.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {bill.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={FileText} 
                  title="No recent bills" 
                  description="You are all caught up."
                  size="small"
                />
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
