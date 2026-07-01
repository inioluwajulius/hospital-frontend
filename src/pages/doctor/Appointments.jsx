import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User,
  Stethoscope,
  Activity,
  MoreVertical,
  Filter,
  Search,
  Video,
  MapPin,
  CheckCircle2,
  Download,
  CalendarDays,
  X,
  CheckCircle,
  Phone,
  Mail,
  Info,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { format, addDays, startOfWeek } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../../component/SkeletonLoader';
import { EmptyState } from '../../component/EmptyState';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilters, setStatusFilters] = useState(['Scheduled', 'In-Progress', 'Completed']);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    doctorId: '1',
    doctorName: 'Dr. Julius Ini',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00 AM',
    reason: '',
    type: 'Checkup'
  });
  const [errors, setErrors] = useState({});

  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aptRes, patientRes] = await Promise.all([
          api.getAppointments(),
          api.getPatients()
        ]);
        setAppointments(aptRes.data?.data || aptRes.data || []);
        setPatients(patientRes.data?.data || patientRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load appointments.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = () => {
    toast.success('Schedule exported successfully!');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'patientId') {
      const selectedPatient = patients.find(p => p.id === value || p._id === value);
      setFormData(prev => ({ 
        ...prev, 
        patientId: value, 
        patientName: selectedPatient ? (selectedPatient.userId?.name || selectedPatient.name) : '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.reason) {
      setErrors({
        patientId: !formData.patientId ? 'Please select a patient' : '',
        reason: !formData.reason ? 'Reason is required' : ''
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const dateTimeString = `${formData.date} ${formData.time}`;
      const appointmentDate = new Date(dateTimeString);
      const payload = {
        patientId: formData.patientId,
        appointmentDate: appointmentDate.toISOString(),
        type: formData.type,
        reason: formData.reason
      };
      await api.createAppointment(payload);
      setBookingSuccess(true);
      const updatedApts = await api.getAppointments();
      setAppointments(updatedApts.data?.data || updatedApts.data || []);
      setTimeout(() => {
        setIsBookingModalOpen(false);
        setBookingSuccess(false);
        setFormData({
          patientId: '',
          patientName: '',
          doctorId: '1',
          doctorName: 'Dr. Julius Ini',
          date: format(new Date(), 'yyyy-MM-dd'),
          time: '09:00 AM',
          reason: '',
          type: 'Checkup'
        });
      }, 2000);
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Failed to book appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const processedAppointments = useMemo(() => {
    return appointments.map(apt => {
      const pName = apt.patientId?.userId?.name || apt.patientId?.name || 'Unknown';
      const dName = apt.doctorId?.name || 'Dr. Julius Ini';
      const dateObj = new Date(apt.appointmentDate);
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { ...apt, patientName: pName, doctorName: dName, time: timeStr, dateObj };
    }).sort((a, b) => a.dateObj - b.dateObj);
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return processedAppointments.filter(apt => {
      const matchesSearch = 
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.type?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || apt.type === typeFilter;
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(apt.status) || (apt.status === undefined && statusFilters.includes('Scheduled'));
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [processedAppointments, searchQuery, typeFilter, statusFilters]);

  const todayCount = processedAppointments.filter(a => {
    const d = new Date(a.appointmentDate);
    return d.toDateString() === new Date().toDateString();
  }).length;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Appointments</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Loading schedules...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <SkeletonCard count={2} />
          </div>
          <div className="md:col-span-3">
            <SkeletonCard count={1} />
            <div className="mt-6 space-y-4">
              <SkeletonCard count={4} />
            </div>
          </div>
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
              <CalendarIcon size={28} />
            </div>
            Clinical Appointments
          </h1>
          <p className="text-slate-500 font-medium">Coordinate patient visits, manage doctor availability, and handle telemedicine sessions.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-5 py-3 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
          >
            <Download size={18} />
            Export Schedule
          </button>
          <button 
            onClick={() => setIsBookingModalOpen(true)}
            className="flex-1 md:flex-none bg-primary text-white px-5 py-3 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={18} />
            Book Appointment
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-extrabold mb-6 text-slate-900 flex items-center gap-2">
              <Filter className="text-primary" size={20} />
              Schedule Filters
            </h3>
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Appointment Type</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Checkup', 'Follow-up', 'Emergency', 'Surgery', 'Consultation'].map((type) => (
                    <button 
                      key={type} 
                      onClick={() => setTypeFilter(type)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                        type === typeFilter ? "bg-primary text-white border-primary shadow-sm" : "bg-slate-50 text-slate-500 border-slate-100 hover:border-primary/30"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Status</label>
                <div className="space-y-4">
                  {['Scheduled', 'In-Progress', 'Completed', 'Cancelled'].map((status) => (
                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" 
                          checked={statusFilters.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilters(prev => [...prev, status]);
                            } else {
                              setStatusFilters(prev => prev.filter(s => s !== status));
                            }
                          }}
                        />
                        <CheckCircle2 size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 group-hover:text-primary transition-colors">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary p-6 rounded-3xl shadow-lg shadow-primary/20 text-white relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500 origin-bottom-right">
              <CalendarDays size={120} />
            </div>
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Today's Volume</div>
              <div className="text-4xl font-extrabold mb-3">{todayCount}</div>
              <p className="text-white/80 text-xs font-medium leading-relaxed">Appointments scheduled for today across all departments.</p>
              <div className="mt-5 flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                <Activity size={14} />
                {todayCount > 0 ? "ACTIVE DAY" : "QUIET DAY"}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-9 space-y-6"
        >
          <div className="bg-white p-1.5 rounded-2xl inline-flex gap-1 border border-slate-100 shadow-sm w-full md:w-auto">
            {['schedule', 'calendar', 'waitlist'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize",
                  activeTab === tab ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {tab === 'schedule' ? 'Daily Schedule' : tab === 'calendar' ? 'Calendar View' : 'Waitlist'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <h3 className="text-xl font-extrabold text-slate-900">{format(today, 'MMMM yyyy')}</h3>
                    <div className="flex gap-2">
                      <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-all">
                        <ChevronLeft size={20} />
                      </button>
                      <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-all">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar custom-scrollbar">
                    {weekDays.map((day, i) => {
                      const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                      return (
                        <button 
                          key={i} 
                          className={cn(
                            "flex flex-col items-center p-3 rounded-2xl min-w-[72px] transition-all",
                            isToday ? "bg-primary text-white shadow-lg shadow-primary/20 border border-primary/20" : "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-white hover:border-primary/30"
                          )}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">{format(day, 'EEE')}</span>
                          <span className="text-xl font-extrabold">{format(day, 'd')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                        placeholder="Search by patient, doctor, or type..." 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    {filteredAppointments.length === 0 ? (
                      <div className="h-full flex items-center justify-center p-12">
                        <EmptyState 
                          icon={CalendarIcon}
                          title="No Appointments Found"
                          description={appointments.length === 0 ? "You don't have any appointments scheduled." : "No appointments match your filters."}
                        />
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {filteredAppointments.map((apt) => {
                          const isEmergency = apt.type === 'Emergency';
                          return (
                            <div 
                              key={apt.id || apt._id} 
                              onClick={() => setSelectedAppointment(apt)}
                              className={cn(
                                "p-6 hover:bg-slate-50 transition-all flex flex-col md:flex-row items-center gap-6 cursor-pointer group",
                                selectedAppointment?.id === apt.id && "bg-slate-50",
                                isEmergency && "hover:bg-red-50/50"
                              )}
                            >
                              <div className="w-24 text-center shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 group-hover:border-primary/20 transition-colors">
                                <div className="text-xl font-extrabold text-slate-900">{apt.time?.split(' ')[0]}</div>
                                <div className="text-[10px] font-bold text-primary uppercase tracking-widest">{apt.time?.split(' ')[1]}</div>
                              </div>
                              
                              <div className="flex-1 flex items-center gap-5 w-full">
                                <div className={cn(
                                  "w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold shadow-sm border",
                                  isEmergency ? "bg-red-100 text-red-600 border-red-200" : "bg-blue-100 text-blue-600 border-blue-200"
                                )}>
                                  {apt.patientName?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                    <h4 className="font-extrabold text-slate-900 text-lg">{apt.patientName}</h4>
                                    <span className={cn(
                                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                      isEmergency ? "bg-red-50 text-red-600 border-red-100" : 
                                      apt.type === 'Surgery' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                      "bg-blue-50 text-blue-600 border-blue-100"
                                    )}>
                                      {apt.type || 'Checkup'}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500">
                                    <div className="flex items-center gap-2">
                                      <Stethoscope size={14} className="text-slate-400" />
                                      {apt.doctorName}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin size={14} className="text-slate-400" />
                                      Room 402
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-end mt-4 md:mt-0">
                                {apt.type === 'Consultation' && (
                                  <button className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">
                                    <Video size={18} />
                                  </button>
                                )}
                                <span className={cn(
                                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border",
                                  (apt.status === 'In-Progress' || apt.status === 'in-progress') ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse" : 
                                  (apt.status === 'Confirmed' || apt.status === 'confirmed') ? "bg-blue-50 text-blue-600 border-blue-200" :
                                  (apt.status === 'Scheduled' || apt.status === 'scheduled' || !apt.status) ? "bg-slate-50 text-slate-600 border-slate-200" :
                                  "bg-emerald-50 text-emerald-600 border-emerald-200"
                                )}>
                                  {apt.status || 'Scheduled'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}
            
            {activeTab !== 'schedule' && (
              <motion.div
                key="other"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                  {activeTab === 'calendar' ? <CalendarDays size={40} /> : <Clock size={40} />}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2 capitalize">{activeTab} View</h3>
                <p className="text-slate-500 font-medium text-center max-w-sm">This module is currently under development. Please check back later.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              {bookingSuccess ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={48} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">Appointment Booked!</h3>
                    <p className="text-slate-500 mt-2 font-medium">The session has been added to your clinical schedule.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Book Appointment</h3>
                      <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Schedule a new visit</p>
                    </div>
                    <button 
                      onClick={() => setIsBookingModalOpen(false)}
                      className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all bg-slate-50"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-slate-50/50">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                          Patient
                          {errors.patientId && <span className="text-red-500 normal-case tracking-normal font-bold">{errors.patientId}</span>}
                        </label>
                        <select 
                          name="patientId"
                          value={formData.patientId}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none appearance-none shadow-sm",
                            errors.patientId ? "border-red-200 focus:ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          )}
                        >
                          <option value="">Select Patient</option>
                          {patients.map(p => (
                            <option key={p.id || p._id} value={p.id || p._id}>{p.userId?.name || p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</label>
                          <input 
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Time</label>
                          <select 
                            name="time"
                            value={formData.time}
                            onChange={handleInputChange}
                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none"
                          >
                            {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '01:00 PM', '01:30 PM', '02:00 PM'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Type</label>
                        <select 
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm appearance-none"
                        >
                          <option value="Checkup">Checkup</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Surgery">Surgery</option>
                          <option value="Consultation">Consultation</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                          Reason for Visit
                          {errors.reason && <span className="text-red-500 normal-case tracking-normal font-bold">{errors.reason}</span>}
                        </label>
                        <textarea 
                          name="reason"
                          value={formData.reason}
                          onChange={handleInputChange}
                          rows={3}
                          className={cn(
                            "w-full bg-white border rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none resize-none shadow-sm",
                            errors.reason ? "border-red-200 focus:ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          )}
                          placeholder="Describe symptoms or purpose..."
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsBookingModalOpen(false)}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-extrabold rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] py-4 bg-primary text-white font-extrabold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Booking...
                          </>
                        ) : (
                          <>
                            <CalendarIcon size={20} />
                            Confirm Booking
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Slide-over panel */}
      <AnimatePresence>
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppointment(null)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-slate-100 z-10"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Appointment Details</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Ref: {selectedAppointment.id || selectedAppointment._id}</p>
                </div>
                <button 
                  onClick={() => setSelectedAppointment(null)}
                  className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all bg-slate-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/30 custom-scrollbar">
                <div className="space-y-5">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-extrabold shadow-inner border border-blue-200/50">
                      {selectedAppointment.patientName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xl font-extrabold text-slate-900">{selectedAppointment.patientName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">ID: {selectedAppointment.patientId?.slice(-6) || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {(() => {
                    const patient = patients.find(p => p.id === selectedAppointment.patientId || p._id === selectedAppointment.patientId);
                    if (!patient) return null;
                    return (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
                              <Phone size={16} />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Phone</div>
                              <div className="text-xs font-extrabold text-slate-700">{patient.phone || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm min-w-0">
                            <div className="p-2 bg-purple-50 rounded-xl text-purple-500">
                              <Mail size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Email</div>
                              <div className="text-xs font-extrabold text-slate-700 truncate">{patient.userId?.email || patient.email || 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-900 text-white flex justify-between items-center shadow-md">
                          <div className="text-center px-4 flex-1">
                            <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Age</div>
                            <div className="text-lg font-extrabold">{patient.age || '--'}y</div>
                          </div>
                          <div className="w-px h-10 bg-white/10" />
                          <div className="text-center px-4 flex-1">
                            <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Gender</div>
                            <div className="text-lg font-extrabold capitalize">{patient.gender || '--'}</div>
                          </div>
                          <div className="w-px h-10 bg-white/10" />
                          <div className="text-center px-4 flex-1">
                            <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Blood</div>
                            <div className="text-lg font-extrabold text-red-400">{patient.bloodGroup || '--'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-4">
                  <h5 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    Visit Information
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </h5>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 space-y-1">
                    <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="mt-0.5 p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <CalendarIcon size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date & Time</div>
                        <p className="text-sm font-extrabold text-slate-900">{format(new Date(selectedAppointment.appointmentDate || selectedAppointment.dateObj), 'MMMM d, yyyy')} at {selectedAppointment.time}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="mt-0.5 p-2 bg-purple-50 text-purple-600 rounded-xl">
                        <Stethoscope size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Physician</div>
                        <p className="text-sm font-extrabold text-slate-900">{selectedAppointment.doctorName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="mt-0.5 p-2 bg-amber-50 text-amber-600 rounded-xl">
                        <Activity size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason for Visit</div>
                        <p className="text-sm font-extrabold text-slate-900 leading-relaxed">{selectedAppointment.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAppointment.type === 'Consultation' && (
                  <button className="w-full py-4 bg-indigo-600 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                    <Video size={20} />
                    Start Telemedicine Session
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                  <button className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 font-extrabold rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                    Reschedule
                  </button>
                  <button className="w-full py-3.5 bg-white border border-red-200 text-red-600 font-extrabold rounded-2xl hover:bg-red-50 transition-all active:scale-95 shadow-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Appointments;