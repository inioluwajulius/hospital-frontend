import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

import { api } from '../../services/api';

const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200"
  };

  const icons = {
    confirmed: <CheckCircle2 size={14} />,
    completed: <CheckCircle2 size={14} />,
    cancelled: <XCircle size={14} />,
    pending: <AlertCircle size={14} />
  };

  return (
    <span className={cn("px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 w-fit uppercase tracking-wider", styles[status])}>
      {icons[status]} {status}
    </span>
  );
};

const AppointmentCard = ({ appointment }) => {
  const doctorName = appointment.doctorId?.name || 'Unassigned Doctor';
  const department = appointment.doctorId?.specialization || 'General';
  const aptDate = new Date(appointment.appointmentDate);

  return (
  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h4 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">{doctorName}</h4>
        <p className="text-sm font-medium text-slate-500">{department}</p>
      </div>
      <StatusBadge status={appointment.status} />
    </div>

    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
        <CalendarIcon size={16} className="text-slate-400" />
        {aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
        <Clock size={16} className="text-slate-400" />
        {aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium col-span-2">
        <MapPin size={16} className="text-slate-400" />
        {appointment.location || 'Hospital Main Building'}
      </div>
    </div>

    {appointment.notes && (
      <div className="mt-4 pt-4 border-t border-slate-50">
        <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">Notes:</span> {appointment.notes}</p>
      </div>
    )}

    {appointment.status === 'scheduled' && (
      <div className="mt-5 flex gap-3">
        <button className="flex-1 bg-white border border-red-200 hover:border-red-300 text-red-600 py-2 rounded-xl text-sm font-bold transition-all hover:bg-red-50">
          Cancel
        </button>
      </div>
    )}
  </div>
);
};

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
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
      const [aptRes, docRes] = await Promise.all([
        api.getAppointments(),
        api.getDoctors()
      ]);
      setAppointments(aptRes.data?.data || aptRes.data || []);
      setDoctors(docRes.data?.data || docRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      // Combine date and time
      const dateTime = new Date(`${newAppointment.appointmentDate}T${newAppointment.time}`);
      
      await api.createAppointment({
        doctorId: newAppointment.doctorId,
        appointmentDate: dateTime,
        reason: newAppointment.reason
      });
      
      setShowModal(false);
      fetchData(); // Refresh list
    } catch (err) {
      console.error('Failed to book appointment', err);
      alert('Failed to book appointment');
    }
  };

  const upcomingAppointments = appointments.filter(a => new Date(a.appointmentDate) >= new Date() && a.status !== 'cancelled');
  const pastAppointments = appointments.filter(a => new Date(a.appointmentDate) < new Date() || a.status === 'cancelled');
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your upcoming visits and view past history.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
        >
          <Plus size={18} />
          Book Appointment
        </motion.button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Book Appointment</h2>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Select Doctor</label>
                <select 
                  required
                  className="w-full border rounded-lg p-2"
                  value={newAppointment.doctorId}
                  onChange={(e) => setNewAppointment({...newAppointment, doctorId: e.target.value})}
                >
                  <option value="">-- Choose a Doctor --</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Date</label>
                  <input type="date" required className="w-full border rounded-lg p-2" 
                    value={newAppointment.appointmentDate} onChange={e => setNewAppointment({...newAppointment, appointmentDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Time</label>
                  <input type="time" required className="w-full border rounded-lg p-2" 
                    value={newAppointment.time} onChange={e => setNewAppointment({...newAppointment, time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Reason for Visit</label>
                <textarea required className="w-full border rounded-lg p-2 h-24" 
                  value={newAppointment.reason} onChange={e => setNewAppointment({...newAppointment, reason: e.target.value})} />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-primary rounded-lg hover:bg-primary/90">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Upcoming Appointments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(apt => <AppointmentCard key={apt.id} appointment={apt} />)
          ) : (
            <div className="col-span-full p-8 text-center bg-white border border-slate-100 rounded-2xl">
              <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No upcoming appointments.</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Past Appointments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastAppointments.map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientAppointments;
