import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../../component/SkeletonLoader';
import { EmptyState } from '../../component/EmptyState';

const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200"
  };

  const icons = {
    confirmed: <CheckCircle2 size={14} />,
    completed: <CheckCircle2 size={14} />,
    cancelled: <XCircle size={14} />,
    pending: <AlertCircle size={14} />,
    scheduled: <CalendarIcon size={14} />
  };

  return (
    <span className={cn("px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 w-fit uppercase tracking-wider", styles[status] || styles.pending)}>
      {icons[status] || icons.pending} {status}
    </span>
  );
};

const AppointmentCard = ({ appointment, onCancel, isCancelling }) => {
  const doctorName = appointment.doctorId?.name || 'Unassigned Doctor';
  const department = appointment.doctorId?.specialization || 'General';
  const aptDate = new Date(appointment.appointmentDate);
  const isValidDate = !isNaN(aptDate.getTime());

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <User size={24} />
          </div>
          <div>
            <h4 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">Dr. {doctorName}</h4>
            <p className="text-sm font-medium text-slate-500">{department}</p>
          </div>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex-1">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
            <div className="p-1.5 bg-white rounded-lg shadow-sm text-slate-400">
              <CalendarIcon size={16} />
            </div>
            {isValidDate ? aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
            <div className="p-1.5 bg-white rounded-lg shadow-sm text-slate-400">
              <Clock size={16} />
            </div>
            {isValidDate ? aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold col-span-2">
            <div className="p-1.5 bg-white rounded-lg shadow-sm text-slate-400">
              <MapPin size={16} />
            </div>
            {appointment.location || 'Hospital Main Building'}
          </div>
        </div>
      </div>

      {appointment.notes && (
        <div className="mb-4">
          <p className="text-sm text-slate-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
            <span className="font-bold text-amber-900 block mb-1">Notes:</span> 
            {appointment.notes}
          </p>
        </div>
      )}

      {appointment.status === 'scheduled' && (
        <div className="mt-auto pt-2">
          <button 
            disabled={isCancelling}
            onClick={() => onCancel(appointment._id)} 
            className="w-full bg-white border-2 border-red-100 hover:border-red-200 hover:bg-red-50 text-red-600 py-3 rounded-2xl text-sm font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
            Cancel Appointment
          </button>
        </div>
      )}
    </motion.div>
  );
};

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const [newAppointment, setNewAppointment] = useState({
    doctorId: '',
    appointmentDate: '',
    time: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aptRes, docRes] = await Promise.all([
        api.getAppointments(),
        api.getDoctors()
      ]);
      setAppointments(aptRes.data?.data || aptRes.data || []);
      setDoctors(docRes.data?.data || docRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      setIsBooking(true);
      const dateTime = new Date(`${newAppointment.appointmentDate}T${newAppointment.time}`);
      
      await api.createAppointment({
        doctorId: newAppointment.doctorId,
        appointmentDate: dateTime,
        reason: newAppointment.reason
      });
      
      toast.success('Appointment booked successfully!');
      setShowModal(false);
      setNewAppointment({ doctorId: '', appointmentDate: '', time: '', reason: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to book appointment', err);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        setCancellingId(id);
        await api.updateAppointment(id, { status: 'cancelled' });
        toast.success('Appointment cancelled successfully.');
        fetchData();
      } catch (err) {
        console.error('Failed to cancel appointment', err);
        toast.error('Failed to cancel appointment. Please try again.');
      } finally {
        setCancellingId(null);
      }
    }
  };

  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const upcomingAppointments = safeAppointments.filter(a => a?.appointmentDate && new Date(a.appointmentDate) >= new Date() && a.status !== 'cancelled');
  const pastAppointments = safeAppointments.filter(a => !a?.appointmentDate || new Date(a.appointmentDate) < new Date() || a.status === 'cancelled');
  
  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your upcoming visits and view past history.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-xl shadow-primary/20 transition-all w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          Book Appointment
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={cn("px-6 py-2.5 rounded-xl font-bold text-sm transition-all relative", activeTab === 'upcoming' ? "text-slate-900" : "text-slate-500 hover:text-slate-700")}
        >
          {activeTab === 'upcoming' && (
            <motion.div layoutId="apt-tab" className="absolute inset-0 bg-white rounded-xl shadow-sm" />
          )}
          <span className="relative z-10 flex items-center gap-2">Upcoming <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-xs">{upcomingAppointments.length}</span></span>
        </button>
        <button 
          onClick={() => setActiveTab('past')}
          className={cn("px-6 py-2.5 rounded-xl font-bold text-sm transition-all relative", activeTab === 'past' ? "text-slate-900" : "text-slate-500 hover:text-slate-700")}
        >
          {activeTab === 'past' && (
            <motion.div layoutId="apt-tab" className="absolute inset-0 bg-white rounded-xl shadow-sm" />
          )}
          <span className="relative z-10 flex items-center gap-2">Past & Cancelled <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-xs">{pastAppointments.length}</span></span>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard count={3} />
          </div>
        ) : displayedAppointments.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {displayedAppointments.map(apt => (
                <AppointmentCard 
                  key={apt._id} 
                  appointment={apt} 
                  onCancel={handleCancel} 
                  isCancelling={cancellingId === apt._id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mt-6">
            <EmptyState 
              icon={CalendarIcon} 
              title={activeTab === 'upcoming' ? "No upcoming appointments" : "No past appointments"} 
              description={activeTab === 'upcoming' ? "You're all caught up! Book a new appointment if you need to see a doctor." : "Your appointment history will appear here."}
              action={activeTab === 'upcoming' ? () => setShowModal(true) : undefined}
              actionLabel="Book Now"
            />
          </div>
        )}
      </div>

      {/* Booking Modal (Slide Over) */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-100"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-900">Book Appointment</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="booking-form" onSubmit={handleBook} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Select Doctor</label>
                    <select 
                      required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-700 outline-hidden"
                      value={newAppointment.doctorId}
                      onChange={(e) => setNewAppointment({...newAppointment, doctorId: e.target.value})}
                    >
                      <option value="">-- Choose a Specialist --</option>
                      {doctors.map(d => (
                        <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialization})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">Date</label>
                      <input 
                        type="date" 
                        required 
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-700 outline-hidden"
                        value={newAppointment.appointmentDate} 
                        onChange={e => setNewAppointment({...newAppointment, appointmentDate: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">Time</label>
                      <input 
                        type="time" 
                        required 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-700 outline-hidden"
                        value={newAppointment.time} 
                        onChange={e => setNewAppointment({...newAppointment, time: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Reason for Visit</label>
                    <textarea 
                      required 
                      placeholder="Please briefly describe your symptoms or reason for the visit..."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 h-32 resize-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-700 outline-hidden"
                      value={newAppointment.reason} 
                      onChange={e => setNewAppointment({...newAppointment, reason: e.target.value})} 
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 py-3.5 font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    form="booking-form"
                    disabled={isBooking}
                    className="flex-1 py-3.5 font-bold text-white bg-primary border-2 border-primary hover:bg-primary/90 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isBooking ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    Confirm Booking
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientAppointments;
