import React, { useState, useEffect } from 'react';
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
  Loader2,
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
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { format, addDays, startOfWeek } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const Appointments = ({ showNotification } = {}) => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilters, setStatusFilters] = useState(['Scheduled', 'In-Progress', 'Completed']);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleExport = () => {
    if (showNotification) {
      showNotification('Exporting appointment schedule...', 'info');
      setTimeout(() => {
        showNotification('Schedule exported successfully!', 'success');
      }, 2000);
    }
  };

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
        const [aptData, patientData] = await Promise.all([
          api.getAppointments(),
          api.getPatients()
        ]);
        setAppointments(aptData);
        setPatients(patientData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'patientId') {
      const selectedPatient = patients.find(p => p.id === value);
      setFormData(prev => ({ 
        ...prev, 
        patientId: value, 
        patientName: selectedPatient ? selectedPatient.name : '' 
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
      await api.createAppointment(formData);
      setBookingSuccess(true);
      
      const updatedApts = await api.getAppointments();
      setAppointments(updatedApts);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'All' || apt.type === typeFilter;
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(apt.status);

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading appointment schedules...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Appointments & Scheduling</h1>
          <p className="text-slate-500 mt-1 font-medium">Coordinate patient visits, manage doctor availability, and handle telemedicine sessions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="bg-slate-100 text-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-all"
          >
            <Download size={18} />
            Export Schedule
          </button>
          <button 
            onClick={() => setIsBookingModalOpen(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Book Appointment
          </button>
        </div>
      </div>

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
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Appointment Booked</h3>
                    <p className="text-slate-500 mt-2">The session has been added to the clinical schedule.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Book Appointment</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Schedule a new patient visit</p>
                    </div>
                    <button 
                      onClick={() => setIsBookingModalOpen(false)}
                      className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                          Patient
                          {errors.patientId && <span className="text-red-500 normal-case tracking-normal font-medium">{errors.patientId}</span>}
                        </label>
                        <select 
                          name="patientId"
                          value={formData.patientId}
                          onChange={handleInputChange}
                          className={cn(
                            "w-full bg-slate-50 border rounded-xl p-3 text-sm transition-all outline-none appearance-none",
                            errors.patientId ? "border-red-200 focus:ring-red-100" : "border-transparent focus:ring-primary/20 focus:bg-white"
                          )}
                        >
                          <option value="">Select Patient</option>
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</label>
                          <input 
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Time</label>
                          <select 
                            name="time"
                            value={formData.time}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white"
                          >
                            {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '01:00 PM', '01:30 PM', '02:00 PM'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Appointment Type</label>
                        <select 
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-sm transition-all outline-none focus:ring-primary/20 focus:bg-white"
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
                          {errors.reason && <span className="text-red-500 normal-case tracking-normal font-medium">{errors.reason}</span>}
                        </label>
                        <textarea 
                          name="reason"
                          value={formData.reason}
                          onChange={handleInputChange}
                          rows={3}
                          className={cn(
                            "w-full bg-slate-50 border rounded-xl p-3 text-sm transition-all outline-none resize-none",
                            errors.reason ? "border-red-200 focus:ring-red-100" : "border-transparent focus:ring-primary/20 focus:bg-white"
                          )}
                          placeholder="Describe the symptoms or purpose..."
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsBookingModalOpen(false)}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
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

      <AnimatePresence>
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppointment(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Appointment Details</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Reference ID: {selectedAppointment.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedAppointment(null)}
                  className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <User size={32} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{selectedAppointment.patientName}</h4>
                      <p className="text-sm text-slate-500 font-medium">Patient ID: {selectedAppointment.patientId}</p>
                    </div>
                  </div>
                  
                  {(() => {
                    const patient = patients.find(p => p.id === selectedAppointment.patientId);
                    if (!patient) return null;
                    return (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm">
                              <Phone size={16} />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Phone</div>
                              <div className="text-xs font-bold text-slate-700">{patient.phone}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-0">
                            <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm">
                              <Mail size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Email</div>
                              <div className="text-xs font-bold text-slate-700 truncate">{patient.email}</div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900 text-white flex justify-between items-center">
                          <div className="text-center px-2">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Age</div>
                            <div className="text-sm font-bold">{patient.age}y</div>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div className="text-center px-2">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gender</div>
                            <div className="text-sm font-bold">{patient.gender}</div>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div className="text-center px-2">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Blood</div>
                            <div className="text-sm font-bold text-red-400">{patient.bloodGroup}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/50 border border-blue-100">
                          <div className="mt-0.5 text-blue-500">
                            <Info size={16} />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Address</div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{patient.address}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Visit Information</h5>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <CalendarIcon size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Date & Time</div>
                        <p className="text-sm text-slate-500">{format(new Date(selectedAppointment.date), 'MMMM d, yyyy')} at {selectedAppointment.time}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                        <Stethoscope size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Attending Physician</div>
                        <p className="text-sm text-slate-500">{selectedAppointment.doctorName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                        <Activity size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Reason for Visit</div>
                        <p className="text-sm text-slate-600 leading-relaxed">{selectedAppointment.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Clinical Notes</h5>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 italic text-sm text-slate-600 leading-relaxed">
                    {selectedAppointment.notes || "No clinical notes available for this appointment yet."}
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Video size={18} />
                    Start Telemedicine Session
                  </button>
                  <button className="w-full py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95">
                    Reschedule Appointment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Schedule Filters</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Appointment Type</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Checkup', 'Follow-up', 'Emergency', 'Surgery'].map((type) => (
                    <button 
                      key={type} 
                      onClick={() => setTypeFilter(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border",
                        type === typeFilter ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200 hover:border-primary/30"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Status</label>
                <div className="space-y-3">
                  {['Scheduled', 'In-Progress', 'Completed', 'Cancelled'].map((status) => (
                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary" 
                        checked={statusFilters.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStatusFilters(prev => [...prev, status]);
                          } else {
                            setStatusFilters(prev => prev.filter(s => s !== status));
                          }
                        }}
                      />
                      <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary p-6 rounded-3xl shadow-lg shadow-primary/20 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Daily Volume</div>
              <div className="text-3xl font-extrabold mb-2">42</div>
              <p className="text-white/70 text-xs leading-relaxed">Appointments scheduled for today across all departments.</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-1 rounded">
                <Activity size={12} />
                85% CAPACITY
              </div>
            </div>
            <CalendarDays className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-8">
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'schedule' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Daily Schedule
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'calendar' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Calendar View
            </button>
            <button 
              onClick={() => setActiveTab('waitlist')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'waitlist' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Waitlist
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-slate-900">{format(today, 'MMMM yyyy')}</h3>
                    <div className="flex gap-1">
                      <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all">
                        <ChevronLeft size={20} />
                      </button>
                      <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {weekDays.map((day, i) => {
                      const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                      return (
                        <button 
                          key={i} 
                          className={cn(
                            "flex flex-col items-center p-3 rounded-2xl min-w-[64px] transition-all",
                            isToday ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                          )}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest mb-1">{format(day, 'EEE')}</span>
                          <span className="text-lg font-extrabold">{format(day, 'd')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                  <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                        placeholder="Search by patient, doctor, or type..." 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all">
                        <Filter size={18} />
                      </button>
                      <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {filteredAppointments.map((apt) => (
                      <div 
                        key={apt.id} 
                        onClick={() => setSelectedAppointment(apt)}
                        className={cn(
                          "p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-center gap-8 cursor-pointer",
                          selectedAppointment?.id === apt.id && "bg-slate-50 ring-1 ring-inset ring-primary/10"
                        )}
                      >
                        <div className="w-24 text-center shrink-0">
                          <div className="text-lg font-extrabold text-slate-900">{apt.time?.split(' ')[0]}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{apt.time?.split(' ')[1]}</div>
                        </div>
                        
                        <div className="flex-1 flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-bold text-slate-900">{apt.patientName}</h4>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                apt.type === 'Emergency' ? "bg-red-100 text-red-600" : 
                                apt.type === 'Surgery' ? "bg-purple-100 text-purple-600" :
                                "bg-blue-100 text-blue-600"
                              )}>
                                {apt.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                              <div className="flex items-center gap-1.5">
                                <Stethoscope size={14} className="text-slate-400" />
                                {apt.doctorName}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-slate-400" />
                                Room 402
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          {apt.type === 'Consultation' && (
                            <button className="p-2.5 bg-primary/5 text-primary rounded-xl hover:bg-primary/10 transition-all">
                              <Video size={18} />
                            </button>
                          )}
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                            apt.status === 'In-Progress' ? "bg-amber-100 text-amber-600 animate-pulse" : 
                            apt.status === 'Confirmed' ? "bg-blue-100 text-blue-600" :
                            "bg-emerald-100 text-emerald-600"
                          )}>
                            {apt.status}
                          </span>
                          <button className="text-slate-300 hover:text-slate-600 transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Doctor Availability</h3>
                    <button className="text-xs font-bold text-primary hover:underline">View Full Roster</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'Dr. Julius Ini', status: 'Available', time: 'Now', color: 'emerald' },
                      { name: 'Dr. Sarah Smith', status: 'In Surgery', time: 'Until 2:00 PM', color: 'purple' },
                      { name: 'Dr. Robert Fox', status: 'On Break', time: 'Until 1:30 PM', color: 'amber' },
                      { name: 'Dr. Jane Cooper', status: 'Available', time: 'Now', color: 'emerald' },
                    ].map((doc, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={16} />
                          </div>
                          <div className="text-sm font-bold text-slate-900">{doc.name}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", `bg-${doc.color}-500`)}></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{doc.status}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{doc.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Appointments;