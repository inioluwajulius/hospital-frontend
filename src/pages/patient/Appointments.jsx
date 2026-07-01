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
  Loader2,
  ChevronLeft,
  ChevronRight,
  Activity,
  Stethoscope,
  AlignLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format, addMonths, subMonths, isToday } from 'date-fns';
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
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

  const stats = {
    upcoming: upcomingAppointments.length,
    completed: safeAppointments.filter(a => a.status === 'completed').length,
    cancelled: safeAppointments.filter(a => a.status === 'cancelled').length,
    nextAppointment: upcomingAppointments.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0]
  };

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-xl shadow-emerald-600/20 transition-all w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          Book Appointment
        </motion.button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><CalendarIcon size={24} /></div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.upcoming}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.completed}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><XCircle size={24} /></div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.cancelled}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cancelled</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Activity size={24} /></div>
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-slate-900 truncate">
              {stats.nextAppointment ? format(new Date(stats.nextAppointment.appointmentDate), 'MMM d, h:mm a') : 'None'}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next Visit</div>
          </div>
        </div>
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
        <button 
          onClick={() => setActiveTab('calendar')}
          className={cn("px-6 py-2.5 rounded-xl font-bold text-sm transition-all relative", activeTab === 'calendar' ? "text-slate-900" : "text-slate-500 hover:text-slate-700")}
        >
          {activeTab === 'calendar' && (
            <motion.div layoutId="apt-tab" className="absolute inset-0 bg-white rounded-xl shadow-sm" />
          )}
          <span className="relative z-10 flex items-center gap-2">Calendar</span>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard count={3} />
          </div>
        ) : activeTab === 'calendar' ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-900">{format(currentMonth, 'MMMM yyyy')}</h3>
              <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-bold text-slate-600 transition-colors">
                  Today
                </button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {weekDays.map(day => (
                <div key={day} className="bg-slate-50 py-3 text-center text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayAppointments = safeAppointments.filter(apt => apt.appointmentDate && isSameDay(new Date(apt.appointmentDate), day) && apt.status !== 'cancelled');
                
                return (
                  <div 
                    key={day.toString()} 
                    className={cn(
                      "min-h-[100px] bg-white p-2 transition-colors relative group",
                      !isSameMonth(day, currentMonth) && "bg-slate-50/50 text-slate-400",
                      isToday(day) && "bg-indigo-50/30"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn(
                        "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full",
                        isToday(day) ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-700"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayAppointments.slice(0, 3).map((apt, i) => (
                        <div key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold truncate border border-indigo-100/50">
                          {new Date(apt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Dr. {apt.doctorId?.name?.split(' ')[0]}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-[10px] font-bold text-slate-500 px-1">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-100"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Book Appointment</h2>
                  <p className="text-slate-500 font-medium text-xs mt-1">Schedule a visit with our specialists</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto px-6 py-8 bg-white relative z-20">
                <form id="booking-form" onSubmit={handleBook} className="space-y-6">
                  
                  {/* Doctor Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 ml-1">Select Specialist</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600">
                        <Stethoscope size={20} />
                      </div>
                      <select 
                        required
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-slate-700 outline-hidden appearance-none"
                        value={newAppointment.doctorId}
                        onChange={(e) => setNewAppointment({...newAppointment, doctorId: e.target.value})}
                      >
                        <option value="" disabled className="text-slate-400">-- Choose a Doctor --</option>
                        {doctors.map(d => (
                          <option key={d._id} value={d._id} className="font-medium text-slate-700">
                            Dr. {d.name} {d.specialization ? `— ${d.specialization}` : ''}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                        <ChevronRight size={18} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Date and Time Row */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600">
                          <CalendarIcon size={18} />
                        </div>
                        <input 
                          type="date" 
                          required 
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-slate-700 outline-hidden"
                          value={newAppointment.appointmentDate} 
                          onChange={e => setNewAppointment({...newAppointment, appointmentDate: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">Time</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600">
                          <Clock size={18} />
                        </div>
                        <input 
                          type="time" 
                          required 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-slate-700 outline-hidden"
                          value={newAppointment.time} 
                          onChange={e => setNewAppointment({...newAppointment, time: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reason text area */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 ml-1">Reason for Visit</label>
                    <div className="relative">
                      <div className="absolute top-4 left-0 pl-4 pointer-events-none text-emerald-600">
                        <AlignLeft size={20} />
                      </div>
                      <textarea 
                        required 
                        placeholder="Please describe your symptoms briefly..."
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-11 pr-4 py-4 h-36 resize-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-700 outline-hidden"
                        value={newAppointment.reason} 
                        onChange={e => setNewAppointment({...newAppointment, reason: e.target.value})} 
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 relative z-30">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="w-1/3 py-3.5 font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="booking-form"
                  disabled={isBooking}
                  className="flex-1 py-3.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isBooking ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Confirm Booking
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientAppointments;
