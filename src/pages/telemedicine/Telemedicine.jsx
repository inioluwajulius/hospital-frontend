import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Plus, Trash2, Save, Calendar, Stethoscope, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { PageHeader, Panel, PrimaryButton, SecondaryButton, Select, TextInput, LoadingBlock, EmptyRow, StatusBadge } from '../staff/StaffUI';
import { getCurrentUser, listOf, patientName, errorText, formatDateTime } from '../staff/staffUtils';
import { DAY_NAMES, formatAvailability } from '../../utils/availability';

const STATUS_TONES = { scheduled: 'blue', 'in-progress': 'green', completed: 'slate', cancelled: 'red' };
const doctorLabel = (name) => (name ? `Dr. ${String(name).replace(/^Dr\.?\s*/i, '')}` : 'Doctor');

/** Doctor: edit weekly consulting hours */
const AvailabilityEditor = ({ initial }) => {
  const [slots, setSlots] = useState(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => setSlots(initial), [initial]);

  const update = (i, field, value) => setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: field === 'day' ? Number(value) : value } : s)));

  const save = async () => {
    if (slots.some((s) => !s.start || !s.end || s.start >= s.end)) {
      toast.error('Each time slot needs a start time before its end time');
      return;
    }
    setSaving(true);
    try {
      const res = await api.updateMyAvailability(slots);
      setSlots(res.data.data);
      toast.success('Availability saved');
    } catch (err) {
      toast.error(errorText(err, 'Could not save availability'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><Clock size={18} /> My availability</h2>
        <p className="text-sm text-slate-500">Patients can only book you during these hours (urgent cases excepted). Leave empty to accept any time.</p>
      </div>
      {slots.length === 0 && <p className="text-sm text-slate-400">No hours set.</p>}
      {slots.map((slot, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <Select aria-label="Day" className="w-40" value={slot.day} onChange={(e) => update(i, 'day', e.target.value)} options={DAY_NAMES.map((d, idx) => ({ value: idx, label: d }))} />
          <TextInput aria-label="Start time" type="time" className="w-32" value={slot.start} onChange={(e) => update(i, 'start', e.target.value)} />
          <span className="text-slate-400 text-sm">to</span>
          <TextInput aria-label="End time" type="time" className="w-32" value={slot.end} onChange={(e) => update(i, 'end', e.target.value)} />
          <button type="button" onClick={() => setSlots((prev) => prev.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-red-500" aria-label="Remove time slot">
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        <SecondaryButton type="button" onClick={() => setSlots((prev) => [...prev, { day: 1, start: '09:00', end: '17:00' }])}>
          <Plus size={16} /> Add hours
        </SecondaryButton>
        <PrimaryButton type="button" onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl">
          <Save size={16} /> {saving ? 'Saving...' : 'Save availability'}
        </PrimaryButton>
      </div>
    </Panel>
  );
};

const ConsultationList = ({ title, items, role, empty }) => (
  <Panel>
    <div className="px-6 py-4 border-b border-slate-50 font-extrabold text-slate-900">{title}</div>
    {items.length === 0 ? <EmptyRow>{empty}</EmptyRow> : (
      <div className="divide-y divide-slate-50">
        {items.map((a) => {
          const other = role === 'doctor' ? patientName(a.patientId) : doctorLabel(a.doctorId?.name);
          const open = ['scheduled', 'in-progress'].includes(a.status);
          return (
            <div key={a._id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">{other}</p>
                <p className="text-xs text-slate-500 font-medium">{formatDateTime(a.appointmentDate)}{a.reason ? ` · ${a.reason}` : ''}</p>
              </div>
              <StatusBadge tone={STATUS_TONES[a.status] || 'slate'}>{a.status}</StatusBadge>
              <Link
                to={`/consultation/${a._id}`}
                className={open
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2'}
              >
                <Video size={16} /> {a.status === 'in-progress' ? 'Join now' : open ? 'Open room' : 'View'}
              </Link>
            </div>
          );
        })}
      </div>
    )}
  </Panel>
);

/**
 * /telemedicine  hub for remote consultations (doctor and patient).
 */
const Telemedicine = () => {
  const user = getCurrentUser();
  const role = user?.role;
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.getAppointments(), api.getDoctors()])
      .then(([apts, docs]) => {
        if (apts.status === 'fulfilled') setAppointments(listOf(apts.value).filter((a) => a.mode === 'telemedicine'));
        else toast.error(errorText(apts.reason, 'Could not load consultations'));
        if (docs.status === 'fulfilled') setDoctors(listOf(docs.value).filter((d) => !['pending', 'rejected', 'inactive', 'suspended'].includes(d.status)));
      })
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => ({
    live: appointments.filter((a) => a.status === 'in-progress'),
    upcoming: appointments.filter((a) => a.status === 'scheduled').sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)),
    past: appointments.filter((a) => ['completed', 'cancelled'].includes(a.status)).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)),
  }), [appointments]);

  const myAvailability = useMemo(() => doctors.find((d) => String(d._id) === String(user?.id))?.availability || [], [doctors, user?.id]);

  if (loading) return <LoadingBlock text="Loading telemedicine..." />;

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        icon={Video}
        title="Telemedicine"
        description={role === 'doctor'
          ? 'Your video consultations and consulting hours.'
          : 'See a doctor from wherever you are. Calls are audio-first to save data, and chat works on any connection.'}
        action={role === 'patient' && (
          <Link to="/patient/appointments?book=telemedicine" className="bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
            <Calendar size={18} /> Book a video consultation
          </Link>
        )}
      />

      {groups.live.length > 0 && <ConsultationList title="Live now" items={groups.live} role={role} empty="" />}
      <ConsultationList title="Upcoming" items={groups.upcoming} role={role} empty={role === 'doctor' ? 'No upcoming video consultations.' : 'No upcoming video consultations. Use "Book video consultation" next to a doctor below.'} />

      {role === 'doctor' && <AvailabilityEditor initial={myAvailability} />}

      {role === 'patient' && (
        <Panel>
          <div className="px-6 py-4 border-b border-slate-50 font-extrabold text-slate-900 flex items-center gap-2"><Stethoscope size={18} /> Doctors available for consultation</div>
          {doctors.length === 0 ? <EmptyRow>No doctors are available at your hospital yet.</EmptyRow> : (
            <div className="divide-y divide-slate-50">
              {doctors.map((d) => (
                <div key={d._id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{doctorLabel(d.name)}</p>
                    <p className="text-xs text-slate-500 font-medium">{d.specialization || 'General practice'}{d.yearsOfExperience ? ` · ${d.yearsOfExperience} yrs experience` : ''}</p>
                    <p className="text-xs text-slate-600 mt-1"><span className="font-bold">Hours:</span> {formatAvailability(d.availability, 'Any time during clinic hours')}</p>
                  </div>
                  <Link
                    to={`/patient/appointments?book=telemedicine&doctor=${d._id}`}
                    aria-label={`Book a video consultation with ${doctorLabel(d.name)}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Calendar size={16} /> Book video consultation
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      <ConsultationList title="Past consultations" items={groups.past} role={role} empty="No past video consultations." />
    </div>
  );
};

export default Telemedicine;
