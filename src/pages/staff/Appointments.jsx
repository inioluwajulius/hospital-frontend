import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parse } from 'date-fns';
import { api } from '../../services/api';
import { PageHeader, PrimaryButton, SecondaryButton, SearchInput, Panel, Modal, Field, TextInput, TextArea, Select, SubmitRow, LoadingBlock, EmptyRow, StatusBadge } from './StaffUI';
import { getCurrentUser, listOf, patientName, errorText, formatDateTime } from './staffUtils';

const STATUS_TONES = { scheduled: 'blue', 'in-progress': 'amber', completed: 'green', cancelled: 'red' };
const FILTERS = ['upcoming', 'today', 'all'];
const TIMES = ['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'];

const emptyBooking = () => ({ patientId: '', doctorId: '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00 AM', reason: '', isUrgent: false, mode: 'in-person' });

const StaffAppointments = () => {
  const canManage = getCurrentUser()?.role === 'receptionist';

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [booking, setBooking] = useState(emptyBooking);
  const [submitting, setSubmitting] = useState(false);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setAppointments(listOf(await api.getAppointments()));
    } catch (error) {
      toast.error(errorText(error, 'Could not load appointments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    if (canManage) {
      Promise.all([api.getPatients(), api.getDoctors()])
        .then(([p, d]) => {
          setPatients(listOf(p));
          setDoctors(listOf(d).filter((doc) => doc.status !== 'pending' && doc.status !== 'rejected'));
        })
        .catch((error) => toast.error(errorText(error, 'Could not load patients or doctors')));
    }
    // canManage comes from the stored role and doesn't change while mounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const q = search.trim().toLowerCase();
    return appointments
      .filter((a) => {
        const date = new Date(a.appointmentDate);
        if (filter === 'today' && date.toDateString() !== today) return false;
        if (filter === 'upcoming' && (date < new Date(now.toDateString()) || a.status === 'cancelled' || a.status === 'completed')) return false;
        if (!q) return true;
        return [patientName(a.patientId), a.doctorId?.name, a.reason].some((v) => String(v || '').toLowerCase().includes(q));
      })
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
  }, [appointments, filter, search]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!booking.patientId || !booking.doctorId || !booking.reason.trim()) {
      toast.error('Patient, doctor and reason are required');
      return;
    }
    const appointmentDate = parse(`${booking.date} ${booking.time}`, 'yyyy-MM-dd hh:mm a', new Date());
    if (Number.isNaN(appointmentDate.getTime())) {
      toast.error('Please choose a valid date and time');
      return;
    }
    try {
      setSubmitting(true);
      await api.createAppointment({
        patientId: booking.patientId,
        doctorId: booking.doctorId,
        appointmentDate: appointmentDate.toISOString(),
        reason: booking.reason,
        isUrgent: booking.isUrgent,
        mode: booking.mode,
      });
      toast.success('Appointment booked');
      setIsBookingOpen(false);
      setBooking(emptyBooking());
      loadAppointments();
    } catch (error) {
      toast.error(errorText(error, 'Could not book appointment'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (appointment) => {
    if (!window.confirm(`Cancel the appointment for ${patientName(appointment.patientId)}?`)) return;
    try {
      await api.updateAppointment(appointment._id, { status: 'cancelled' });
      setAppointments((prev) => prev.map((a) => (a._id === appointment._id ? { ...a, status: 'cancelled' } : a)));
      toast.success('Appointment cancelled');
    } catch (error) {
      toast.error(errorText(error, 'Could not cancel appointment'));
    }
  };

  const setField = (e) => {
    const { name, value, type, checked } = e.target;
    setBooking((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        icon={Calendar}
        title="Appointments"
        description={canManage ? 'Book and manage appointments for the hospital.' : "The hospital's appointment schedule."}
        action={canManage && (
          <PrimaryButton onClick={() => setIsBookingOpen(true)}>
            <Plus size={18} /> Book Appointment
          </PrimaryButton>
        )}
      />

      <Panel>
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by patient, doctor or reason..." />
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1 self-start">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <LoadingBlock text="Loading appointments..." />
        ) : visible.length === 0 ? (
          <EmptyRow>No appointments to show.</EmptyRow>
        ) : (
          <div className="divide-y divide-slate-50">
            {visible.map((a) => (
              <div key={a._id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-44 shrink-0 text-sm font-extrabold text-slate-900">{formatDateTime(a.appointmentDate)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">
                    {patientName(a.patientId)} {a.isUrgent && <StatusBadge tone="red">Urgent</StatusBadge>}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {a.doctorId?.name ? `Dr. ${a.doctorId.name.replace(/^Dr\.?\s*/i, '')}` : 'No doctor assigned'} · {a.reason || 'No reason given'}
                  </p>
                </div>
                <StatusBadge tone={STATUS_TONES[a.status] || 'slate'}>{a.status || 'scheduled'}</StatusBadge>
                {canManage && a.status === 'scheduled' && (
                  <SecondaryButton onClick={() => handleCancel(a)}>
                    <XCircle size={16} /> Cancel
                  </SecondaryButton>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal open={isBookingOpen} title="Book appointment" onClose={() => setIsBookingOpen(false)}>
        <form onSubmit={handleBook} className="space-y-4">
          <Field label="Patient">
            <Select name="patientId" value={booking.patientId} onChange={setField} placeholder="Select patient"
              options={patients.map((p) => ({ value: p._id, label: `${patientName(p)} (${p.patientCardNumber})` }))} />
          </Field>
          <Field label="Doctor">
            <Select name="doctorId" value={booking.doctorId} onChange={setField} placeholder="Select doctor"
              options={doctors.map((d) => ({ value: d._id, label: `${d.name}${d.specialization ? ` · ${d.specialization}` : ''}` }))} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date"><TextInput type="date" name="date" value={booking.date} onChange={setField} min={format(new Date(), 'yyyy-MM-dd')} /></Field>
            <Field label="Time"><Select name="time" value={booking.time} onChange={setField} options={TIMES.map((t) => ({ value: t, label: t }))} /></Field>
          </div>
          <Field label="Visit type">
            <Select name="mode" value={booking.mode} onChange={setField}
              options={[{ value: 'in-person', label: 'In person' }, { value: 'telemedicine', label: 'Video consultation (telemedicine)' }]} />
          </Field>
          <Field label="Reason"><TextArea name="reason" value={booking.reason} onChange={setField} /></Field>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isUrgent" checked={booking.isUrgent} onChange={setField} className="w-4 h-4 rounded" />
            Urgent
          </label>
          <div className="flex gap-3 pt-2">
            <SubmitRow onCancel={() => setIsBookingOpen(false)} submitting={submitting} label="Book" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffAppointments;
