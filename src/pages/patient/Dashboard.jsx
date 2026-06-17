import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Activity, 
  Pill, 
  FileText, 
  Clock, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
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
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Patient'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Here is an overview of your health and upcoming activities.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/patient/appointments')}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
        >
          <Plus size={18} />
          Book Appointment
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming Visits</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.appointments}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Prescriptions</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Pill size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.prescriptions}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Test Results</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.testResults}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unpaid Bills</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <FileText size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">${stats.unpaidBills}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Next Appointment</h3>
            <button 
              onClick={() => navigate('/patient/appointments')}
              className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          {nextAppointment ? (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-w-[70px]">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  {new Date(nextAppointment.appointmentDate).toLocaleString('default', { month: 'short' })}
                </span>
                <span className="text-2xl font-black text-primary">
                  {new Date(nextAppointment.appointmentDate).getDate()}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{nextAppointment.reason || 'General Checkup'}</h4>
                <p className="text-sm text-slate-500 font-medium">Dr. {nextAppointment.doctorId?.name || 'Assigned Doctor'}</p>
                <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-flex">
                  <Clock size={14} className="text-primary" />
                  {new Date(nextAppointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
              No upcoming appointments.
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Current Medications</h3>
            <button 
              onClick={() => navigate('/patient/prescriptions')}
              className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {activePrescriptions.length > 0 ? (
              activePrescriptions.map((presc) => (
                presc.medications?.map((med, idx) => (
                  <div key={`${presc._id}-${idx}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Pill size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{med.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{med.dosage} - {med.frequency}</p>
                      </div>
                    </div>
                  </div>
                ))
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                No active prescriptions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
